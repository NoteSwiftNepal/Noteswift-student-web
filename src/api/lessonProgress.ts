import api from "@/api/axios";
import type { LegacyApiResponse } from "@/types/api";
import type { SubjectContent } from "@/types/subject-content";
import type {
  GetModuleProgressResult,
  LessonProgressResult,
  ModuleProgressEntry,
  UpdateModuleProgressResult,
} from "@/types/lesson-progress";
import type { Mindmap } from "@/types/mindmap";

// Course/module progress + subject content — mirrors mobile's top-level
// api/lessonProgress.ts. All of these use LegacyApiResponse<T>
// ({success, data, message}), confirmed against progressController.ts and
// courseContentController.ts.

// Older, coarser course-level API (CourseEnrollment.completedLessons) —
// superseded by the module-level API below in every current mobile screen,
// wrapped here for parity with mobile's file anyway.
export const getLessonProgress = async (
  courseId: string
): Promise<LegacyApiResponse<LessonProgressResult>> => {
  const res = await api.get(`/courses/progress/${courseId}`);
  return res.data;
};

export const updateLessonProgress = async (
  courseId: string,
  lessonId: string,
  completed: boolean
): Promise<LegacyApiResponse<LessonProgressResult>> => {
  const res = await api.post(`/courses/progress/${courseId}`, { lessonId, completed });
  return res.data;
};

// The "no progress yet" fallback the backend returns for getModuleProgress
// uses different field names/types than the real moduleProgress schema (see
// types/lesson-progress.d.ts and MOBILE_APP_CODE_ISSUES.md) — normalized
// here into one consistent shape so callers never see the mismatch.
function normalizeModuleProgress(raw: any, moduleNumber: number): ModuleProgressEntry {
  if (typeof raw?.videoCompleted === "boolean") {
    return raw as ModuleProgressEntry;
  }
  return {
    moduleNumber,
    videoCompleted: false,
    notesCompleted: false,
    sectionsCompleted: [],
    progress: 0,
  };
}

export const getModuleProgress = async (
  courseId: string,
  moduleNumber: number,
  courseSubjectId: string
): Promise<LegacyApiResponse<GetModuleProgressResult>> => {
  const res = await api.get(`/courses/progress/${courseId}/module/${moduleNumber}`, {
    params: { courseSubjectId },
  });
  const body = res.data as LegacyApiResponse<GetModuleProgressResult>;
  if (body.success) {
    body.data.moduleProgress = normalizeModuleProgress(body.data.moduleProgress, moduleNumber);
  }
  return body;
};

export const updateModuleProgress = async (
  courseId: string,
  moduleNumber: number,
  courseSubjectId: string,
  options: { videoCompleted?: boolean; sectionIndex?: number; dppIndex?: number } = {}
): Promise<LegacyApiResponse<UpdateModuleProgressResult>> => {
  const res = await api.post(`/courses/progress/${courseId}/module`, {
    moduleNumber,
    courseSubjectId,
    ...options,
  });
  return res.data;
};

// Periodic watch-time ping while a video plays — analytics only, separate
// from updateModuleProgress's completion flag.
export const recordVideoWatchTime = async (
  courseId: string,
  moduleNumber: number,
  courseSubjectId: string,
  seconds: number
): Promise<LegacyApiResponse<{ message: string }>> => {
  const res = await api.post(`/courses/progress/${courseId}/module/watch-time`, {
    moduleNumber,
    courseSubjectId,
    seconds,
  });
  return res.data;
};

export const getSubjectContent = async (
  courseId: string,
  subjectName: string
): Promise<LegacyApiResponse<SubjectContent>> => {
  const res = await api.get(`/courses/${courseId}/subject/${encodeURIComponent(subjectName)}`);
  return res.data;
};

// moduleNumber omitted = subject-level "master" mindmap; passed = that one
// module's mindmap. `data` is `null` (not an error) when nothing has been
// published for this scope yet.
export const getSubjectMindmap = async (
  courseId: string,
  subjectName: string,
  moduleNumber?: number
): Promise<LegacyApiResponse<Mindmap | null>> => {
  const res = await api.get(`/courses/${courseId}/mindmap/${encodeURIComponent(subjectName)}`, {
    params: moduleNumber ? { moduleNumber } : undefined,
  });
  return res.data;
};
