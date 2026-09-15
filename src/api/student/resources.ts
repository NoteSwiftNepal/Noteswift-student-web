import api from "@/api/axios";
import type { LegacyApiResponse } from "@/types/api";

export type ResourceType =
  | "video"
  | "syllabus"
  | "test-appendix"
  | "model-question"
  | "past-year-question"
  | "mind-map"
  | "other";

export interface CourseResource {
  _id: string;
  title: string;
  description?: string;
  type: ResourceType;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  moduleNumber?: number;
  moduleName?: string;
  createdAt: string;
}

// Course-wide, not subject-scoped — mobile's own Resources.tsx comment
// explains why: a student should see subject-wide resources (syllabus,
// past-year-questions) regardless of which chapter they're currently
// viewing. Confirmed against courseContentController.ts's getCourseResources.
export const getCourseResources = async (
  courseId: string
): Promise<LegacyApiResponse<{ resources: CourseResource[] }>> => {
  const res = await api.get(`/courses/${courseId}/resources`);
  return res.data;
};
