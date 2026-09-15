import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserEnrollments, getUserTrials } from "@/api/student/courses";
import type { CourseEnrollment, TrialEnrollment } from "@/types/course";

// Query key convention matches mobile's naming pattern (["courses"],
// ["dashboard", ...]) even though mobile itself keeps enrollments in
// courseStore rather than React Query — ["enrollments", userId] is the new
// hook this phase introduces, not a port of an existing mobile hook.
export function useEnrollments(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["enrollments", userId],
    queryFn: async (): Promise<CourseEnrollment[]> => {
      const response = await getUserEnrollments(userId!);
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch enrollments");
      }
      return response.data;
    },
    enabled: !!userId,
  });

  return {
    enrollments: query.data ?? [],
    enrollmentsLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

// Colocated with useEnrollments rather than its own file — trials and
// enrollments are two views of "what course access does this student have,"
// fetched and invalidated together everywhere they're used in this phase.
export function useTrials(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["trials", userId],
    queryFn: async (): Promise<TrialEnrollment[]> => {
      const response = await getUserTrials(userId!);
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch trials");
      }
      return response.data;
    },
    enabled: !!userId,
  });

  return {
    trials: query.data ?? [],
    trialsLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

// Shared invalidation after enroll / trial-start / trial-convert / unlock-code
// redemption mutations — all four change both enrollments and trials.
export function useInvalidateCourseAccess(userId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["enrollments", userId] });
    queryClient.invalidateQueries({ queryKey: ["trials", userId] });
  };
}
