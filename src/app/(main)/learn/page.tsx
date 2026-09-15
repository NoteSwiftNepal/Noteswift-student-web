"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, Download, GraduationCap, Radio } from "lucide-react";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { useAllSubjectContents } from "@/hooks/queries/useSubjectContent";
import { getCourseId } from "@/lib/course";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";

// No course switcher here — course selection happens on My Batches
// (/courses/my-batches) and the Profile page's "Currently learning"
// control, both backed by useSelectedCourse. This matches mobile's actual
// MyCourses.tsx exactly: it shows subjects for whatever course is currently
// selected, or the "no course selected" empty state below — never an inline
// picker (that pattern only existed in the previous, now-replaced Learn
// implementation).
export default function LearnPage() {
  const { selectedCourse, enrolledCourses, enrollmentsLoading, error, refetch } = useSelectedCourse();
  const subjectNames = selectedCourse?.subjects?.map((s) => s.name) ?? [];
  const { subjectContents, isLoaded } = useAllSubjectContents(selectedCourse ? getCourseId(selectedCourse) : undefined, subjectNames);

  if (enrollmentsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <InlineError message="Couldn't load your courses." onRetry={() => refetch()} />;
  }

  if (enrolledCourses.length === 0 || !selectedCourse) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <BookOpen className="mx-auto mb-3 size-10 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">No course selected</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {enrolledCourses.length === 0 ? (
            <>
              <Link href="/courses" className="text-primary hover:underline">
                Browse courses
              </Link>{" "}
              to get started.
            </>
          ) : (
            <>
              Go to{" "}
              <Link href="/courses/my-batches" className="text-primary hover:underline">
                My Batches
              </Link>{" "}
              to select a course to start learning.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{selectedCourse.title}</h1>
          <p className="text-sm text-muted-foreground">Pick a subject to continue learning.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" asChild>
            <Link href="/learn/live-class">
              <Radio className="size-4" />
              Live classes
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/downloads">
              <Download className="size-4" />
              Downloads
            </Link>
          </Button>
        </div>
      </div>

      {selectedCourse.subjects && selectedCourse.subjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {selectedCourse.subjects.map((s) => {
            const content = subjectContents.get(s.name);
            const lessonCount = content ? content.modules.length : isLoaded ? (s.modules?.length ?? 0) : null;
            return (
              <Link key={s.name} href={`/learn/subject/${encodeURIComponent(s.name)}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GraduationCap className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {lessonCount === null ? (
                          <Skeleton className="h-3 w-16" />
                        ) : (
                          <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5">
                            {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No subjects configured for this course yet.
        </div>
      )}
    </div>
  );
}
