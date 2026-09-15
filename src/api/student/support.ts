import api from "@/api/axios";
import type { ApiResponse } from "@/types/api";

// POST /auth/send-report (auth.route.ts) — ApiResponse<{message}>, confirmed
// against notification.controller.ts's sendReportEmail. Backend reads the
// student's email from res.locals.student, not from the request body — so
// unlike mobile's api/student/auth.ts (`sendReport(reportText, userEmail)`),
// there's no point sending a userEmail field; the backend ignores it.
export const sendReport = async (reportText: string): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.post("/auth/send-report", { reportText });
  return res.data;
};
