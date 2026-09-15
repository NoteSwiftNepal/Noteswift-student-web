import { useQuery } from "@tanstack/react-query";
import { getAvailableTests } from "@/api/student/test";
import type { Test } from "@/types/test";

// Same query key as mobile's hooks/queries/useTests.ts — ["tests", courseId].
// Unlike mobile, this doesn't also mirror into a Zustand store — nothing
// else on web reads tests outside React Query (see Phase 2's useCourses.ts
// for the same simplification and why).
export function useTests(courseId?: string) {
  const query = useQuery({
    queryKey: ["tests", courseId],
    queryFn: async (): Promise<Test[]> => {
      const response = await getAvailableTests(courseId);
      if (response.error) {
        throw new Error(response.message || "Failed to fetch tests");
      }
      return response.result.tests;
    },
  });

  return {
    tests: query.data ?? [],
    testsLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
