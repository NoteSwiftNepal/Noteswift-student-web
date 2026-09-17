import Link from "next/link";
import { Star, School, CheckCircle2 } from "lucide-react";
import { getCourseId, courseProgramSurfaceClasses } from "@/lib/course";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
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
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-card shadow-1 transition-[transform,box-shadow] duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-2"
    >
      <div className="relative w-full" style={{ aspectRatio: "1280 / 630" }}>
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnail}
            alt={course.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-base ease-standard group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center px-4 text-center",
              courseProgramSurfaceClasses(course.program)
            )}
          >
            <div>
              <p className="text-title text-white">{course.title}</p>
              <p className="mt-1 text-body-sm text-white/85">{course.program}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-2 text-eyebrow text-warning-500">{course.program}</p>

        <h3 className="mb-2 line-clamp-2 text-title text-foreground">{course.title}</h3>

        <div className="mb-2 flex items-center gap-1.5 text-body-sm text-muted-foreground">
          <Star className="size-4 fill-gold-400 text-gold-400" />
          {rating.toFixed(1)}
        </div>

        <div className="mb-3 flex items-center gap-2 text-body-sm text-muted-foreground">
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
            <StatusBadge tone="free">FREE</StatusBadge>
          ) : (
            <span className="shrink-0 text-title text-foreground">Rs. {course.price}</span>
          )}

          <span
            className={cn(
              "flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-4 py-2.5 text-body-sm font-semibold",
              enrolled ? "bg-success-100 text-success-700" : "bg-foreground text-background"
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
        </div>
      </div>
    </Link>
  );
}
