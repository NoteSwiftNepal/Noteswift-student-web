import api from "@/api/axios";
import type { LegacyApiResponse } from "@/types/api";
import type { StudentCourseRank, StudentProgressEntry } from "@/types/student-progress";

// Every StudentProgress summary the student has, across every subject in
// every course — filtered client-side to one course by the Progress page,
// same as mobile's app/Progress/[courseId].tsx does (no per-course backend
// endpoint exists for this, confirmed against courseRoutes.ts).
export const getAllStudentProgress = async (
  studentId: string
): Promise<LegacyApiResponse<StudentProgressEntry[]>> => {
  const res = await api.get(`/courses/progress/student/${studentId}`);
  return res.data;
};

// Self-only course rank, backed by the materialized CourseRanking
// collection. A non-success response is a real, expected outcome here (not
// enrolled, trial-only, or enrolled but not yet computed) — never treated
// as a hard error, see getStudentCourseRank's own comments.
export const getStudentCourseRank = async (
  studentId: string,
  courseId: string
): Promise<LegacyApiResponse<StudentCourseRank>> => {
  const res = await api.get(`/courses/progress/student/${studentId}/course/${courseId}/rank`);
  return res.data;
};
