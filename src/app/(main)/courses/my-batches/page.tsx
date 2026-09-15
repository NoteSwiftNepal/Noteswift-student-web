"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, CalendarDays } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { resolveCourse, getCourseId } from "@/lib/course";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import { cn } from "@/lib/utils";

type TypeTab = "Paid" | "Free";
type StatusFilter = "All" | "Expired";

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// duration is "N months"-shaped free text on Course (real, course-level
// field — unlike the fake per-subject one found in the previous Learn
// pass) — same parse-leading-number approach mobile's MyBatch.tsx uses.
function calcEndDate(enrolledAt: string, duration?: string): Date {
  const start = new Date(enrolledAt);
  const n = parseInt(duration?.match(/\d+/)?.[0] ?? "0", 10);
  if (!n) return start;
  const end = new Date(start);
  end.setMonth(end.getMonth() + n);
  return end;
}

function isRecent(dateStr: string, days = 7): boolean {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff >= 0 && diff < days * 86400000;
}

// Ported from app/QuickAccess/MyBatch.tsx — the mobile screen where course
// selection actually happens (courseStore.selectCourse), not the Learn page
// itself. This is the same useSelectedCourse hook (and the same underlying
// Student.selectedCourseId field) the Profile switcher and the Learn pages
// all read/write — one mechanism, three entry points.
export default function MyBatchesPage() {
  const router = useRouter();
  const { enrollments, enrollmentsLoading, error, refetch, selectCourse, selectingCourse } = useSelectedCourse();
  const [typeTab, setTypeTab] = useState<TypeTab>("Paid");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [studyingId, setStudyingId] = useState<string | null>(null);

  const populated = useMemo(
    () =>
      enrollments
        .map((e) => ({ enrollment: e, course: resolveCourse(e.courseId) }))
        .filter((x): x is { enrollment: (typeof enrollments)[number]; course: NonNullable<typeof x.course> } => !!x.course),
    [enrollments]
  );

  const filtered = useMemo(() => {
    return populated.filter(({ enrollment, course }) => {
      const isFree = course.type === "free" || course.price === 0;
      const typeMatch = typeTab === "Free" ? isFree : !isFree;
      const endDate = calcEndDate(enrollment.enrolledAt, course.duration);
      const status = new Date() > endDate ? "Expired" : "All";
      const statusMatch = statusFilter === "All" || status === statusFilter;
      return typeMatch && statusMatch;
    });
  }, [populated, typeTab, statusFilter]);

  const handleStudy = (courseId: string) => {
    setStudyingId(courseId);
    selectCourse(courseId, {
      onSuccess: (res) => {
        setStudyingId(null);
        if (!res.success) {
          toast({ title: "Couldn't switch course", description: res.message, variant: "destructive" });
          return;
        }
        router.push("/learn");
      },
      onError: () => {
        setStudyingId(null);
        toast({ title: "Couldn't switch course", description: "Please try again.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Batches</h1>
        <p className="text-sm text-muted-foreground">Every course you&apos;re enrolled in — pick one to start studying.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full bg-secondary p-1">
          {(["Paid", "Free"] as TypeTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeTab(t)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                typeTab === t ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["All", "Expired"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                statusFilter === f ? "border-primary text-primary" : "border-border text-muted-foreground hover:bg-secondary/60"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {enrollmentsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load your batches." onRetry={() => refetch()} />
      ) : populated.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <GraduationCap className="mb-3 size-10 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No enrolled courses yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Enroll in a course to see it here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No matching batches. Try changing the filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ enrollment, course }) => {
            const id = getCourseId(course);
            const endDate = calcEndDate(enrollment.enrolledAt, course.duration);
            const isNew = isRecent(enrollment.enrolledAt);
            return (
              <Card key={enrollment._id} className="overflow-hidden">
                <div className="relative aspect-[1280/630] w-full bg-gradient-to-br from-primary/20 to-primary/50">
                  {course.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnail} alt={course.title} className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <span className="absolute bottom-3 left-3 rounded-lg bg-card/90 px-3 py-1 text-sm font-medium text-foreground">
                    {course.program}
                  </span>
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-lg font-bold text-foreground">{course.title}</p>
                    {isNew && (
                      <span className="shrink-0 rounded bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900">New</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="size-4 shrink-0" />
                    <span>
                      Starts {formatDate(new Date(enrollment.enrolledAt))} &middot; Ends {formatDate(endDate)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <Button className="w-full" onClick={() => handleStudy(id)} disabled={selectingCourse && studyingId === id}>
                      {selectingCourse && studyingId === id ? "Switching..." : "Let's Study"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
