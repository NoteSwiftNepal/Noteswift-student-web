// GET /courses/:courseId/subject/:subjectName — LegacyApiResponse<SubjectContent>.
// Shape confirmed against courseContentController.ts's getSubjectContent +
// moduleContentShape (not assumed from any other endpoint's shape).

export interface ModuleVideo {
  url: string;
  title: string;
  duration?: string;
  uploadedAt?: string;
  liveClassId?: string;
  teacherId?: string | null;
  teacherName?: string;
  teacherAvatar?: string;
}

export interface ModuleNote {
  url: string;
  title: string;
  uploadedAt?: string;
}

export interface ModuleDpp {
  url: string;
  title: string;
  uploadedAt?: string;
}

export interface ModuleSolution {
  url: string;
  title?: string;
  uploadedAt?: string;
}

export interface ModuleContentTag {
  type: "video" | "notes" | "dpp" | "solution";
  label: string;
  count: number;
}

// Ordered by moduleNumber — "chapter" = module in the data model
// (blueprint §10.2), never array index.
export interface SubjectModule {
  moduleNumber: number;
  moduleName: string;
  description: string;
  hasVideo: boolean;
  videos: ModuleVideo[];
  hasNotes: boolean;
  notes: ModuleNote[];
  hasDpp: boolean;
  dpps: ModuleDpp[];
  hasSolution: boolean;
  solutions: ModuleSolution[];
  hasLiveClass: boolean;
  liveClassSchedule: unknown[];
  likeCount: number;
  likedByUser: boolean;
  tags: ModuleContentTag[];
}

export interface SubjectContent {
  courseId: string;
  courseName: string;
  subjectName: string;
  // Course.subjects[]._id — required alongside moduleNumber on every
  // progress-write call (moduleNumber alone collides across subjects).
  courseSubjectId: string;
  teacherId: string | null;
  teacherName: string;
  teacherEmail: string | null;
  teacherAvatar: string;
  description?: string;
  syllabus?: string;
  objectives: string[];
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  modules: SubjectModule[];
}
