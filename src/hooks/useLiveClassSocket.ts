"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/api/axios";
import type { ChatMessage, JoinClassroomAck, RaisedHand, SendMessageAck, SyncMessagesAck } from "@/types/live-class";
import { latestConfirmedMessageId, mergeIncomingMessage, mergeSyncedMessages } from "@/lib/liveClassChat";

export type EditMessageAck =
  | { ok: true; message: ChatMessage }
  | { ok: false; reason: string; maxLength?: number };
export type DeleteMessageAck = { ok: true; messageId: string } | { ok: false; reason: string };

// user-typing/user-stopped-typing has no cooldown/debounce built into the
// backend itself (chatHandler.ts just adds/removes the sender from a Set
// and rebroadcasts) — this client-side timeout is what turns "typing" back
// off automatically if the student stops without explicitly clearing the
// input (closing the tab, switching apps, etc.), matching the standard
// chat-app UX for this event rather than a backend requirement.
const TYPING_STOP_DELAY_MS = 3000;

const ACK_TIMEOUT_MS = 8000;

function emitWithAck<T = unknown>(socket: Socket, event: string, payload: unknown, timeoutMs = ACK_TIMEOUT_MS): Promise<T | null> {
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

export type ChatConnectionState = "connecting" | "joining" | "connected" | "disconnected" | "failed";

// socket.io-client treats any path in the connection URL as a namespace
// rather than an HTTP path (confirmed against mobile's LiveClassOverlay.tsx,
// which hit this too) — API_BASE_URL includes the /api/student REST prefix,
// so it has to be stripped down to a bare origin here.
function socketOrigin(): string {
  return API_BASE_URL.match(/^(https?:\/\/[^/]+)/)?.[1] ?? API_BASE_URL;
}

// Real-time classroom chat + raise-hand, over the same socket.io namespace
// and events mobile uses (src/socket/chatHandler.ts, verified directly
// against that file, not the CODEBASE_MAP.md summary — see Phase 4 report).
//
// Deliberately simpler than mobile's LiveClassOverlay.tsx: no persistent
// outbox/backoff/optimistic-message reliability system. That machinery
// exists there for flaky mobile networks and OS-suspended backgrounding —
// conditions a browser tab doesn't really have — so a send either succeeds
// (ack) or the caller sees a failure and can just press send again. See
// MOBILE_APP_CODE_ISSUES.md for the full reasoning.
export function useLiveClassSocket(
  classroomId: string | undefined,
  accessToken: string | null,
  studentId: string | undefined
) {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ChatConnectionState>("connecting");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [classEnded, setClassEnded] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Read from inside the socket effect (which only re-runs when classroomId/
  // accessToken change) to always see the LATEST messages at join/reconnect
  // time for the sync-messages cursor below, not whatever they were when the
  // effect first ran.
  const messagesRef = useRef<ChatMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!classroomId || !accessToken) return;

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

    // The reconnect-recovery sequence mobile's LiveClassOverlay.tsx and the
    // teacher web app's LiveRoomContext.tsx both run on every 'connect':
    // join-classroom (ack) -> sync-messages (delta since the latest message
    // this client already has). 'previous-messages' (below) only arrives
    // once, as part of THIS join-classroom call, so without also calling
    // sync-messages here, any reconnect after the first one (socket.io-client
    // auto-reconnecting after a transient drop, without the page itself
    // unmounting/remounting) had no way to catch up on messages broadcast
    // while disconnected — they'd only ever surface via a full page
    // navigation away and back, which forces a brand new join and a fresh
    // 'previous-messages' snapshot.
    const performJoin = async () => {
      setConnectionState("joining");
      const joinAck = await emitWithAck<JoinClassroomAck>(socket, "join-classroom", { classroomId });
      if (!joinAck || !joinAck.ok) {
        setJoinError(joinAck?.ok === false ? joinAck.reason : "join_failed");
        setConnectionState("failed");
        return;
      }
      setJoinError(null);
      setConnectionState("connected");

      const sinceId = latestConfirmedMessageId(messagesRef.current);
      if (!sinceId) return; // cold start — 'previous-messages' below already covers it
      const syncAck = await emitWithAck<SyncMessagesAck>(socket, "sync-messages", { classroomId, sinceId });
      if (syncAck?.ok) {
        setMessages((prev) => mergeSyncedMessages(prev, syncAck.messages, syncAck.deletedMessageIds));
      }
    };

    // Fires on the initial connection AND every automatic reconnection —
    // rejoining (and re-syncing history/raised hands via the server's own
    // join-classroom response) is exactly what should happen both times.
    socket.on("connect", performJoin);

    socket.on("disconnect", (reason: string) => {
      // A disconnect this hook's own cleanup initiated doesn't need a
      // "disconnected" UI state — the socket and this component are both
      // going away together.
      if (reason === "io client disconnect") return;
      setConnectionState("disconnected");
    });

    // Merge, not replace — this fires on every successful join, including
    // reconnect-triggered rejoins, and a destructive replace could race with
    // (and wipe) a sync-messages merge from the same performJoin call, or
    // drop a message that arrived via a live receive-message in the gap
    // between join-classroom's ack and this event.
    socket.on("previous-messages", (msgs: ChatMessage[]) =>
      setMessages((prev) => mergeSyncedMessages(prev, msgs || []))
    );
    socket.on("receive-message", (msg: ChatMessage) =>
      setMessages((prev) => mergeIncomingMessage(prev, msg))
    );
    // message-edited/message-deleted broadcast to every participant
    // (backend's io.to(meetingId).emit(...)) — applies here regardless of
    // who edited/deleted, own or someone else's, same as receive-message.
    socket.on("message-edited", (data: ChatMessage) =>
      setMessages((prev) => prev.map((m) => (m.id === data.id ? { ...m, ...data } : m)))
    );
    socket.on("message-deleted", (data: { messageId: string }) =>
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId))
    );
    // pin-message/unpin-message are teacher-only to TRIGGER (chatHandler.ts
    // rejects a student's attempt with NOT_AUTHORIZED), but the resulting
    // 'message-pinned' broadcast still reaches every participant — a
    // student should still see what the teacher pinned, just can't pin/
    // unpin themselves. Both pin and unpin broadcast the identical event
    // name with the message's current `pinned` field, so one listener
    // handles both.
    socket.on("message-pinned", (data: ChatMessage) =>
      setMessages((prev) => prev.map((m) => (m.id === data.id ? { ...m, ...data } : m)))
    );
    socket.on("raised-hands-sync", (hands: RaisedHand[]) => setRaisedHands(hands ?? []));
    socket.on("hand-raised", (data: { raisedHands: RaisedHand[] }) => setRaisedHands(data.raisedHands ?? []));
    socket.on("hand-lowered", (data: { raisedHands: RaisedHand[] }) => setRaisedHands(data.raisedHands ?? []));
    socket.on("users-typing", (userIds: string[]) => setTypingUserIds(userIds ?? []));
    socket.on("class-ended", () => setClassEnded(true));

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit("leave-classroom", { classroomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [classroomId, accessToken]);

  const sendMessage = useCallback(
    (message: string): Promise<SendMessageAck> => {
      return new Promise((resolve) => {
        const socket = socketRef.current;
        if (!socket || !classroomId) {
          resolve({ ok: false, reason: "not_connected" });
          return;
        }
        const clientMessageId =
          typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
        socket.emit(
          "send-message",
          { classroomId, message, clientMessageId },
          (ack: SendMessageAck) => resolve(ack ?? { ok: false, reason: "timeout" })
        );
      });
    },
    [classroomId]
  );

  // Own-message edit/delete — chatHandler.ts authorizes by
  // `senderId: identity.id` (any role, not teacher-only), so a student can
  // edit/delete messages they sent, same as a teacher can theirs. The web
  // ChatPanel restricts the UI affordance to the sender's own bubbles;
  // the server re-checks ownership regardless.
  const editMessage = useCallback(
    (messageId: string, message: string): Promise<EditMessageAck> => {
      return new Promise((resolve) => {
        const socket = socketRef.current;
        if (!socket) {
          resolve({ ok: false, reason: "not_connected" });
          return;
        }
        socket.emit("edit-message", { messageId, message }, (ack: EditMessageAck) =>
          resolve(ack ?? { ok: false, reason: "timeout" })
        );
      });
    },
    []
  );

  const deleteMessage = useCallback((messageId: string): Promise<DeleteMessageAck> => {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket) {
        resolve({ ok: false, reason: "not_connected" });
        return;
      }
      socket.emit("delete-message", { messageId }, (ack: DeleteMessageAck) =>
        resolve(ack ?? { ok: false, reason: "timeout" })
      );
    });
  }, []);

  // Fires user-typing once per burst of keystrokes and auto-fires
  // user-stopped-typing after a pause — the caller (the message input)
  // just calls this on every keystroke, no debouncing of its own needed.
  const notifyTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !classroomId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("user-typing", { classroomId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("user-stopped-typing", { classroomId });
    }, TYPING_STOP_DELAY_MS);
  }, [classroomId]);

  const handRaised = studentId ? raisedHands.some((h) => h.userId === studentId) : false;

  const raiseHand = useCallback(() => {
    if (!classroomId) return;
    socketRef.current?.emit("raise-hand", { classroomId });
  }, [classroomId]);

  const lowerHand = useCallback(() => {
    if (!classroomId) return;
    socketRef.current?.emit("lower-hand", { classroomId });
  }, [classroomId]);

  return {
    connectionState,
    joinError,
    messages,
    raisedHands,
    typingUserIds: studentId ? typingUserIds.filter((id) => id !== studentId) : typingUserIds,
    handRaised,
    classEnded,
    sendMessage,
    editMessage,
    deleteMessage,
    notifyTyping,
    raiseHand,
    lowerHand,
  };
}
