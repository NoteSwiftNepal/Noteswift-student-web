// GET/POST /courses/progress/:courseId/module(/:moduleNumber) — LegacyApiResponse.
// Shape confirmed against progressController.ts's getModuleProgress /
// updateModuleProgress and CourseEnrollment.model.ts's real moduleProgress
// subdocument schema.
//
// getModuleProgress's "no progress yet" fallback object uses DIFFERENT field
// names/types (`videosCompleted: number`, `notesCompleted: number`,
// `quizCompleted`/`completed` booleans that don't exist on the schema) than
// the real moduleProgress subdocument it falls back from (`videoCompleted:
// boolean`, `sectionsCompleted: number[]`, `progress: number`) — see
// MOBILE_APP_CODE_ISSUES.md. Typed here as the real schema shape only;
// api/lessonProgress.ts normalizes the mismatched fallback into it.
export interface ModuleProgressEntry {
  moduleNumber: number;
  courseSubjectId?: string;
  videoCompleted: boolean;
  videoCompletedAt?: string | null;
  notesCompleted: boolean;
  notesCompletedAt?: string | null;
  sectionsCompleted: number[];
  progress: number;
}

export interface GetModuleProgressResult {
  moduleProgress: ModuleProgressEntry;
  overallProgress: number;
}

// GET/POST /courses/progress/:courseId — the older, coarser course-level
// API (CourseEnrollment.completedLessons, not the module-based one above).
// Not called by any current mobile screen (superseded by module progress),
// wrapped here for parity with mobile's api/lessonProgress.ts anyway.
export interface CompletedLesson {
  lessonId: string;
  completedAt: string;
}

export interface LessonProgressResult {
  progress: number;
  completedLessons: CompletedLesson[];
  lastAccessedAt?: string;
  moduleProgress: ModuleProgressEntry[];
  overallProgress: number;
}

export interface UpdateModuleProgressResult {
  // `progress` and `overallProgress` are literally the same value
  // (enrollment.progress) sent under two keys — kept both to match the
  // backend response as-is.
  progress: number;
  moduleProgress: ModuleProgressEntry[];
  overallProgress: number;
}
