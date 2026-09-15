import { CalendarClock, ClipboardCheck, FileCheck2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { StudentProgressEntry } from "@/types/student-progress";

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// Ported from components/Container/SubjectStatsCard.tsx — same stat rows
// (tests, assignments, attendance), same "no attempts yet"/"none submitted
// yet"/"no live classes yet" per-row fallbacks instead of showing 0s that
// could be mistaken for a real (bad) score.
export function SubjectStatsCard({ subjectName, entry }: { subjectName: string; entry: StudentProgressEntry }) {
  const completion = Math.round(entry.weightedProgress || 0);
  const lastActivity = formatDate(entry.lastActivityAt);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-base font-semibold text-foreground">{subjectName}</p>
          <span className="text-sm font-medium text-muted-foreground">{completion}%</span>
        </div>
        <Progress value={completion} className="h-2" />

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Tests</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {entry.testPerformance.attemptsCount > 0
                  ? `${entry.testPerformance.attemptsCount} attempt${entry.testPerformance.attemptsCount === 1 ? "" : "s"} · ${Math.round(entry.testPerformance.averagePercentage || 0)}% avg`
                  : "No attempts yet"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
              <FileCheck2 className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Assignments</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {entry.assignmentPerformance.submittedCount > 0
                  ? `${entry.assignmentPerformance.submittedCount} submitted · ${Math.round(entry.assignmentPerformance.averageScore || 0)} avg score`
                  : "None submitted yet"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
              <CalendarClock className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Attendance</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {entry.attendance.liveClassesRegistered > 0
                  ? `${entry.attendance.liveClassesAttended}/${entry.attendance.liveClassesRegistered} classes · ${Math.round(entry.attendance.attendanceRate || 0)}%`
                  : "No live classes yet"}
              </p>
            </div>
          </div>
        </div>

        {lastActivity && <p className="text-xs text-muted-foreground">Last activity: {lastActivity}</p>}
      </CardContent>
    </Card>
  );
}
