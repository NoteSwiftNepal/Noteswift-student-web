"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardList, Gauge } from "lucide-react";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { useTests } from "@/hooks/queries/useTests";
import { getCourseId } from "@/lib/course";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestRow } from "@/components/test/test-row";
import { TestSubjectCard } from "@/components/test/test-subject-card";

// Mirrors mobile's real app/(tabs)/Test/TestPage.tsx structure — no inline
// course picker (reads the app-wide useSelectedCourse, same as Learn/
// Progress/My Batches), a stats card (Total/Completed/Avg Score), and a
// subject-scoped + type-filtered test list. The tab structure itself
// (Subjects/MCQ/Subjective) is a deliberate web adaptation — mobile's own
// screen crosses a separate status-tabs (All/Completed/Pending) row with
// togglable MCQ/Subjective "type cards" filtering one list, which doesn't
// map cleanly onto three mutually-exclusive tabs; each test row's own
// StatusBadge already carries the per-test status mobile's status tabs
// would otherwise filter by. Subjects is a pure picker — subject cards
// only, no tests inline — clicking one navigates to a real route
// (/test/subject/[subjectName]) rather than expanding in-page state.
export default function TestListPage() {
  const router = useRouter();
  const { selectedCourse, enrolledCourses, enrollmentsLoading, error, refetch } = useSelectedCourse();
  const courseId = selectedCourse ? getCourseId(selectedCourse) : "";
  const { tests, testsLoading, error: testsError, refetch: refetchTests } = useTests(courseId || undefined);

  // Subjects tab shows only subject-summary cards now (no tests inline) —
  // aggregated once here rather than per-render inside the tab.
  const subjectSummaries = useMemo(() => {
    const groups = new Map<string, { total: number; completed: number }>();
    for (const test of tests) {
      const key = test.subjectName || "General";
      const entry = groups.get(key) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (test.attemptInfo?.status === "submitted" || test.attemptInfo?.status === "evaluated") {
        entry.completed += 1;
      }
      groups.set(key, entry);
    }
    return Array.from(groups.entries()).map(([subjectName, counts]) => ({ subjectName, ...counts }));
  }, [tests]);

  const mcqTests = useMemo(() => tests.filter((t) => t.type === "mcq"), [tests]);
  const subjectiveTests = useMemo(() => tests.filter((t) => t.type === "subjective"), [tests]);

  const totalTests = tests.length;
  const completedTests = tests.filter(
    (t) => t.attemptInfo?.status === "submitted" || t.attemptInfo?.status === "evaluated"
  ).length;
  // Exactly mirrors mobile's own computation (app/(tabs)/Test/TestPage.tsx):
  // sum of attemptInfo.percentage across tests that HAVE one (an
  // un-attempted test is excluded, not treated as a 0), divided by
  // completedTests — not scoredTests.length and not totalTests — with the
  // same `|| 1` divide-by-zero guard mobile uses rather than a `=== 0 ? 0`
  // branch, so this stays byte-for-byte the same formula, not just the
  // same idea.
  const scoredTests = tests.filter((t) => t.attemptInfo?.percentage !== undefined);
  const averageScore =
    scoredTests.reduce((sum, t) => sum + (t.attemptInfo?.percentage ?? 0), 0) / (completedTests || 1);

  if (enrollmentsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-md" />
          ))}
        </div>
        <Skeleton className="h-10 w-full max-w-md rounded-md" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
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
      <EmptyState
        icon={ClipboardList}
        title="No course selected"
        description={
          enrolledCourses.length === 0
            ? "Browse courses to get started."
            : "Select a course from My Batches to start testing."
        }
        action={
          enrolledCourses.length === 0
            ? { label: "Browse courses", onClick: () => router.push("/courses") }
            : { label: "Go to My Batches", onClick: () => router.push("/courses/my-batches") }
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {testsLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[68px] w-full rounded-md" />
            ))}
          </div>
          <Skeleton className="h-10 w-full max-w-md rounded-md" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        </div>
      ) : testsError ? (
        <InlineError message="Couldn't load tests." onRetry={() => refetchTests()} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatTile icon={ClipboardList} iconClassName="bg-primary/10 text-primary" value={totalTests} label="Total Tests" />
            <StatTile
              icon={CheckCircle2}
              iconClassName="bg-success-100 text-success-700"
              value={completedTests}
              label="Completed"
            />
            <StatTile
              icon={Gauge}
              iconClassName="bg-accent/10 text-accent"
              value={`${Math.round(averageScore)}%`}
              label="Avg Score"
            />
          </div>

          <Tabs defaultValue="subjects">
            <TabsList>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="mcq">MCQ</TabsTrigger>
              <TabsTrigger value="subjective">Subjective</TabsTrigger>
            </TabsList>

            <TabsContent value="subjects">
              {subjectSummaries.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No tests available for this course yet" />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {subjectSummaries.map((s) => (
                    <TestSubjectCard
                      key={s.subjectName}
                      subjectName={s.subjectName}
                      totalTests={s.total}
                      completedTests={s.completed}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mcq">
              {mcqTests.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No MCQ tests available for this course yet" />
              ) : (
                <div className="space-y-3">
                  {mcqTests.map((test) => (
                    <TestRow key={test._id} test={test} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="subjective">
              {subjectiveTests.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No subjective tests available for this course yet" />
              ) : (
                <div className="space-y-3">
                  {subjectiveTests.map((test) => (
                    <TestRow key={test._id} test={test} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
