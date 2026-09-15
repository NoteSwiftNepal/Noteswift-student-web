"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { getStudentCourseRank } from "@/api/student/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Real, working, self-only class rank — mobile's Leaderboard/MyRank screens
// are confirmed static stubs (no API call at all, see
// MOBILE_APP_CODE_ISSUES.md), but the backend has genuinely had a working
// rank endpoint the mobile app never wired up to any screen. A non-success
// response here is a real, expected outcome (no course selected, not
// enrolled, trial-only, or enrolled but not yet computed) — never treated
// as an error to retry, just an honest "not ranked yet" state, per the
// endpoint's own comments.
export function RankCard({ studentId, courseId }: { studentId: string | undefined; courseId: string | undefined }) {
  const { data, isPending } = useQuery({
    queryKey: ["course-rank", studentId, courseId],
    queryFn: async () => {
      const res = await getStudentCourseRank(studentId!, courseId!);
      return res.success ? res.data : null;
    },
    enabled: !!studentId && !!courseId,
  });

  if (!courseId) {
    return null;
  }

  if (isPending) {
    return <Skeleton className="h-20 w-full rounded-xl" />;
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
          <Trophy className="size-5" />
        </div>
        {data ? (
          <div className="min-w-0">
            <p className="text-lg font-black leading-tight text-foreground">
              #{data.rank} <span className="text-sm font-medium text-muted-foreground">of {data.totalStudents}</span>
            </p>
            <p className="text-xs font-medium text-muted-foreground">Class rank</p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Not ranked yet</p>
            <p className="text-xs text-muted-foreground">Keep learning to appear on the leaderboard.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
