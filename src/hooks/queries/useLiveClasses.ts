import { useQuery } from "@tanstack/react-query";
import { getLiveClasses } from "@/api/student/learn";
import type { LiveClass } from "@/types/live-class";

// Same query key shape as mobile's hooks/queries/useLiveClasses.ts —
// ["liveClasses", courseId ?? "all"]. Unlike mobile, this doesn't also
// mirror into a Zustand store — nothing else on web reads live classes
// outside React Query (see Phase 2/3's useCourses/useTests for the same
// simplification).
export function useLiveClasses(courseId?: string, options?: { refetchInterval?: number }) {
  const query = useQuery({
    queryKey: ["liveClasses", courseId ?? "all"],
    queryFn: async (): Promise<LiveClass[]> => {
      const res = await getLiveClasses(courseId ? { courseId } : undefined);
      if (!res.success) throw new Error(res.message);
      return res.data.liveClasses;
    },
    refetchInterval: options?.refetchInterval,
  });

  return {
    liveClasses: query.data ?? [],
    liveClassesLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
