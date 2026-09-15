import { create } from "zustand";
import {
  conversationKey,
  createOptimisticMessage,
  createUploadingMessage,
  applyUploadSuccess,
  applyUploadFailure,
  retryUpload,
  mergeIncomingMessage,
  mergeSyncedMessages,
  mergeOlderPage,
  applyReadReceipt,
  latestConfirmedMessageId,
  oldestConfirmedMessageId,
  applyMessageToConversationList,
  markConversationRead,
  sortConversationsByRecency,
  generateClientMessageId,
} from "@/lib/directChat";
import type { ConversationSummary, DirectAttachment, DirectChatMessage, ServerDirectMessage } from "@/types/direct-chat";

// Deliberately NOT persisted (no zustand `persist`/localStorage) — unlike
// mobile's AsyncStorage-backed store, which persists its outbox so a queued
// send survives an app restart. This app has no outbox to persist in the
// first place (see lib/directChat.ts's header comment: no auto-retry, so a
// "failed" message's own fields are all a manual retry needs) and
// conversations/messages are server-authoritative REST+socket data anyway
// — a page reload just re-fetches/re-joins, same as mobile treats its own
// non-outbox state.
interface DirectChatState {
  conversations: ConversationSummary[];
  messagesByConversation: Record<string, DirectChatMessage[]>;
  hasMoreHistoryByConversation: Record<string, boolean>;

  setConversations: (conversations: ConversationSummary[]) => void;
  messagesFor: (teacherId: string, subjectName: string) => DirectChatMessage[];
  setMessagesFor: (teacherId: string, subjectName: string, messages: DirectChatMessage[]) => void;
  mergeIncoming: (teacherId: string, subjectName: string, message: ServerDirectMessage) => void;
  mergeSynced: (teacherId: string, subjectName: string, messages: ServerDirectMessage[]) => void;
  prependOlderMessages: (teacherId: string, subjectName: string, olderPage: ServerDirectMessage[], hasMore: boolean) => void;
  markThreadRead: (teacherId: string, subjectName: string, upToId?: string) => void;
  latestConfirmedIdFor: (teacherId: string, subjectName: string) => string | null;
  oldestConfirmedIdFor: (teacherId: string, subjectName: string) => string | null;
  hasMoreHistoryFor: (teacherId: string, subjectName: string) => boolean;
  setHasMoreHistory: (teacherId: string, subjectName: string, hasMore: boolean) => void;

  beginSend: (params: { teacherId: string; subjectName: string; studentId: string; message: string; attachment?: DirectAttachment }) => string;
  beginUpload: (params: { teacherId: string; subjectName: string; studentId: string; localPreviewUrl: string; caption: string; kind: "image" | "document"; filename?: string }) => string;
  markUploadSuccess: (teacherId: string, subjectName: string, clientMessageId: string, attachment: DirectAttachment) => void;
  markUploadFailure: (teacherId: string, subjectName: string, clientMessageId: string) => void;
  retryImageUpload: (teacherId: string, subjectName: string, clientMessageId: string) => void;
  markSendPending: (teacherId: string, subjectName: string, clientMessageId: string) => void;
  markSendSuccess: (teacherId: string, subjectName: string, clientMessageId: string, server: ServerDirectMessage) => void;
  markSendFailure: (teacherId: string, subjectName: string, clientMessageId: string, kind: "retryable" | "permanent", message?: string) => void;

  touchConversation: (params: {
    teacherId: string;
    teacherName?: string;
    subjectName: string;
    courseName: string;
    courseId: string | null;
    message: string;
    createdAt: string;
    senderType: "student" | "teacher";
    incrementUnread?: boolean;
  }) => void;
}

