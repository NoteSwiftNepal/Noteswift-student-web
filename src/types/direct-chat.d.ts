// src/socket/directChatHandler.ts + directChatProtocol.ts (backend) — the
// event names/payloads/ack shapes here are transcribed directly from those
// two files, not the task summary.

export interface DirectAttachment {
  url: string;
  type: "image" | "document";
  size: number;
  width?: number;
  height?: number;
  filename?: string;
}

// What the server hands back via ack / receive-direct-message /
// sync-direct-messages / load-earlier-messages — matches
// directChatProtocol.ts's SerializedDirectMessage exactly.
export interface ServerDirectMessage {
  id: string;
  clientMessageId: string | null;
  studentId: string;
  teacherId: string;
  courseId: string | null;
  courseName: string;
  subjectName: string;
  message: string;
  attachment: DirectAttachment | null;
  senderType: "student" | "teacher";
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
}

export type DirectMessageStatus = "uploading" | "pending" | "sent" | "failed" | "failed-upload";

// Client-side message shape — id is the server _id once confirmed, or
// `local:<clientMessageId>` before that (same convention as live-class
// chat). No outbox/backoff-scheduling fields: this app deliberately doesn't
// auto-retry a failed send (mobile doesn't either — see
// useDirectChatSocket.ts's own comment on this), so a message's own
// message/attachment fields are all a manual retry needs; there's no
// separate persisted queue to maintain.
export interface DirectChatMessage {
  id: string;
  clientMessageId: string | null;
  message: string;
  senderType: "student" | "teacher";
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  status: DirectMessageStatus;
  attachment?: DirectAttachment;
  failureKind?: "permanent" | "retryable";
  failureMessage?: string;
}

export type DirectChatErrorCode =
  | "NOT_AUTHENTICATED"
  | "INVALID_REQUEST"
  | "NOT_AUTHORIZED"
  | "MESSAGE_EMPTY"
  | "MESSAGE_TOO_LONG"
  | "RATE_LIMITED"
  | "NOT_JOINED"
  | "SERVER_ERROR"
  | "ATTACHMENT_INVALID";

export interface DirectChatAckError {
  ok: false;
  reason: DirectChatErrorCode;
  retryAfterMs?: number;
  message?: string;
  maxLength?: number;
}

export type JoinConversationAck = { ok: true; conversationId: string } | DirectChatAckError;
export type SendDirectMessageAck = { ok: true; message: ServerDirectMessage; replay?: boolean } | DirectChatAckError;
export type SyncDirectMessagesAck = { ok: true; messages: ServerDirectMessage[] } | DirectChatAckError;
export type LoadEarlierMessagesAck = { ok: true; messages: ServerDirectMessage[]; hasMore: boolean } | DirectChatAckError;
export type MarkReadAck = { ok: true; markedCount: number } | DirectChatAckError;

// Conversation-list preview — matches the REST Conversation type
// (src/types/message.d.ts) field-for-field; kept as its own type here since
// this module treats it as the live, socket-updatable mirror of that list
// (mobile's ConversationSummary, same shape).
export interface ConversationSummary {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhoto?: string | null;
  subjectName: string;
  courseName: string;
  courseId: string | null;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderType: "student" | "teacher";
  unreadCount: number;
}
