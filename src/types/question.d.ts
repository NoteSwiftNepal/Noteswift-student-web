// /questions* uses ApiResponse<T> (JsonResponse — {error,status,result,
// message}), confirmed against questions.route.ts — including the vote
// endpoint, which mobile's own wrapper checks the WRONG envelope shape for
// (see MOBILE_APP_CODE_ISSUES.md).
//
// /courses/:courseId/teachers uses LegacyApiResponse<T> ({success,data,
// message}), confirmed against courseContentController.ts's getCourseTeachers.

export interface QuestionAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

// GET /questions list item (transformed/summarized — not the full doc).
export interface QuestionSummary {
  _id: string;
  title: string;
  questionText: string;
  subjectName: string;
  courseName: string;
  status: "pending" | "answered" | "resolved" | "in-progress" | "closed";
  priority: string;
  answersCount: number;
  hasAcceptedAnswer: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  views: number;
}

export interface QuestionListResult {
  questions: QuestionSummary[];
  total: number;
}

export interface QuestionAnswer {
  _id?: string;
  answeredBy: string;
  answeredByName: string;
  answeredByRole: "teacher" | "student" | "admin";
  answerText: string;
  attachments?: QuestionAttachment[];
  isAccepted: boolean;
  upvotes: string[];
  downvotes: string[];
  createdAt: string;
  updatedAt: string;
}

// GET /questions/:id — the full Mongoose document (not transformed).
export interface QuestionDetail {
  _id: string;
  title: string;
  questionText: string;
  tags?: string[];
  courseId: string;
  courseName: string;
  subjectName: string;
  moduleNumber?: number;
  moduleName?: string;
  topicName?: string;
  studentId: string;
  studentName: string;
  isAnonymous: boolean;
  isPublic: boolean;
  attachments?: QuestionAttachment[];
  priority: string;
  status: "pending" | "answered" | "resolved" | "in-progress" | "closed";
  answers: QuestionAnswer[];
  views: number;
  upvotes: string[];
  downvotes: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CreateQuestionPayload {
  title: string;
  questionText: string;
  courseId: string;
  subjectName: string;
  moduleNumber?: number;
  moduleName?: string;
  topicName?: string;
  isAnonymous?: boolean;
  isPublic?: boolean;
  tags?: string[];
  attachments?: QuestionAttachment[];
}

export interface CourseTeacherSubject {
  subjectName: string;
  teacher: { id: string; name: string; email: string } | null;
}
