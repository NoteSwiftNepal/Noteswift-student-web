// GET /learn/live-classes and GET /learn/live-classes/:roomId/token —
// LegacyApiResponse<T> ({success, data, message}), confirmed against
// learn.controller.ts's getStudentLiveClasses / getStudentLiveClassToken.

export interface LiveClassTeacherData {
  id: string;
  name: string;
  profilePhoto?: string;
  email?: string;
}

export interface LiveClass {
  id: string;
  title: string;
  teacher: string;
  teacherData: LiveClassTeacherData | null;
  subject: string;
  module?: string;
  roomId: string;
  courseId: string;
  courseName?: string;
  isShared: boolean;
  sharedWithCourseCount: number;
  startedAt: string | null;
  endedAt: string | null;
  scheduledAt: string | null;
  status: "ongoing" | "scheduled" | "completed";
  duration: number;
  recordingUrl: string | null;
}

export interface LiveClassTokenResult {
  token: string;
  roomId: string;
  liveClass: {
    id: string;
    title: string;
    teacherName: string;
    subjectName: string;
    status: string;
  };
}

// ─── Socket.io (src/socket/chatHandler.ts) ─────────────────────────────────
// Confirmed directly against chatHandler.ts — not assumed from
// CODEBASE_MAP.md's summary.

export interface ChatMessage {
  id: string;
  clientMessageId: string | null;
  message: string;
  senderId: string;
  senderName: string;
  senderRole: "student" | "Teacher" | "Student";
  createdAt: string;
  editedAt: string | null;
  pinned: boolean;
  pinnedBy: string | null;
  pinnedAt: string | null;
}

export interface RaisedHand {
  userId: string;
  userName: string;
  raisedAt: number;
}

export type JoinClassroomAck =
  | { ok: true; classroomId: string; alreadyJoined?: boolean }
  | { ok: false; reason: string };

export type SendMessageAck =
  | { ok: true; message: ChatMessage; replay?: boolean }
  | { ok: false; reason: string; retryAfterMs?: number; maxLength?: number };
