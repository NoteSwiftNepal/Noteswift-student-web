import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { trackCourseLead } from "@/api/student/leads";

// Reports one visit per page mount (per course) once the student is known.
export function useTrackCourseLead(courseId: string | undefined, event: "view" | "checkout") {
  const userId = useAuthStore((s) => s.user?.id);
  useEffect(() => {
    if (userId && courseId) trackCourseLead(courseId, event);
  }, [userId, courseId, event]);
}
