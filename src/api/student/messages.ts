import api from "@/api/axios";
import type { ApiResponse } from "@/types/api";
import type { ChatUploadSignResult, Conversation, DirectMessage, SendMessageResult } from "@/types/message";

// /messages* uses ApiResponse<T> (JsonResponse) — confirmed against
// messages.route.ts.
//
// Real-time delivery now goes through the actual student<->teacher
// direct-chat socket protocol (src/socket/directChatHandler.ts +
// directChatProtocol.ts, backend), ported in full via
// src/hooks/useDirectChatSocket.ts + src/lib/directChat.ts +
// src/stores/directChatStore.ts (Phase 12) — replacing the Phase 5
// REST-polling placeholder these wrappers originally existed to support.
// getConversations and signChatUpload are still live (the socket layer's
// initial/refetchable conversation list and its attachment upload-sign,
// respectively); sendTeacherMessage/getChatMessages/deleteMessage below are
// the plain-REST equivalents of what send-direct-message/join-conversation/
// (no socket equivalent for delete, which was never wired to any UI even
// before this phase) now do over the socket — kept as real, working
// wrappers against real endpoints, just no longer called by the chat UI
// itself.

export const sendTeacherMessage = async (
  teacherId: string,
  subjectName: string,
  message: string
): Promise<ApiResponse<SendMessageResult>> => {
  const res = await api.post("/messages/teacher", { teacherId, subjectName, message });
  return res.data;
};

export const getConversations = async (): Promise<ApiResponse<{ conversations: Conversation[] }>> => {
  const res = await api.get("/messages/conversations");
  return res.data;
};

export const getChatMessages = async (
  teacherId: string,
  subjectName: string
): Promise<ApiResponse<{ messages: DirectMessage[] }>> => {
  const res = await api.get(`/messages/student/chat/${teacherId}/${encodeURIComponent(subjectName)}`);
  return res.data;
};

export const deleteMessage = async (messageId: string): Promise<ApiResponse<null>> => {
  const res = await api.delete(`/messages/${messageId}`);
  return res.data;
};

// Presigned-upload signer for chat image attachments — student-scoped,
// shared with the doubt-attachment flow in this phase since there's no
// separate question-attachment signing endpoint (see lib/uploadImage.ts).
export const signChatUpload = async (
  filename: string,
  contentType: string,
  fileSize: number
): Promise<ApiResponse<ChatUploadSignResult>> => {
  const res = await api.post("/messages/upload-sign", { filename, contentType, fileSize });
  return res.data;
};
