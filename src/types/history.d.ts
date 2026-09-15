export type HistoryItemType = "video" | "notes" | "test" | "live_class" | "download";

// Mirrors routes/history.ts's HistoryItem — a synthetic feed assembled
// server-side from four different collections (enrollment moduleProgress,
// test attempts, live class attendance, downloads), not its own model.
export interface HistoryItem {
  _id: string;
  type: HistoryItemType;
  title: string;
  courseName?: string;
  subjectName?: string;
  timestamp: string;
  contentId?: string;
  progress?: number;
  score?: { obtained: number; total: number };
  duration?: string;
  fileType?: string;
}