export const useDirectChatStore = create<DirectChatState>()((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  hasMoreHistoryByConversation: {},

  setConversations: (conversations) => set({ conversations: sortConversationsByRecency(conversations) }),

  messagesFor: (teacherId, subjectName) => get().messagesByConversation[conversationKey(teacherId, subjectName)] || [],
  setMessagesFor: (teacherId, subjectName, messages) =>
    set((s) => ({ messagesByConversation: { ...s.messagesByConversation, [conversationKey(teacherId, subjectName)]: messages } })),

  mergeIncoming: (teacherId, subjectName, message) => {
    const key = conversationKey(teacherId, subjectName);
    set((s) => ({ messagesByConversation: { ...s.messagesByConversation, [key]: mergeIncomingMessage(s.messagesByConversation[key] || [], message) } }));
  },
  mergeSynced: (teacherId, subjectName, messages) => {
    const key = conversationKey(teacherId, subjectName);
    set((s) => ({ messagesByConversation: { ...s.messagesByConversation, [key]: mergeSyncedMessages(s.messagesByConversation[key] || [], messages) } }));
  },
  prependOlderMessages: (teacherId, subjectName, olderPage, hasMore) => {
    const key = conversationKey(teacherId, subjectName);
    set((s) => ({
      messagesByConversation: { ...s.messagesByConversation, [key]: mergeOlderPage(s.messagesByConversation[key] || [], olderPage) },
      hasMoreHistoryByConversation: { ...s.hasMoreHistoryByConversation, [key]: hasMore },
    }));
  },
  markThreadRead: (teacherId, subjectName, upToId) => {
    const key = conversationKey(teacherId, subjectName);
    set((s) => ({
      messagesByConversation: { ...s.messagesByConversation, [key]: applyReadReceipt(s.messagesByConversation[key] || [], upToId) },
      conversations: markConversationRead(s.conversations, teacherId, subjectName),
    }));
  },
  latestConfirmedIdFor: (teacherId, subjectName) => latestConfirmedMessageId(get().messagesFor(teacherId, subjectName)),
  oldestConfirmedIdFor: (teacherId, subjectName) => oldestConfirmedMessageId(get().messagesFor(teacherId, subjectName)),
  hasMoreHistoryFor: (teacherId, subjectName) => {
    const key = conversationKey(teacherId, subjectName);
    // Unknown yet (no join snapshot or pagination call has run) — assume
    // there might be more.
    return get().hasMoreHistoryByConversation[key] ?? true;
  },
  setHasMoreHistory: (teacherId, subjectName, hasMore) => {
    const key = conversationKey(teacherId, subjectName);
    set((s) => ({ hasMoreHistoryByConversation: { ...s.hasMoreHistoryByConversation, [key]: hasMore } }));
  },

  beginSend: ({ teacherId, subjectName, studentId, message, attachment }) => {
    const key = conversationKey(teacherId, subjectName);
    const clientMessageId = generateClientMessageId(studentId);
    const optimistic = createOptimisticMessage({ clientMessageId, message, senderType: "student", attachment });
    set((s) => ({ messagesByConversation: { ...s.messagesByConversation, [key]: [...(s.messagesByConversation[key] || []), optimistic] } }));
    return clientMessageId;
  },

  beginUpload: ({ teacherId, subjectName, studentId, localPreviewUrl, caption, kind, filename }) => {
    const key = conversationKey(teacherId, subjectName);
    const clientMessageId = generateClientMessageId(studentId);
    const optimistic = createUploadingMessage({ clientMessageId, localPreviewUrl, caption, kind, filename });
    set((s) => ({ messagesByConversation: { ...s.messagesByConversation, [key]: [...(s.messagesByConversation[key] || []), optimistic] } }));
    return clientMessageId;
  },
  markUploadSuccess: (teacherId, subjectName, clientMessageId, attachment) => {
    const key = conversationKey(teacherId, subjectName);
    set((s) => ({ messagesByConversation: { ...s.messagesByConversation, [key]: applyUploadSuccess(s.messagesByConversation[key] || [], clientMessageId, attachment) } }));
  },
  markUploadFailure: (teacherId, subjectName, clientMessageId) => {
    const key = conversationKey(teacherId, subjectName);
    set((s) => ({ messagesByConversation: { ...s.messagesByConversation, [key]: applyUploadFailure(s.messagesByConversation[key] || [], clientMessageId) } }));
  },
  retryImageUpload: (teacherId, subjectName, clientMessageId) => {
    const key = conversationKey(teacherId, subjectName);
    set((s) => ({ messagesByConversation: { ...s.messagesByConversation, [key]: retryUpload(s.messagesByConversation[key] || [], clientMessageId) } }));
  },

  markSendPending: (teacherId, subjectName, clientMessageId) => {
    const key = conversationKey(teacherId, subjectName);
    set((s) => ({
      messagesByConversation: {
        ...s.messagesByConversation,
        [key]: (s.messagesByConversation[key] || []).map((m) => (m.clientMessageId === clientMessageId ? { ...m, status: "pending", failureKind: undefined, failureMessage: undefined } : m)),
      },
    }));
  },

  markSendSuccess: (teacherId, subjectName, clientMessageId, server) => {
    const key = conversationKey(teacherId, subjectName);
    set((s) => ({
      messagesByConversation: {
        ...s.messagesByConversation,
        [key]: mergeIncomingMessage(s.messagesByConversation[key] || [], { ...server, clientMessageId: server.clientMessageId ?? clientMessageId }),
      },
    }));
  },

  // Race-guard identical to mobile: never regress an already-'sent' message
  // (a stale timeout firing after the real ack already resolved).
  markSendFailure: (teacherId, subjectName, clientMessageId, kind, message) => {
    const key = conversationKey(teacherId, subjectName);
    set((s) => {
      const list = s.messagesByConversation[key] || [];
      const current = list.find((m) => m.clientMessageId === clientMessageId);
      if (!current || current.status === "sent") return s;
      return {
        messagesByConversation: {
          ...s.messagesByConversation,
          [key]: list.map((m) => (m.clientMessageId === clientMessageId ? { ...m, status: "failed", failureKind: kind, failureMessage: message } : m)),
        },
      };
    });
  },

  touchConversation: (params) => set((s) => ({ conversations: applyMessageToConversationList(s.conversations, params) })),
}));
