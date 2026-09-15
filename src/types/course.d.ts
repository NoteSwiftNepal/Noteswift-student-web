// Ported from mobile's stores/courseStore.ts — same field set, same optionality.
export interface CourseModule {
  name: string;
  description: string;
  duration?: string;
}

export interface CourseSubject {
  // Course.subjects[]._id — a real Mongoose subdocument id, present on every
  // subject even though the original courseStore.ts port of this type
  // omitted it. Needed to match a subject against its StudentProgress
  // entry (StudentProgress.courseSubjectId) on the Progress page.
  _id?: string;
  name: string;
  description?: string;
  modules?: CourseModule[];
}

export interface Course {
  _id: string;
  id: string;
  title: string;
  description: string;
  subjects?: CourseSubject[];
  tags: string[];
  status: string;
  type?: "featured" | "pro" | "free" | "recommended" | "upcoming";
  offeredBy?: string;
  icon?: string;
  thumbnail?: string;
  duration?: string;
  rating?: number;
  enrolledCount?: number;
  program: string; // SEE, +2, Bachelor, CTEVT
  isFeatured?: boolean;
  skills?: string[];
  learningPoints?: string[];
  features?: string[];
  price?: number;
  courseOverview?: string;
  keyFeatures?: string[];
  syllabus?: {
    moduleNumber: number;
    title: string;
    description: string;
  }[];
  faq?: {
    question: string;
    answer: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollment {
  _id: string;
  id: string;
  courseId: string | Course; // populated with the full course object by the backend
  studentId: string;
  enrolledAt: string;
  progress: number;
  weightedCourseProgress: number;
  isActive: boolean;
  completedAt?: string;
  lastAccessedAt: string;
}

export interface TrialEnrollment {
  _id: string;
  id: string;
  courseId: string | Course;
  studentId: string;
  trialStartedAt: string;
  trialExpiresAt: string;
  isActive: boolean;
}
