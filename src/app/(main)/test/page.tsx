"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Clock, CheckCircle2, Lock } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEnrollments } from "@/hooks/queries/useEnrollments";
import { useTests } from "@/hooks/queries/useTests";
import { resolveCourse } from "@/lib/course";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import type { Test } from "@/types/test";

function statusBadge(test: Test) {
  if (test.attemptInfo?.status === "submitted" || test.attemptInfo?.status === "evaluated") {
    return (
      <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
        <CheckCircle2 className="size-3" />
        {Math.round(test.attemptInfo.percentage)}%
      </Badge>
    );
  }
  if (test.attemptInfo?.status === "in-progress") {
    return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">In progress</Badge>;
  }
  if (test.availability === "upcoming") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Lock className="size-3" />
        Upcoming
      </Badge>
    );
  }
  if (test.availability === "closed") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Lock className="size-3" />
        Closed
      </Badge>
    );
  }
  return null;
}

function TestListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useAuthStore((s) => s.user?.id);
  const { enrollments, enrollmentsLoading } = useEnrollments(userId);

  const courses = useMemo(
    () => enrollments.map((e) => resolveCourse(e.courseId)).filter((c): c is NonNullable<typeof c> => !!c),
    [enrollments]
  );

  const courseId = searchParams.get("courseId") || courses[0]?._id || "";
  const { tests, testsLoading, error: testsError, refetch: refetchTests } = useTests(courseId || undefined);

  const setCourse = (newCourseId: string) => {
    router.push(`/test?${new URLSearchParams({ courseId: newCourseId }).toString()}`);
  };

  const bySubject = useMemo(() => {
    const groups = new Map<string, Test[]>();
    for (const test of tests) {
      const key = test.subjectName || "General";
      groups.set(key, [...(groups.get(key) ?? []), test]);
    }
    return groups;
  }, [tests]);

  if (enrollmentsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <ClipboardList className="mx-auto mb-3 size-10 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">No enrolled courses yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          <Link href="/courses" className="text-primary hover:underline">
            Browse courses
          </Link>{" "}
          to find tests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Test</h1>
        <p className="text-sm text-muted-foreground">Practice tests for your enrolled courses.</p>
      </div>

      <Select value={courseId} onValueChange={setCourse}>
        <SelectTrigger className="w-full sm:w-80">
          <SelectValue placeholder="Select a course" />
        </SelectTrigger>
        <SelectContent>
          {courses.map((c) => (
            <SelectItem key={c._id} value={c._id}>
              {c.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {testsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : testsError ? (
        <InlineError message="Couldn't load tests." onRetry={() => refetchTests()} />
      ) : tests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No tests available for this course yet.
        </div>
      ) : (
        Array.from(bySubject.entries()).map(([subject, subjectTests]) => (
          <section key={subject}>
            <h2 className="mb-3 text-lg font-bold text-foreground">{subject}</h2>
            <div className="space-y-3">
              {subjectTests.map((test) => (
                <Card key={test._id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{test.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {test.moduleName && <span>{test.moduleName}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {test.duration} min
                        </span>
                        <span className="uppercase">{test.type}</span>
                        <span>
                          {test.totalQuestions} question{test.totalQuestions === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(test)}
                      {test.attemptInfo?.status === "in-progress" ? (
                        <Button size="sm" asChild>
                          <Link href={`/test/${test._id}`}>Continue</Link>
                        </Button>
                      ) : test.attemptInfo?.status === "submitted" || test.attemptInfo?.status === "evaluated" ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/test/${test._id}/result/${test.attemptInfo.attemptId}`}>
                            View results
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" disabled={!test.canAttempt} asChild={test.canAttempt}>
                          {test.canAttempt ? (
                            <Link href={`/test/${test._id}`}>Start</Link>
                          ) : (
                            <span>Start</span>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

export default function TestListPage() {
  return (
    <Suspense fallback={null}>
      <TestListPageContent />
    </Suspense>
  );
}
