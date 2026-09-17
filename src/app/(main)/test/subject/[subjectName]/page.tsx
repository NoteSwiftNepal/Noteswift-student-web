"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ClipboardList } from "lucide-react";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { useTests } from "@/hooks/queries/useTests";
import { getCourseId } from "@/lib/course";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/inline-error";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { TestRow } from "@/components/test/test-row";

// Real route (not in-page state) for a subject's tests, reached from a
// TestSubjectCard on the Subjects tab — matches Learn's own subject
// drill-down convention (/learn/subject/[subjectName]), so it's linkable
// and the browser back button works normally. Reuses TestRow verbatim —
// same whole-card-click component the MCQ/Subjective tabs use, not a
// second implementation.
export default function SubjectTestsPage() {
  const params = useParams<{ subjectName: string }>();
  const subjectName = decodeURIComponent(params.subjectName);
  const router = useRouter();
  const { selectedCourse } = useSelectedCourse();
  const courseId = selectedCourse ? getCourseId(selectedCourse) : "";
  const { tests, testsLoading, error, refetch } = useTests(courseId || undefined);

  const subjectTests = useMemo(
    () => tests.filter((t) => (t.subjectName || "General") === subjectName),
    [tests, subjectName]
  );

  if (!selectedCourse) {
    return <RoutePlaceholder title="No course selected" />;
  }

  return (
    <div className="space-y-6">
      {/* Back button shares a row with the subject-name heading rather than
          floating alone above it — this page has no tab strip to anchor to
          instead, and (unlike the module/subject-detail pages, where the
          tab labels already carry that context) a bare test list with no
          heading here would leave no indication which subject it's for. */}
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
        <h1 className="truncate text-h2 text-foreground">{subjectName}</h1>
      </div>

      {testsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load tests." onRetry={() => refetch()} />
      ) : subjectTests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No tests available for this subject yet" />
      ) : (
        <div className="space-y-3">
          {subjectTests.map((test) => (
            <TestRow key={test._id} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}
