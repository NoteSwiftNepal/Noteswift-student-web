import Link from "next/link";
import { Star, School, ChevronRight, CheckCircle2 } from "lucide-react";
import { getCourseId, courseProgramGradientClasses } from "@/lib/course";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/course";

// Ported from mobile's Home/Components/AllCourses.tsx CourseCard — same
// content/hierarchy (thumbnail-or-gradient, program label, title, rating,
// subjects count, divider, price/FREE + enroll action + chevron), adapted
// for a wide viewport: a hover lift/shadow (no touch equivalent on mobile)
// instead of TouchableOpacity's activeOpacity, and this renders inside a
// responsive grid rather than mobile's single vertical stack (see
// course-catalog-section.tsx). The whole card is one Link, same as mobile
// where every sub-element (including the "Enroll Now"/"Enrolled" button)
// calls the exact same onPress — there's no separate enroll action fired
// from this card on either platform; tapping/clicking anywhere just opens
// the course detail page, which is where enrollment actually happens.
export function AcademyCourseCard({ course, enrolled }: { course: Course; enrolled: boolean }) {
  const id = getCourseId(course);
  const isFree = course.type === "free" || course.price === 0;
  const rating = course.rating ?? 0;

  return (
    <Link
      href={`/courses/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative w-full" style={{ aspectRatio: "1280 / 630" }}>
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnail}
            alt={course.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br px-4 text-center",
              courseProgramGradientClasses(course.program)
            )}
          >
            <div>
              <p className="text-xl font-extrabold tracking-tight text-white">{course.title}</p>
              <p className="mt-1 text-base font-bold text-white/90">{course.program}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-2 text-xs font-semibold text-orange-500">{course.program}</p>

        <h3 className="mb-2 line-clamp-2 text-base font-bold text-foreground">{course.title}</h3>

        <div className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          {rating.toFixed(1)}
        </div>

        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <School className="size-4" />
          <span>{course.status}</span>
          {course.subjects && course.subjects.length > 0 && (
            <>
              <span className="size-1 rounded-full bg-border" />
              <span>{course.subjects.length} subjects</span>
            </>
          )}
        </div>

        <div className="mb-3 h-px bg-border" />

        <div className="mt-auto flex items-center justify-between gap-2">
          {isFree ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">FREE</span>
          ) : (
            <span className="text-2xl font-bold text-foreground">Rs. {course.price}</span>
          )}

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex min-w-24 items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold",
                enrolled ? "bg-green-100 text-green-700" : "bg-foreground text-background"
              )}
            >
              {enrolled ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Enrolled
                </>
              ) : isFree ? (
                "Start"
              ) : (
                "Enroll Now"
              )}
            </span>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border">
              <ChevronRight className="size-4 text-foreground/70" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
