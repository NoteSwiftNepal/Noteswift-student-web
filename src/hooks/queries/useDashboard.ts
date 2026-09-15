import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/api/student/dashboard";

// Same query key shape as mobile's hooks/queries/useDashboard.ts —
// ["dashboard", courseId ?? "none"] — so the two codebases' caching
// conventions stay comparable.
export function useDashboard(courseId?: string) {
  const query = useQuery({
    queryKey: ["dashboard", courseId ?? "none"],
    queryFn: () => getDashboard(courseId),
  });

  return {
    dashboardData: query.data ?? null,
    dashboardLoading: query.isPending,
    isStale: query.isStale,
    error: query.error,
    refetch: query.refetch,
  };
}
