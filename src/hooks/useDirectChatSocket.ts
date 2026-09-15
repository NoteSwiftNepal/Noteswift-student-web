"use client";

// Dedicated Socket.IO connection for student<->teacher direct chat (the Ask
// section) — a SEPARATE connection from live-class chat's own socket
// (useLiveClassSocket.ts), scoped to whichever Ask/chat page currently has
// this hook mounted (connects on mount, disconnects on unmount), same as
// mobile scopes its own direct-chat socket to the Ask screens' lifetime
// rather than sharing a global connection. Event names/payloads/ack shapes
// transcribed directly from src/socket/directChatHandler.ts +
// directChatProtocol.ts (backend), not the task summary.
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/api/axios";
import { getConversations, signChatUpload } from "@/api/student/messages";
import { useDirectChatStore } from "@/stores/directChatStore";
import { attachmentPreviewText, classifyAckFailure, conversationKey } from "@/lib/directChat";
import type {
  ConversationSummary,
  DirectAttachment,
  JoinConversationAck,
  LoadEarlierMessagesAck,
  MarkReadAck,
  ServerDirectMessage,
  SendDirectMessageAck,
  SyncDirectMessagesAck,
} from "@/types/direct-chat";

export type DirectChatConnectionState = "disconnected" | "connecting" | "connected";

// Mirrors the backend's HISTORY_LIMIT (directChatHandler.ts) — a
// join-conversation snapshot smaller than this IS the entire history, so
// load-earlier-messages never needs to be attempted for that conversation.
const HISTORY_LIMIT = 50;
const ACK_TIMEOUT_MS = 8000;

// Same convention as the backend's CHAT_IMAGE_ALLOWED_TYPES/
// CHAT_IMAGE_MAX_BYTES (chatImageUploadService.ts) — checked again
// client-side so an oversized/wrong-type file is rejected with a clear
// message before any network activity.
export const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const CHAT_IMAGE_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
export const CHAT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const CHAT_DOCUMENT_ALLOWED_TYPES = new Set(["application/pdf"]);

export function validateChatImagePick(file: File): { ok: true } | { ok: false; message: string } {
  if (!CHAT_IMAGE_ALLOWED_TYPES.has(file.type)) return { ok: false, message: `Unsupported image type: ${file.type}` };
  if (file.size > CHAT_IMAGE_MAX_BYTES) return { ok: false, message: `Image exceeds the ${CHAT_IMAGE_MAX_BYTES / (1024 * 1024)}MB limit` };
  return { ok: true };
}

export function validateChatDocumentPick(file: File): { ok: true } | { ok: false; message: string } {
  if (!CHAT_DOCUMENT_ALLOWED_TYPES.has(file.type)) return { ok: false, message: `Unsupported document type: ${file.type}` };
  if (file.size > CHAT_DOCUMENT_MAX_BYTES) return { ok: false, message: `Document exceeds the ${CHAT_DOCUMENT_MAX_BYTES / (1024 * 1024)}MB limit` };
  return { ok: true };
}

function socketOrigin(): string {
  return API_BASE_URL.match(/^(https?:\/\/[^/]+)/)?.[1] ?? API_BASE_URL;
}

function emitWithAck<T>(socket: Socket, event: string, payload: unknown, timeoutMs = ACK_TIMEOUT_MS): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, timeoutMs);
    socket.emit(event, payload, (ack: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ack);
    });
  });
}

