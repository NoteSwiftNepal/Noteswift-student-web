import { useQuery } from "@tanstack/react-query";
import { getAllCourses } from "@/api/student/courses";
import type { Course } from "@/types/course";

// Same query key as mobile's hooks/queries/useCourses.ts — ["courses"].
// Unlike mobile, this doesn't also mirror into a Zustand store: nothing else
// in the web app reads courses outside React Query (blueprint §9 — the
// singleton-hack mobile carries for Metro isn't needed here, and neither is
// the store-mirroring workaround built on top of it).
async function fetchCourses(): Promise<Course[]> {
  const response = await getAllCourses();
  if (!response.success) {
    throw new Error(response.message || "Failed to fetch courses");
  }
  return response.data.courses;
}

export function useCourses(options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
    enabled: options?.enabled ?? true,
  });

  return {
    courses: query.data ?? [],
    coursesLoading: query.isPending,
    isFetching: query.isFetching,
    isStale: query.isStale,
    error: query.error,
    refetch: query.refetch,
  };
}
