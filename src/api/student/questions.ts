import api from "@/api/axios";
import type { ApiResponse } from "@/types/api";
import type { LegacyApiResponse } from "@/types/api";
import type {
  CourseTeacherSubject,
  CreateQuestionPayload,
  QuestionDetail,
  QuestionListResult,
} from "@/types/question";

// Questions use ApiResponse<T> (JsonResponse) — confirmed against
// questions.route.ts.

export const createQuestion = async (
  payload: CreateQuestionPayload
): Promise<ApiResponse<{ question: { _id: string; title: string; questionText: string; status: string; createdAt: string } }>> => {
  const res = await api.post("/questions", payload);
  return res.data;
};

export const getQuestions = async (
  courseId?: string
): Promise<ApiResponse<QuestionListResult>> => {
  const res = await api.get("/questions", { params: courseId ? { courseId } : undefined });
  return res.data;
};

export const getQuestionById = async (
  questionId: string
): Promise<ApiResponse<{ question: QuestionDetail }>> => {
  const res = await api.get(`/questions/${questionId}`);
  return res.data;
};

export const replyToQuestion = async (
  questionId: string,
  answerText: string
): Promise<ApiResponse<{ question: { _id: string; status: string; answers: unknown[] } }>> => {
  const res = await api.post(`/questions/${questionId}/reply`, { answerText });
  return res.data;
};

export const resolveQuestion = async (
  questionId: string
): Promise<ApiResponse<{ question: { _id: string; status: string; resolvedAt: string } }>> => {
  const res = await api.patch(`/questions/${questionId}/resolve`);
  return res.data;
};

// NOTE: mobile's api/student/questions.ts checks the WRONG envelope shape
// for this endpoint (`response.data?.success` / `response.data.data`) —
// vote actually replies with ApiResponse<T> ({error,status,result,message}),
// same as every other endpoint in questions.route.ts. Since `success` is
// never present on that shape, mobile's check is always falsy and every
// vote throws client-side even though the backend recorded it. See
// MOBILE_APP_CODE_ISSUES.md. Typed and read correctly here.
export const voteQuestion = async (
  questionId: string,
  voteType: "upvote" | "downvote"
): Promise<ApiResponse<{ upvotes: number; downvotes: number }>> => {
  const res = await api.post(`/questions/${questionId}/vote`, { voteType });
  return res.data;
};

export const getCourseTeachers = async (
  courseId: string
): Promise<LegacyApiResponse<{ courseId: string; courseTitle: string; subjects: CourseTeacherSubject[] }>> => {
  const res = await api.get(`/courses/${courseId}/teachers`);
  return res.data;
};
