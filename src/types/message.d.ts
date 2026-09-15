// /messages* uses ApiResponse<T> (JsonResponse), confirmed against
// messages.route.ts.

export interface DirectMessage {
  _id: string;
  studentId: string;
  teacherId: string;
  subjectName: string;
  courseName: string;
  message: string;
  senderType: "student" | "teacher";
  isRead: boolean;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhoto: string | null;
  subjectName: string;
  courseName: string;
  courseId: string | null;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderType: "student" | "teacher";
  unreadCount: number;
}

export interface SendMessageResult {
  message: {
    _id: string;
    message: string;
    senderType: "student";
    timestamp: string;
    isRead: boolean;
  };
}

export interface ChatUploadSignResult {
  uploadUrl: string;
  publicUrl: string;
}
