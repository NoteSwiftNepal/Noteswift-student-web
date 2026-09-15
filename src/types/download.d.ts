export type DownloadFileType = "video" | "pdf" | "note";

// Mirrors the Download mongoose model (routes/downloads.ts). Mobile stores
// an encrypted local copy of the file alongside this record (fileUri points
// at it); the web app has no local file store, so this is purely a
// server-side "you downloaded this" log — see api/student/downloads.ts.
export interface DownloadRecord {
  _id: string;
  user: string;
  fileName: string;
  fileUri?: string;
  localUri?: string;
  fileType: DownloadFileType;
  size?: string;
  pages?: number;
  subject?: string;
  chapter?: string;
  downloadedAt: string;
}

export interface CreateDownloadInput {
  fileName: string;
  fileUri: string;
  fileType: DownloadFileType;
  size?: string;
  pages?: number;
  subject?: string;
  chapter?: string;
}
