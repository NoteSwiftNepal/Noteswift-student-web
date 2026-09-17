import Link from "next/link";
import { CheckCircle2, ChevronRight, Clock, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { Test } from "@/types/test";

function TestStatusBadge({ test }: { test: Test }) {
  if (test.attemptInfo?.status === "submitted" || test.attemptInfo?.status === "evaluated") {
    return (
      <StatusBadge tone="success" icon={CheckCircle2}>
        {Math.round(test.attemptInfo.percentage)}%
      </StatusBadge>
    );
  }
  if (test.attemptInfo?.status === "in-progress") {
    return <StatusBadge tone="upcoming">In progress</StatusBadge>;
  }
  if (test.availability === "upcoming") {
    return (
      <StatusBadge tone="neutral" icon={Lock}>
        Upcoming
      </StatusBadge>
    );
  }
  if (test.availability === "closed") {
    return (
      <StatusBadge tone="neutral" icon={Lock}>
        Closed
      </StatusBadge>
    );
  }
  if (!test.canAttempt) {
    return (
      <StatusBadge tone="neutral" icon={Lock}>
        Unavailable
      </StatusBadge>
    );
  }
  return null;
}

// Shared test row — used by the Subjects-drill-down page and the MCQ/
// Subjective tabs on /test alike, so the Start/Continue/View-results/
// lock-state logic lives in exactly one place. Whole-card click target, no
// button inside the card (docs/DESIGN-STANDARDS.md §12 fix-pass — matches
// how course/chapter cards already work elsewhere): in-progress continues
// the attempt, submitted/evaluated opens the result, otherwise starts a
// fresh attempt if canAttempt — and a genuinely locked test (upcoming/
// closed availability, or canAttempt false for any other reason) renders as
// a plain, muted, non-interactive card with no Link at all rather than a
// clickable-looking card whose click silently does nothing.
export function TestRow({ test }: { test: Test }) {
  const isInProgress = test.attemptInfo?.status === "in-progress";
  const isCompleted = test.attemptInfo?.status === "submitted" || test.attemptInfo?.status === "evaluated";
  const locked = !isInProgress && !isCompleted && !test.canAttempt;

  const href = isCompleted ? `/test/${test._id}/result/${test.attemptInfo!.attemptId}` : `/test/${test._id}`;

  const card = (
    <Card
      className={cn(
        "transition-[transform,box-shadow] duration-fast ease-standard",
        locked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-2"
      )}
    >
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-title text-foreground">{test.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
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
        <div className="flex shrink-0 items-center gap-2">
          <TestStatusBadge test={test} />
          {!locked && <ChevronRight className="size-4 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );

  if (locked) {
    return card;
  }

  return (
    <Link href={href} className="block">
      {card}
    </Link>
  );
}
