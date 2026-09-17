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

// Program-identity thumbnail-fallback surface (mobile's Home/Components/
// AllCourses.tsx getGradientColors) — previously a parallel bare-Tailwind
// gradient map (from-orange-200 to-orange-500 etc, docs/DESIGN-STANDARDS.md
// §2.1 flags this as exactly the "bare palette class" pattern the token
// system replaces). Now a fixed pairing onto the app's own semantic tokens,
// the same fixed-assignment mechanism StatusBadge uses for its tones — one
// flat, solid-tinted fill per program (not a gradient: none of
// brand/success/warning/accent has a second ramp stop defined that would
// make a two-stop gradient worth the extra complexity) instead of a
// separate color system.
export function courseProgramSurfaceClasses(program: string | undefined): string {
  switch (program) {
    case "SEE":
      return "bg-warning-500";
    case "+2":
      return "bg-primary";
    case "Bachelor":
      return "bg-success-500";
    case "CTEVT":
      return "bg-accent";
    default:
      return "bg-neutral-400";
  }
}
