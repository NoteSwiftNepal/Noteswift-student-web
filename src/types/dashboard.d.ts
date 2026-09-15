// GET /dashboard replies with this shape directly on success (HTTP 200, no
// envelope at all — confirmed against src/apps/student/routes/dashboard.ts,
// not ApiResponse<T> or LegacyApiResponse<T>) and `{ error: string }` with a
// real HTTP error status on failure.
export interface DashboardLiveClass {
  _id: string;
  title: string;
  courseName: string;
  subjectName: string;
  teacherName: string;
  scheduledAt?: string;
  startedAt?: string;
  duration?: number;
  participants: number;
  status: "live" | "attended" | "upcoming";
  roomId?: string;
  recordingUrl?: string;
}

export interface DashboardUpcomingTest {
  _id: string;
  title: string;
  courseName: string;
  subjectName: string;
  type: string;
  duration: number;
  totalMarks: number;
  totalQuestions: number;
  startTime?: string;
}

export interface DashboardRecentActivity {
  _id: string;
  type: "video" | "test" | "live_class" | "download";
  title: string;
  courseName?: string;
  subjectName?: string;
  timestamp: string;
  progress?: number;
  score?: { obtained: number; total: number };
  duration?: string;
  fileType?: string;
}

export interface DashboardData {
  stats: {
    enrolledCourses: number;
    overallProgress: number;
    testsCompleted: number;
    testsAvailable: number;
    liveClassesToday: number;
  };
  userName?: string;
  liveClassesToday: DashboardLiveClass[];
  upcomingTests: DashboardUpcomingTest[];
  recentActivity: DashboardRecentActivity[];
}
