import api from "@/api/axios";
import type { LegacyApiResponse } from "@/types/api";
import type { Course, CourseEnrollment, TrialEnrollment } from "@/types/course";

// Course, enrollment and trial endpoints all use LegacyApiResponse<T>
// ({success, data, message}, real HTTP status codes) — confirmed against
// courseController.ts, trialController.ts and homepageController.ts, not
// the JsonResponse-wrapped ApiResponse<T> the rest of the backend uses.

export const getAllCourses = async (
  params?: { page?: number; limit?: number }
): Promise<LegacyApiResponse<{ courses: Course[]; pagination: { page: number; limit: number; total: number; pages: number } }>> => {
  const res = await api.get("/courses", { params });
  return res.data;
};

export const getFeaturedCourse = async (): Promise<LegacyApiResponse<Course>> => {
  const res = await api.get("/courses/featured");
  return res.data;
};

export const getHomepageUpcomingCourses = async (): Promise<
  LegacyApiResponse<{ courses: Course[] }>
> => {
  const res = await api.get("/courses/homepage/upcoming");
  return res.data;
};

export const getRecommendations = async (): Promise<
  LegacyApiResponse<{ recommendations: Course[] }>
> => {
  const res = await api.get("/courses/recommendations");
  return res.data;
};

export const enrollInCourse = async (
  courseId: string
): Promise<LegacyApiResponse<CourseEnrollment | { enrollment: CourseEnrollment; convertedFromTrial: boolean; trialId: string }>> => {
  const res = await api.post("/courses/enroll", { courseId });
  return res.data;
};

export const getUserEnrollments = async (
  userId: string
): Promise<LegacyApiResponse<CourseEnrollment[]>> => {
  const res = await api.get(`/courses/enrollments/${userId}`);
  return res.data;
};

export const selectCourse = async (
  courseId: string | null
): Promise<LegacyApiResponse<{ selectedCourseId: string | null }>> => {
  const res = await api.post("/courses/select", { courseId });
  return res.data;
};

// A subject/module content listing for the Learn feature (Phase 3) — NOT a
// full Course. `data.course` is a trimmed projection (id/title/description/
// program/duration/thumbnail/icon/status/type only — no price, rating, FAQ,
// syllabus, etc.), confirmed against courseContentController.ts. The course
// detail page uses useCourses() for the full Course object instead; this
// wrapper exists for when Phase 3 needs the enriched subjects/modules list.
export interface CourseContentSubject {
  name: string;
  description?: string;
  totalLessons: number;
  teacher: { id: string | null; name: string; email: string | null };
  modules: unknown[];
  syllabus?: string;
  objectives: string[];
  lastUpdated: string;
}

export interface CourseContent {
  course: Pick<
    Course,
    "_id" | "title" | "description" | "program" | "duration" | "thumbnail" | "icon" | "status" | "type"
  >;
  subjects: CourseContentSubject[];
  totalSubjects: number;
  assignedSubjects: number;
}

export const getCourseContent = async (
  courseId: string
): Promise<LegacyApiResponse<CourseContent>> => {
  const res = await api.get(`/courses/${courseId}/content`);
  return res.data;
};

// ─── Trials ─────────────────────────────────────────────────────────────
export const startFreeTrial = async (
  courseId: string
): Promise<LegacyApiResponse<TrialEnrollment>> => {
  const res = await api.post("/courses/trial/start", { courseId });
  return res.data;
};

export const getUserTrials = async (
  userId: string
): Promise<LegacyApiResponse<TrialEnrollment[]>> => {
  const res = await api.get(`/courses/trials/${userId}`);
  return res.data;
};

export const checkTrialStatus = async (
  courseId: string
): Promise<
  LegacyApiResponse<{
    isOnTrial: boolean;
    trial: Pick<TrialEnrollment, "id" | "trialStartedAt" | "trialExpiresAt"> | null;
  }>
> => {
  const res = await api.get(`/courses/trial/status/${courseId}`);
  return res.data;
};

export const convertTrialToFull = async (
  courseId: string
): Promise<LegacyApiResponse<CourseEnrollment>> => {
  const res = await api.post("/courses/trial/convert", { courseId });
  return res.data;
};
