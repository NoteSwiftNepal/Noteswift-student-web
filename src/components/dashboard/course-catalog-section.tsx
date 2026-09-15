"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCourses } from "@/hooks/queries/useCourses";
import { useEnrollments } from "@/hooks/queries/useEnrollments";
import { resolveCourse } from "@/lib/course";
import { AcademyCourseCard } from "@/components/courses/academy-course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section-header";

const FILTERS = ["All", "SEE", "+2", "Bachelor", "CTEVT", "Free", "Paid"] as const;
type Filter = (typeof FILTERS)[number];

// Replaces the old enrolled-only "My Courses" section. Mobile's home page
// has no separate enrolled-courses list at all — Home/Components/
// AllCourses.tsx is a single filterable catalog of every course, where an
// already-enrolled course just shows an "Enrolled" state on its own card
// instead of being segregated into its own section (confirmed by reading
// that file directly, not the phase-2 summary that originally produced the
// enrolled-only section this replaces). Ported the same filter set
// (program-based pills + Free/Paid) and the same "the whole app already
// fetches courses once" sourcing: useCourses()/useEnrollments() are the
// exact same React-Query-cached hooks the /courses page uses, so this
// section is a second read of one cached fetch, not a second network call.
export function CourseCatalogSection() {
  const userId = useAuthStore((s) => s.user?.id);
  const { courses, coursesLoading, error, refetch } = useCourses();
  const { enrollments } = useEnrollments(userId);
  const [filter, setFilter] = useState<Filter>("All");

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((e) => resolveCourse(e.courseId)?._id ?? e.courseId)),
    [enrollments]
  );

  const filtered = useMemo(() => {
    const published = courses.filter((c) => c.status === "Published");
    switch (filter) {
      case "All":
        return published;
      case "Free":
        return published.filter((c) => c.type === "free" || c.price === 0);
      case "Paid":
        return published.filter((c) => c.type !== "free" && (c.price ?? 0) > 0);
      default:
        return published.filter((c) => c.program === filter);
    }
  }, [courses, filter]);

  return (
    <section>
      <SectionHeader title="NoteSwift Academy" href="/courses" />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:bg-secondary/60"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {coursesLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load courses." onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
          <GraduationCap className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No courses found for this filter.</p>
          <Link href="/courses" className="mt-2 text-sm font-medium text-primary hover:underline">
            Browse all courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course) => (
            <AcademyCourseCard
              key={course._id || course.id}
              course={course}
              enrolled={enrolledIds.has(course._id || course.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
