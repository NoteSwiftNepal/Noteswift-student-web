// GET /courses/progress/student/:studentId and .../course/:courseId/rank —
// both LegacyApiResponse. Confirmed against progressController.ts's
// getStudentProgressAll/getStudentCourseRank and shared/models/
// StudentProgress.model.ts. Ranking reads a materialized CourseRanking
// collection (indexed count query), not a live full-class sort — and is
// deliberately self-only (a student sees "I'm rank 4 of 27," never the
// full list), same stance as every other progress endpoint in this file.

export interface StudentProgressEntry {
  courseId: string;
  courseSubjectId: string;
  courseName?: string | null;
  overallProgress: number;
  weightedProgress: number;
  lastActivityAt?: string | null;
  testPerformance: { attemptsCount: number; averagePercentage: number };
  assignmentPerformance: { submittedCount: number; averageScore: number };
  attendance: { liveClassesAttended: number; liveClassesRegistered: number; attendanceRate: number };
}

export interface StudentCourseRank {
  studentId: string;
  courseId: string;
  courseProgress: number;
  weightedCourseProgress: number;
  rank: number;
  totalStudents: number;
  lastActivityAt?: string | null;
}
