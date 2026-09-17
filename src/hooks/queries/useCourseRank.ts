import { useQuery } from "@tanstack/react-query";
import { getStudentCourseRank } from "@/api/student/progress";

// Extracted out of dashboard/stats-overview.tsx (its original home) so the
// Profile page's own rank stat can share the exact same fetch instead of a
// second copy — same query key, same real per-course rank endpoint mobile's
// ProfileHeader.tsx/StatCard.tsx both already use. A non-success response is
// a real, expected "not ranked yet" outcome (no course, not enrolled,
// trial-only, or enrolled but not yet computed) — never an error to retry.
export function useCourseRank(studentId: string | undefined, courseId: string | undefined) {
  const query = useQuery({
    queryKey: ["course-rank", studentId, courseId],
    queryFn: async () => {
      const res = await getStudentCourseRank(studentId!, courseId!);
      return res.success ? res.data : null;
    },
    enabled: !!studentId && !!courseId,
  });

  return {
    rank: query.data ?? null,
    rankLoading: query.isPending,
  };
}
