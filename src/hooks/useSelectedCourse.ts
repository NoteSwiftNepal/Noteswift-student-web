import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useEnrollments } from "@/hooks/queries/useEnrollments";
import { selectCourse as apiSelectCourse } from "@/api/student/courses";
import { resolveCourse, getCourseId } from "@/lib/course";

// The single "which course is the student currently learning" mechanism —
// ported from mobile's stores/courseStore.ts (selectedCourseId/selectCourse/
// syncSelectedCourse), backed by the SAME server field mobile already
// persists to (Student.selectedCourseId, via the existing POST /courses/select
// wrapper) rather than a new parallel store. Every consumer (My Batches,
// the Profile switcher, the Learn pages) uses this one hook, so there is
// only one place selection logic lives.
//
// Resolution order mirrors syncSelectedCourse exactly: prefer the persisted
// selectedCourseId if it still matches a real enrollment, else fall back to
// the first enrolled course. That fallback is purely local/derived, same as
// mobile — it's never written back to the server on its own, only an
// explicit selectCourse() call persists a choice. Mobile's third case
// (userClearedSelection, a local-only "explicitly picked nothing" flag) is
// not ported: neither entry point this phase builds (My Batches, Profile)
// offers a "clear selection" action, only a list to pick from.
export function useSelectedCourse() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { enrollments, enrollmentsLoading, error, refetch } = useEnrollments(user?.id);

  const enrolledCourses = useMemo(
    () => enrollments.map((e) => resolveCourse(e.courseId)).filter((c): c is NonNullable<typeof c> => !!c),
    [enrollments]
  );

  const selectedCourse = useMemo(() => {
    if (user?.selectedCourseId) {
      const match = enrolledCourses.find((c) => getCourseId(c) === user.selectedCourseId);
      if (match) return match;
    }
    return enrolledCourses[0] ?? null;
  }, [user?.selectedCourseId, enrolledCourses]);

  const mutation = useMutation({
    mutationFn: (courseId: string) => apiSelectCourse(courseId),
    onSuccess: (res, courseId) => {
      if (!res.success || !user) return;
      updateUser({ ...user, selectedCourseId: courseId });
    },
  });

  return {
    selectedCourse,
    enrolledCourses,
    enrollments,
    enrollmentsLoading,
    error,
    refetch,
    selectCourse: mutation.mutate,
    selectingCourse: mutation.isPending,
  };
}
