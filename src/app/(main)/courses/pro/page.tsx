"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Crown } from "lucide-react";
import { useCourses } from "@/hooks/queries/useCourses";
import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";

// Mobile's ProMarketplace groups pro courses into hardcoded sections ('see',
// 'plus2', ...); grouping by the course's own `program` field instead is a
// deliberate simplification — same idea (browse Pro courses by program),
// without hardcoding a fixed program list the backend already owns.
export default function ProMarketplacePage() {
  const router = useRouter();
  const { courses, coursesLoading, error, refetch } = useCourses();

  const proCoursesByProgram = useMemo(() => {
    const proCourses = courses.filter((c) => c.type === "pro" && c.status === "Published");
    const groups = new Map<string, typeof proCourses>();
    for (const course of proCourses) {
      const key = course.program || "Other";
      groups.set(key, [...(groups.get(key) ?? []), course]);
    }
    return groups;
  }, [courses]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {/* Small Pro/premium icon chip — gold, not purple (§2.1 retired
            purple as the "premium" signal in favor of the accent gold
            ramp; matches StatusBadge's own `pro` tone). */}
        <div className="flex size-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
          <Crown className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">NoteSwift Pro</h1>
          <p className="text-sm text-muted-foreground">
            Premium courses with full access, by program.
          </p>
        </div>
      </div>

      {coursesLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load Pro courses." onRetry={() => refetch()} />
      ) : proCoursesByProgram.size === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No Pro packages available yet.
        </div>
      ) : (
        Array.from(proCoursesByProgram.entries()).map(([program, courses]) => (
          <section key={program}>
            <h2 className="mb-3 text-lg font-bold text-foreground">{program}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          </section>
        ))
      )}

      <p className="text-center text-xs text-muted-foreground">
        Prefer to review pricing side by side first?{" "}
        <Link href="/courses/pro/checkout" className="text-primary hover:underline">
          Go to checkout
        </Link>
      </p>
    </div>
  );
}
