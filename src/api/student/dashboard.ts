import api from "@/api/axios";
import type { DashboardData } from "@/types/dashboard";

// GET /dashboard has no ApiResponse/LegacyApiResponse envelope — it replies
// with the payload directly (blueprint §9: backend/schema quirks like this
// must be flagged, not worked around silently). courseId scopes
// `liveClassesToday`; omitting it returns an empty array for that field
// (see src/apps/student/routes/dashboard.ts on the backend).
export const getDashboard = async (courseId?: string): Promise<DashboardData> => {
  const res = await api.get<DashboardData>("/dashboard", {
    params: courseId ? { courseId } : undefined,
  });
  return res.data;
};
