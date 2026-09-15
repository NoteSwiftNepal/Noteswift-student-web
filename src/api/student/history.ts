import api from "@/api/axios";
import type { HistoryItem } from "@/types/history";

// GET /history — bare array, no envelope, `{error: string}` on failure.
// Same shape family as downloads.ts (confirmed against routes/history.ts).
export const getHistory = async (): Promise<HistoryItem[]> => {
  const res = await api.get("/history");
  return Array.isArray(res.data) ? res.data : [];
};
