import type { Course } from "@/types/course";

// CourseEnrollment.courseId / TrialEnrollment.courseId arrive populated with
// the full course object from the backend, but the type is `string | Course`
// (mirrors mobile's courseStore.ts) — these narrow it safely at read sites.
export function resolveCourse(courseId: string | Course): Course | null {
  return typeof courseId === "object" && courseId !== null ? courseId : null;
}

export function getCourseId(course: Pick<Course, "_id" | "id">): string {
  return course._id || course.id;
}

// Course-type badge colors (blueprint §6, corrected): purple is reserved
// strictly for Pro/premium badges and pills — not a page-level brand color —
// green for "free", orange for "upcoming". Stock Tailwind classes, not
// custom tokens, matching how sparingly/directly mobile uses them.
export function courseTypeBadgeClasses(type: Course["type"]): string {
  switch (type) {
    case "free":
      return "bg-green-100 text-green-700 hover:bg-green-100";
    case "pro":
    case "featured":
      return "bg-purple-100 text-purple-700 hover:bg-purple-100";
    case "upcoming":
      return "bg-orange-100 text-orange-700 hover:bg-orange-100";
    default:
      return "bg-secondary text-secondary-foreground hover:bg-secondary";
  }
}

// Program-gradient thumbnail fallback (mobile's Home/Components/AllCourses.tsx
// getGradientColors) — ported as the closest stock Tailwind equivalents
// rather than mobile's raw hex, per blueprint §6's "route through existing
// theme tokens" rule. Two of mobile's four pairs are Tailwind's own colors
// verbatim (green-200→green-500 for Bachelor, indigo-200→indigo-500 for
// CTEVT); the other two (SEE's orange, +2's blue) are close-but-not-exact
// custom hex on mobile, mapped to the nearest stock pair here.
export function courseProgramGradientClasses(program: string | undefined): string {
  switch (program) {
    case "SEE":
      return "from-orange-200 to-orange-500";
    case "+2":
      return "from-sky-200 to-cyan-600";
    case "Bachelor":
      return "from-green-200 to-green-500";
    case "CTEVT":
      return "from-indigo-200 to-indigo-500";
    default:
      return "from-gray-200 to-gray-400";
  }
}
