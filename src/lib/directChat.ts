// Pure, framework-agnostic direct-chat logic — ported from mobile's
// lib/directChat.ts, minus the outbox/backoff-scheduling machinery (see
// types/direct-chat.d.ts's header comment for why: this app doesn't
// auto-retry a failed send, matching mobile's OWN real behavior for this
// specific feature — "No outbox flush loop tries this automatically for
// direct chat," per useDirectChatSocket.ts's send-path comment — so there's
// no scheduler to port, only the parts of mobile's module that deal with
// merging/reconciling messages and the conversation list).
import type {
  ConversationSummary,
  DirectAttachment,
  DirectChatMessage,
  ServerDirectMessage,
} from "@/types/direct-chat";

export function conversationKey(teacherId: string, subjectName: string): string {
  return `${teacherId}::${subjectName}`;
}

export function localMessageId(clientMessageId: string): string {
  return `local:${clientMessageId}`;
}

export function generateClientMessageId(studentId: string): string {
  const rand = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${studentId}:${rand}`;
}

// Centralized so every call site (conversation list touch, both from a
// send and a receive) agrees on the caption-less-attachment preview text.
export function attachmentPreviewText(message: string, attachment?: DirectAttachment | null): string {
  if (message) return message;
  if (!attachment) return message;
  return attachment.type === "document" ? `📄 ${attachment.filename || "Document"}` : "📷 Photo";
}

export function createOptimisticMessage(params: {
  clientMessageId: string;
  message: string;
  senderType: "student" | "teacher";
  attachment?: DirectAttachment;
}): DirectChatMessage {
  return {
    id: localMessageId(params.clientMessageId),
    clientMessageId: params.clientMessageId,
    message: params.message,
    senderType: params.senderType,
    createdAt: new Date().toISOString(),
    isRead: false,
    readAt: null,
    status: "pending",
    attachment: params.attachment,
  };
}

// The optimistic bubble shown the instant a file is picked, before any
// network activity — status "uploading" until the presigned PUT resolves.
export function createUploadingMessage(params: {
  clientMessageId: string;
  localPreviewUrl: string;
  caption: string;
  kind: "image" | "document";
  filename?: string;
}): DirectChatMessage {
  return {
    id: localMessageId(params.clientMessageId),
    clientMessageId: params.clientMessageId,
    message: params.caption,
    senderType: "student",
    createdAt: new Date().toISOString(),
    isRead: false,
    readAt: null,
    status: "uploading",
    attachment:
      params.kind === "document"
        ? { url: params.localPreviewUrl, type: "document", size: 0, filename: params.filename || "document.pdf" }
        : { url: params.localPreviewUrl, type: "image", size: 0 },
  };
}

export function applyUploadSuccess(messages: DirectChatMessage[], clientMessageId: string, attachment: DirectAttachment): DirectChatMessage[] {
  return messages.map((m) => (m.clientMessageId === clientMessageId && m.status === "uploading" ? { ...m, status: "pending", attachment } : m));
}

export function applyUploadFailure(messages: DirectChatMessage[], clientMessageId: string): DirectChatMessage[] {
  return messages.map((m) => (m.clientMessageId === clientMessageId && m.status === "uploading" ? { ...m, status: "failed-upload" } : m));
}

export function retryUpload(messages: DirectChatMessage[], clientMessageId: string): DirectChatMessage[] {
  return messages.map((m) => (m.clientMessageId === clientMessageId && m.status === "failed-upload" ? { ...m, status: "uploading" } : m));
}

function toConfirmed(incoming: ServerDirectMessage): DirectChatMessage {
  return {
    id: incoming.id,
    clientMessageId: incoming.clientMessageId ?? null,
    message: incoming.message,
    senderType: incoming.senderType,
    createdAt: incoming.createdAt,
    isRead: incoming.isRead,
    readAt: incoming.readAt,
    status: "sent",
    attachment: incoming.attachment ?? undefined,
  };
}

// Same dedup/reconcile priority as mobile: already-have-this-id -> no-op;
// a local pending/failed/uploading entry with the same clientMessageId ->
// reconcile in place; otherwise -> append. Used for receive-direct-message,
// a successful send ack, and sync-direct-messages results alike.
export function mergeIncomingMessage(list: DirectChatMessage[], incoming: ServerDirectMessage): DirectChatMessage[] {
  if (list.some((m) => m.id === incoming.id)) {
    return list;
  }

  const confirmed = toConfirmed(incoming);

  if (incoming.clientMessageId) {
    const idx = list.findIndex((m) => m.clientMessageId === incoming.clientMessageId);
    if (idx !== -1) {
      const next = list.slice();
      next[idx] = confirmed;
      return next;
    }
  }

  return [...list, confirmed];
}

export function mergeSyncedMessages(list: DirectChatMessage[], synced: ServerDirectMessage[]): DirectChatMessage[] {
  return synced.reduce((acc, m) => mergeIncomingMessage(acc, m), list);
}

// Pagination counterpart — prepends OLDER messages (already oldest-first)
// to the front of the list, never the end (see load-earlier-messages'
// backend comment for why this must stay a separate function from
// mergeSyncedMessages, which always appends).
export function mergeOlderPage(list: DirectChatMessage[], olderPage: ServerDirectMessage[]): DirectChatMessage[] {
  const existingIds = new Set(list.map((m) => m.id));
  const newOnes = olderPage.filter((m) => !existingIds.has(m.id)).map(toConfirmed);
  return [...newOnes, ...list];
}

// Local, optimistic mirror of the backend's mark-read semantics: marks the
// OTHER party's (always 'teacher', from this student-only app's point of
// view) unread messages as read, up to and including upToId if given.
// Applied immediately on viewing a thread; the ack, when it arrives, is a
// no-op re-application.
export function applyReadReceipt(list: DirectChatMessage[], upToId?: string): DirectChatMessage[] {
  return list.map((m) => {
    if (m.senderType !== "teacher" || m.isRead) return m;
    if (upToId && m.id > upToId) return m;
    return { ...m, isRead: true, readAt: new Date().toISOString() };
  });
}

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// The cursor sync-direct-messages needs: the newest server-confirmed
// message id this client already has. Local-only pending/uploading/failed
// messages (id starts with "local:") are excluded — only ever a real,
// persisted ObjectId is a valid cursor.
export function latestConfirmedMessageId(list: DirectChatMessage[]): string | null {
  let latest: string | null = null;
  for (const m of list) {
    if (m.status !== "sent") continue;
    if (!OBJECT_ID_RE.test(m.id)) continue;
    if (latest === null || m.id > latest) latest = m.id;
  }
  return latest;
}

// The cursor load-earlier-messages needs: the oldest currently-loaded
// server-confirmed message id. Same filtering as latestConfirmedMessageId,
// just taking the minimum instead of the maximum (ObjectIds sort
// lexicographically in chronological order).
export function oldestConfirmedMessageId(list: DirectChatMessage[]): string | null {
  let oldest: string | null = null;
  for (const m of list) {
    if (m.status !== "sent") continue;
    if (!OBJECT_ID_RE.test(m.id)) continue;
    if (oldest === null || m.id < oldest) oldest = m.id;
  }
  return oldest;
}

// directChatProtocol.ts's DirectChatErrorCode permanent set, ported
// verbatim — NOT_JOINED is deliberately excluded (unreachable for
// send-direct-message, join isn't required before sending) and defaults to
// retryable, same "unknown defaults to retryable" safety reasoning as
// mobile.
const PERMANENT_ACK_REASONS = new Set(["MESSAGE_EMPTY", "MESSAGE_TOO_LONG", "INVALID_REQUEST", "NOT_AUTHORIZED", "ATTACHMENT_INVALID"]);

export function classifyAckFailure(reason: string): "permanent" | "retryable" {
  return PERMANENT_ACK_REASONS.has(reason) ? "permanent" : "retryable";
}

// ── Conversation list ───────────────────────────────────────────────────

export function sortConversationsByRecency(list: ConversationSummary[]): ConversationSummary[] {
  return [...list].sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
}

// Applied whenever a message is sent or received in ANY conversation, so
// the inbox's preview/ordering/unread-count stays live between REST
// refetches.
export function applyMessageToConversationList(
  list: ConversationSummary[],
  update: {
    teacherId: string;
    teacherName?: string;
    subjectName: string;
    courseName: string;
    courseId: string | null;
    message: string;
    createdAt: string;
    senderType: "student" | "teacher";
    incrementUnread?: boolean;
  }
): ConversationSummary[] {
  const key = conversationKey(update.teacherId, update.subjectName);
  const idx = list.findIndex((c) => conversationKey(c.teacherId, c.subjectName) === key);

  if (idx === -1) {
    const next: ConversationSummary = {
      teacherId: update.teacherId,
      teacherName: update.teacherName || "Teacher",
      teacherEmail: "",
      subjectName: update.subjectName,
      courseName: update.courseName,
      courseId: update.courseId,
      lastMessage: update.message,
      lastMessageTime: update.createdAt,
      lastMessageSenderType: update.senderType,
      unreadCount: update.incrementUnread ? 1 : 0,
    };
    return sortConversationsByRecency([...list, next]);
  }

  const nextList = list.slice();
  nextList[idx] = {
    ...nextList[idx],
    lastMessage: update.message,
    lastMessageTime: update.createdAt,
    lastMessageSenderType: update.senderType,
    unreadCount: update.incrementUnread ? nextList[idx].unreadCount + 1 : nextList[idx].unreadCount,
  };
  return sortConversationsByRecency(nextList);
}

export function markConversationRead(list: ConversationSummary[], teacherId: string, subjectName: string): ConversationSummary[] {
  const key = conversationKey(teacherId, subjectName);
  return list.map((c) => (conversationKey(c.teacherId, c.subjectName) === key ? { ...c, unreadCount: 0 } : c));
}
