"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Hourglass, School } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { getAllStudentProgress } from "@/api/student/progress";
import { getCourseId } from "@/lib/course";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import { SubjectStatsCard } from "@/components/progress/subject-stats-card";

// Ported from app/Progress/[courseId].tsx — four distinct states (no
// course selected / course has no subjects / enrolled but not started yet /
// real per-subject cards), not one generic empty state. "Not started yet"
// means no subject in this course has a StudentProgress row at all yet
// (matched by courseSubjectId, the same stable id the backend keys by) —
// a subject with no matching entry is left out of the list entirely rather
// than rendered as its own empty card, same as mobile.
export default function ProgressPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const { selectedCourse, enrollmentsLoading } = useSelectedCourse();
  const courseId = selectedCourse ? getCourseId(selectedCourse) : undefined;

  const { data: entries, isPending, isError, refetch } = useQuery({
    queryKey: ["student-progress", userId, courseId],
    queryFn: async () => {
      const res = await getAllStudentProgress(userId!);
      if (!res.success) throw new Error(res.message);
      return res.data.filter((e) => e.courseId === courseId);
    },
    enabled: !!userId && !!courseId,
  });

  const subjects = selectedCourse?.subjects ?? [];
  const startedSubjects = useMemo(
    () =>
      subjects
        .map((subject) => ({ subject, entry: (entries ?? []).find((e) => e.courseSubjectId === subject._id) }))
        .filter((s): s is { subject: typeof s.subject; entry: NonNullable<typeof s.entry> } => !!s.entry),
    [subjects, entries]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Progress</h1>
        <p className="text-sm text-muted-foreground">A subject-by-subject breakdown for your current course.</p>
      </div>

      {enrollmentsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : !selectedCourse ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <BookOpen className="mb-3 size-10 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No course selected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a course to see its progress breakdown.{" "}
            <Link href="/courses/my-batches" className="text-primary hover:underline">
              My Batches
            </Link>
          </p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <School className="mb-3 size-10 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No subjects found</p>
          <p className="mt-1 text-sm text-muted-foreground">This course doesn&apos;t have any subjects set up yet.</p>
        </div>
      ) : isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <InlineError message="Couldn't load progress." onRetry={() => refetch()} />
      ) : startedSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Hourglass className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Not started yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a chapter, take a test, or join a live class to see progress here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {startedSubjects.map(({ subject, entry }) => (
            <SubjectStatsCard key={subject._id ?? subject.name} subjectName={subject.name} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