export function useDirectChatSocket(studentId: string | undefined, accessToken: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<DirectChatConnectionState>("disconnected");
  // Retrying a failed UPLOAD needs the original File object again — unlike
  // mobile's local file:// URI (still valid on disk after failure), a
  // browser File is only reachable from wherever the picker handed it to
  // us, so it's kept here (not in the zustand store, which only holds
  // serializable/reactive state) keyed by clientMessageId until the upload
  // either succeeds or the message is otherwise abandoned.
  const pendingFilesRef = useRef<Map<string, { kind: "image" | "document"; file: File }>>(new Map());

  const mergeIncoming = useDirectChatStore((s) => s.mergeIncoming);
  const touchConversation = useDirectChatStore((s) => s.touchConversation);
  const setConversations = useDirectChatStore((s) => s.setConversations);

  // Returns `null` specifically on failure (network/server error) — distinct
  // from a genuinely empty `[]` list — so a caller showing this as the
  // page's primary content can tell "you have zero conversations" apart
  // from "the fetch failed" and render the right one of those two states.
  // The reconnect-rejoin loop below only cares about "got a list or not,"
  // so it treats both the same (an empty array either way).
  const refreshConversations = useCallback(async (): Promise<ConversationSummary[] | null> => {
    try {
      const res = await getConversations();
      if (res.error) return null;
      const conversations = res.result.conversations as unknown as ConversationSummary[];
      setConversations(conversations);
      return conversations;
    } catch {
      return null;
    }
  }, [setConversations]);

  const joinConversation = useCallback(async (teacherId: string, courseId: string, subjectName: string): Promise<JoinConversationAck | null> => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return null;
    return emitWithAck<JoinConversationAck>(socket, "join-conversation", { otherPartyId: teacherId, courseId, subjectName });
  }, []);

  const syncConversation = useCallback(async (teacherId: string, subjectName: string) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    const sinceId = useDirectChatStore.getState().latestConfirmedIdFor(teacherId, subjectName);
    if (!sinceId) return; // cold start — nothing to sync since, the join snapshot already covers it
    const ack = await emitWithAck<SyncDirectMessagesAck>(socket, "sync-direct-messages", { otherPartyId: teacherId, subjectName, sinceId });
    if (ack?.ok) {
      useDirectChatStore.getState().mergeSynced(teacherId, subjectName, ack.messages);
    }
  }, []);

  const loadEarlierMessages = useCallback(async (teacherId: string, subjectName: string): Promise<{ ok: boolean; hasMore: boolean }> => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return { ok: false, hasMore: true };
    const beforeId = useDirectChatStore.getState().oldestConfirmedIdFor(teacherId, subjectName);
    if (!beforeId) return { ok: false, hasMore: true };
    const ack = await emitWithAck<LoadEarlierMessagesAck>(socket, "load-earlier-messages", { otherPartyId: teacherId, subjectName, beforeId });
    if (ack?.ok) {
      useDirectChatStore.getState().prependOlderMessages(teacherId, subjectName, ack.messages, ack.hasMore);
      return { ok: true, hasMore: ack.hasMore };
    }
    return { ok: false, hasMore: true };
  }, []);

  const emitSendAndReconcile = useCallback(
    async (teacherId: string, subjectName: string, courseId: string, clientMessageId: string, message: string, attachment?: DirectAttachment) => {
      const socket = socketRef.current;
      const store = useDirectChatStore.getState();
      if (!socket || !socket.connected) {
        // No auto-retry loop for direct chat, matching mobile's own
        // deliberate choice not to replay a queued send blind after a long
        // gap — a manual retry (tap-to-retry) stays available via
        // retryMessage below.
        store.markSendFailure(teacherId, subjectName, clientMessageId, "retryable", "Not connected");
        return;
      }

      const ack = await emitWithAck<SendDirectMessageAck>(socket, "send-direct-message", {
        otherPartyId: teacherId,
        courseId,
        subjectName,
        message,
        attachment,
        clientMessageId,
      });

      if (ack?.ok) {
        store.markSendSuccess(teacherId, subjectName, clientMessageId, ack.message);
        store.touchConversation({
          teacherId,
          subjectName,
          courseName: ack.message.courseName,
          courseId: ack.message.courseId,
          message: attachmentPreviewText(ack.message.message, ack.message.attachment),
          createdAt: ack.message.createdAt,
          senderType: "student",
        });
      } else if (ack && ack.ok === false) {
        store.markSendFailure(teacherId, subjectName, clientMessageId, classifyAckFailure(ack.reason), ack.message);
      } else {
        // Timed out — no definite answer either way, treated as retryable.
        store.markSendFailure(teacherId, subjectName, clientMessageId, "retryable", "Timed out");
      }
    },
    []
  );

  const sendMessage = useCallback(
    (teacherId: string, subjectName: string, courseId: string, message: string) => {
      const trimmed = message.trim();
      if (!trimmed || !studentId) return;
      const clientMessageId = useDirectChatStore.getState().beginSend({ teacherId, subjectName, studentId, message: trimmed });
      emitSendAndReconcile(teacherId, subjectName, courseId, clientMessageId, trimmed);
    },
    [studentId, emitSendAndReconcile]
  );

  const retryMessage = useCallback(
    (teacherId: string, subjectName: string, courseId: string, clientMessageId: string) => {
      const message = useDirectChatStore.getState().messagesFor(teacherId, subjectName).find((m) => m.clientMessageId === clientMessageId);
      if (!message) return;
      useDirectChatStore.getState().markSendPending(teacherId, subjectName, clientMessageId);
      emitSendAndReconcile(teacherId, subjectName, courseId, clientMessageId, message.message, message.attachment);
    },
    [emitSendAndReconcile]
  );

  const uploadAndAttach = useCallback(
    async (kind: "image" | "document", teacherId: string, subjectName: string, courseId: string, clientMessageId: string, file: File, caption: string) => {
      try {
        const sigRes = await signChatUpload(file.name, file.type, file.size);
        if (sigRes.error) throw new Error(sigRes.message || "Failed to get upload URL");
        const { uploadUrl, publicUrl } = sigRes.result;

        const putRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!putRes.ok) throw new Error(`Upload failed with status ${putRes.status}`);

        const attachment: DirectAttachment =
          kind === "document" ? { url: publicUrl, type: "document", size: file.size, filename: file.name } : { url: publicUrl, type: "image", size: file.size };
        useDirectChatStore.getState().markUploadSuccess(teacherId, subjectName, clientMessageId, attachment);
        pendingFilesRef.current.delete(clientMessageId);
        await emitSendAndReconcile(teacherId, subjectName, courseId, clientMessageId, caption.trim(), attachment);
      } catch {
        useDirectChatStore.getState().markUploadFailure(teacherId, subjectName, clientMessageId);
      }
    },
    [emitSendAndReconcile]
  );

  const sendImage = useCallback(
    (teacherId: string, subjectName: string, courseId: string, file: File, caption: string) => {
      if (!studentId) return;
      const localPreviewUrl = URL.createObjectURL(file);
      const clientMessageId = useDirectChatStore.getState().beginUpload({ teacherId, subjectName, studentId, localPreviewUrl, caption, kind: "image" });
      pendingFilesRef.current.set(clientMessageId, { kind: "image", file });
      uploadAndAttach("image", teacherId, subjectName, courseId, clientMessageId, file, caption);
    },
    [studentId, uploadAndAttach]
  );

  const sendDocument = useCallback(
    (teacherId: string, subjectName: string, courseId: string, file: File, caption: string) => {
      if (!studentId) return;
      const localPreviewUrl = URL.createObjectURL(file);
      const clientMessageId = useDirectChatStore.getState().beginUpload({ teacherId, subjectName, studentId, localPreviewUrl, caption, kind: "document", filename: file.name });
      pendingFilesRef.current.set(clientMessageId, { kind: "document", file });
      uploadAndAttach("document", teacherId, subjectName, courseId, clientMessageId, file, caption);
    },
    [studentId, uploadAndAttach]
  );

  // Retries a FAILED UPLOAD (status 'failed-upload') — re-attempts the PUT
  // using the same File object kept in pendingFilesRef, never re-picks.
  // Distinct from retryMessage, which retries a failed SEND after a
  // successful upload.
  const retryFailedUpload = useCallback(
    (teacherId: string, subjectName: string, courseId: string, clientMessageId: string) => {
      const message = useDirectChatStore.getState().messagesFor(teacherId, subjectName).find((m) => m.clientMessageId === clientMessageId);
      const pending = pendingFilesRef.current.get(clientMessageId);
      if (!message || message.status !== "failed-upload" || !pending) return;
      useDirectChatStore.getState().retryImageUpload(teacherId, subjectName, clientMessageId);
      uploadAndAttach(pending.kind, teacherId, subjectName, courseId, clientMessageId, pending.file, message.message);
    },
    [uploadAndAttach]
  );

  // Bug-fix ordering (matches mobile's own documented fix): check socket
  // connectivity BEFORE flipping local read state, not after. Marking the
  // local state read first and only then discovering the socket isn't
  // connected means the emit silently never reaches the server, yet the UI
  // already looks read — the badge desyncs from the server and never
  // self-heals, since nothing will ever retry an emit for a message the
  // client already believes is read. Checking first means a genuinely
  // disconnected call leaves the message optimistically unread, so the
  // caller's own "is there still an unread message, and are we connected"
  // effect condition naturally retries once reconnected.
  const markRead = useCallback(async (teacherId: string, subjectName: string): Promise<void> => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    useDirectChatStore.getState().markThreadRead(teacherId, subjectName);
    await emitWithAck<MarkReadAck>(socket, "mark-read", { otherPartyId: teacherId, subjectName });
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(socketOrigin(), {
      auth: { token: accessToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket"],
    });
    socketRef.current = socket;
    setConnectionState("connecting");

    // Fires on the initial connect AND every automatic reconnection — both
    // times, every conversation already known (from the REST list) needs to
    // be rejoined and synced, not just the one currently open. This is the
    // mitigation for Phase A's real, documented gap: there's no "personal
    // inbox" room in this protocol, so a conversation this client has never
    // joined (a brand-new one) can't receive a live push until it's
    // explicitly joined — see MOBILE_APP_CODE_ISSUES.md.
    const rejoinAndSyncKnown = async () => {
      const conversations = (await refreshConversations()) ?? [];
      for (const c of conversations) {
        if (!c.courseId) continue;
        const ack = await joinConversation(c.teacherId, c.courseId, c.subjectName);
        if (ack?.ok) {
          await syncConversation(c.teacherId, c.subjectName);
        }
      }
    };

    socket.on("connect", () => {
      setConnectionState("connected");
      rejoinAndSyncKnown();
    });
    socket.on("disconnect", (reason) => {
      if (reason === "io client disconnect") return;
      setConnectionState("disconnected");
    });
    socket.on("connect_error", () => setConnectionState("disconnected"));

    socket.on("receive-direct-message", (message: ServerDirectMessage) => {
      mergeIncoming(message.teacherId, message.subjectName, message);
      touchConversation({
        teacherId: message.teacherId,
        subjectName: message.subjectName,
        courseName: message.courseName,
        courseId: message.courseId,
        message: attachmentPreviewText(message.message, message.attachment),
        createdAt: message.createdAt,
        senderType: message.senderType,
        // This connection doesn't know which thread (if any) is currently
        // focused, so it always increments; the thread screen's own
        // markRead-on-view call clears it moments later if the student is
        // actually looking at that exact thread.
        incrementUnread: message.senderType === "teacher",
      });
    });

    socket.on("previous-direct-messages", (data: { teacherId: string; subjectName: string; messages: ServerDirectMessage[] }) => {
      const messages = data.messages || [];
      useDirectChatStore.getState().mergeSynced(data.teacherId, data.subjectName, messages);
      // Snapshot smaller than the server's own history cap IS the entire
      // conversation — skip ever attempting load-earlier-messages for it.
      // Does not overwrite an already-known hasMore:false from a prior
      // pagination call (only ever sets it when the snapshot itself is
      // under the cap).
      if (messages.length < HISTORY_LIMIT) {
        useDirectChatStore.getState().setHasMoreHistory(data.teacherId, data.subjectName, false);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return {
    connectionState,
    refreshConversations,
    joinConversation,
    syncConversation,
    loadEarlierMessages,
    sendMessage,
    retryMessage,
    sendImage,
    sendDocument,
    retryFailedUpload,
    markRead,
  };
}
