import { useQuery } from "@tanstack/react-query";
import { getCourseTeachers } from "@/api/student/questions";
import type { CourseTeacherSubject } from "@/types/question";

// Same query key as mobile's hooks/queries/useCourseTeachers.ts —
// ["courseTeachers", courseId].
export function useCourseTeachers(courseId?: string) {
  const query = useQuery({
    queryKey: ["courseTeachers", courseId],
    queryFn: async (): Promise<CourseTeacherSubject[]> => {
      const res = await getCourseTeachers(courseId!);
      if (!res.success) throw new Error(res.message);
      return res.data.subjects;
    },
    enabled: !!courseId,
  });

  return {
    courseTeachers: query.data ?? [],
    courseTeachersLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
