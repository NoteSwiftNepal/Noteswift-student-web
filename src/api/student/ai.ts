import api from "@/api/axios";
import type { LegacyApiResponse } from "@/types/api";
import type {
  AIChatOutput,
  AIChatRequest,
  ChatHistoryDetail,
  ChatHistorySummary,
  SaveChatHistoryPayload,
} from "@/types/ai-chat";

// POST /ai/chat and /ai/history* use LegacyApiResponse ({success,data,
// message}) — but with THREE different shapes for `data` across the four
// history endpoints (see types/ai-chat.d.ts's header comment): saveChat/
// deleteChat have no `data` at all, getChatHistory's `data` is a bare
// array, getChat's `data` is a single object. Each wrapper below is typed
// to its own endpoint's real shape rather than a shared generic.

// Single whole response, not streamed (confirmed against aiController.ts —
// a plain res.json() call). 45s timeout matches mobile's own AIChatBot.tsx,
// which the backend's own Gemini round-trip can legitimately take that long
// for on a slow response.
export const chatWithAI = async (
  payload: AIChatRequest
): Promise<LegacyApiResponse<AIChatOutput>> => {
  const res = await api.post("/ai/chat", payload, { timeout: 45_000 });
  return res.data;
};

export const saveChatHistory = async (
  payload: SaveChatHistoryPayload
): Promise<{ success: boolean; message: string }> => {
  const res = await api.post("/ai/history", payload);
  return res.data;
};

export const getChatHistoryList = async (): Promise<{
  success: boolean;
  data?: ChatHistorySummary[];
  message?: string;
}> => {
  const res = await api.get("/ai/history");
  return res.data;
};

export const getChatHistoryDetail = async (
  chatId: string
): Promise<LegacyApiResponse<ChatHistoryDetail>> => {
  const res = await api.get(`/ai/history/${chatId}`);
  return res.data;
};

export const deleteChatHistory = async (
  chatId: string
): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete(`/ai/history/${chatId}`);
  return res.data;
};
