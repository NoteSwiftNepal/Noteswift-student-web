import api from "@/api/axios";
import type { CreateDownloadInput, DownloadRecord } from "@/types/download";

// routes/downloads.ts replies with NO envelope at all — a bare array from
// GET, a bare object (201) from POST, and `{error: string}` (not the usual
// `{error: boolean}`) on failure. Confirmed directly against the route file
// — this is a fourth distinct response shape on top of the ones already
// logged in MOBILE_APP_CODE_ISSUES.md.

export const getDownloads = async (): Promise<DownloadRecord[]> => {
  const res = await api.get("/downloads");
  return Array.isArray(res.data) ? res.data : [];
};

export const createDownload = async (
  input: CreateDownloadInput
): Promise<DownloadRecord> => {
  const res = await api.post("/downloads", input);
  return res.data;
};

export const deleteDownload = async (id: string): Promise<void> => {
  await api.delete(`/downloads/${id}`);
};
