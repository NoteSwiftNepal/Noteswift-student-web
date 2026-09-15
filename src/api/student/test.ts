import api from "@/api/axios";
import type { ApiResponse } from "@/types/api";
import type {
  StartTestAttemptResult,
  SubmitTestResult,
  Test,
  TestDetail,
  TestListResult,
  TestResult,
  UploadAnswerImageResult,
} from "@/types/test";

// /tests* uses ApiResponse<T> (JsonResponse — {error,status,result,message}),
// confirmed against test.controller.ts. Unlike mobile's studentTestAPI,
// these wrappers return the ApiResponse envelope as-is instead of
// re-wrapping it into an ad hoc {success,data}/{success,false,error} shape —
// the backend's own envelope already carries everything callers need
// (error, message, result), so the re-wrap in mobile's api/student/test.ts
// is pure repetition (identical try/if-else in all 7 methods; see
// MOBILE_APP_CODE_ISSUES.md).

export const getAvailableTests = async (
  courseId?: string
): Promise<ApiResponse<TestListResult>> => {
  const res = await api.get("/tests", { params: courseId ? { courseId } : undefined });
  return res.data;
};

export const getTestDetails = async (testId: string): Promise<ApiResponse<TestDetail>> => {
  const res = await api.get(`/tests/${testId}`);
  return res.data;
};

export const startTestAttempt = async (
  testId: string
): Promise<ApiResponse<StartTestAttemptResult>> => {
  const res = await api.post(`/tests/${testId}/start`);
  return res.data;
};

export interface SubmitAnswer {
  questionNumber: number;
  answer: string;
}

export const submitTest = async (
  testId: string,
  data: { answers: SubmitAnswer[]; timeSpent: number }
): Promise<ApiResponse<SubmitTestResult>> => {
  const res = await api.post(`/tests/${testId}/submit`, data);
  return res.data;
};

export const getTestResults = async (
  testId: string,
  attemptId: string
): Promise<ApiResponse<TestResult>> => {
  const res = await api.get(`/tests/${testId}/results/${attemptId}`);
  return res.data;
};

export const abandonTestAttempt = async (testId: string): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.post(`/tests/${testId}/abandon`);
  return res.data;
};

export const pauseTestAttempt = async (
  testId: string,
  data: { answers: SubmitAnswer[]; timeSpent: number }
): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.post(`/tests/${testId}/pause`, data);
  return res.data;
};

// Subjective-test answer photos only. Browser File object + FormData —
// simpler than mobile's URI-based RN FormData shape, no equivalent needed.
export const uploadAnswerImage = async (
  testId: string,
  questionNumber: number,
  file: File
): Promise<ApiResponse<UploadAnswerImageResult>> => {
  const formData = new FormData();
  formData.append("image", file);
  const res = await api.post(
    `/tests/${testId}/questions/${questionNumber}/upload-answer`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
};
