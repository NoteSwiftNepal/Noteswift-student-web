"use client";

import { useState } from "react";
import { Calendar, History, PlayCircle, Radio, Video } from "lucide-react";
import { useLiveClasses } from "@/hooks/queries/useLiveClasses";
import { JoinLiveClassDialog } from "@/components/live-class/join-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/inline-error";
import type { LiveClass } from "@/types/live-class";

function formatScheduledAt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Mirrors mobile's LiveTabContent.tsx toRelative — used for a completed
// class's "ended ... ago" meta line.
function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function LiveClassRow({ liveClass, onJoin }: { liveClass: LiveClass; onJoin: (lc: LiveClass) => void }) {
  const isOngoing = liveClass.status === "ongoing";
  const isCompleted = liveClass.status === "completed";
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isOngoing ? (
              <StatusBadge tone="live">Live</StatusBadge>
            ) : isCompleted ? (
              <StatusBadge tone="neutral" icon={History}>
                Completed
              </StatusBadge>
            ) : (
              <StatusBadge tone="upcoming" icon={Calendar}>
                Scheduled
              </StatusBadge>
            )}
            {liveClass.courseName && (
              <span className="truncate text-caption text-muted-foreground">{liveClass.courseName}</span>
            )}
          </div>
          <p className="mt-1 truncate text-title text-foreground">{liveClass.title}</p>
          <p className="truncate text-body-sm text-muted-foreground">
            {liveClass.teacher} &middot; {liveClass.subject}
            {!isOngoing && !isCompleted && liveClass.scheduledAt && ` · ${formatScheduledAt(liveClass.scheduledAt)}`}
            {isCompleted && liveClass.endedAt && ` · Ended ${formatRelative(liveClass.endedAt)}`}
          </p>
        </div>
        {isCompleted ? (
          <Button size="sm" variant="outline" disabled={!liveClass.recordingUrl} asChild={!!liveClass.recordingUrl}>
            {liveClass.recordingUrl ? (
              <a href={liveClass.recordingUrl} target="_blank" rel="noreferrer">
                <PlayCircle className="size-4" />
                Watch recording
              </a>
            ) : (
              <span>No recording</span>
            )}
          </Button>
        ) : (
          <Button size="sm" disabled={!isOngoing} onClick={() => onJoin(liveClass)}>
            <Video className="size-4" />
            {isOngoing ? "Join" : "Not started"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Shared between the standalone /learn/live-class route and the "Live
// Classes" tab on /learn (docs/DESIGN-STANDARDS.md §12 fix-pass — mobile's
// real Learn page is three tabs, not a page linking out to this content) —
// one component, two entry points, not a copy-pasted fork.
export function LiveClassList() {
  // Unscoped (no courseId) — every enrolled course's classes, matching the
  // backend's own default behavior when no ?courseId= filter is given.
  // 30s poll, same interval mobile's useLiveClasses uses so an "ongoing
  // now" class shows up without a manual refresh.
  const { liveClasses, liveClassesLoading, error, refetch } = useLiveClasses(undefined, { refetchInterval: 30000 });
  const [selected, setSelected] = useState<LiveClass | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Root cause of the blank-panel bug: LiveClass.status is really
  // "ongoing" | "scheduled" | "completed" (confirmed against the live
  // endpoint's real response — every class returned there was "completed"),
  // but this only ever bucketed ongoing/scheduled. liveClasses.length > 0
  // skipped the empty state, and both buckets came back empty, so the
  // content branch rendered an empty fragment — no error, no failed
  // fetch, just a third status this list silently never accounted for.
  // Mobile's own LiveTabContent.tsx already shows completed classes as a
  // "Watch Recording" section — mirrored here instead of dropping them.
  const ongoing = liveClasses.filter((lc) => lc.status === "ongoing");
  const scheduled = liveClasses.filter((lc) => lc.status === "scheduled");
  const completed = liveClasses.filter((lc) => lc.status === "completed");

  const handleJoinClick = (lc: LiveClass) => {
    setSelected(lc);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {liveClassesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load live classes." onRetry={() => refetch()} />
      ) : liveClasses.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No live classes right now"
          description="Check back later for ongoing or scheduled classes."
        />
      ) : (
        <>
          {ongoing.length > 0 && (
            <section>
              <h2 className="mb-3 text-h2 text-foreground">Happening now</h2>
              <div className="space-y-3">
                {ongoing.map((lc) => (
                  <LiveClassRow key={lc.id} liveClass={lc} onJoin={handleJoinClick} />
                ))}
              </div>
            </section>
          )}

          {scheduled.length > 0 && (
            <section>
              <h2 className="mb-3 text-h2 text-foreground">Scheduled</h2>
              <div className="space-y-3">
                {scheduled.map((lc) => (
                  <LiveClassRow key={lc.id} liveClass={lc} onJoin={handleJoinClick} />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="mb-3 text-h2 text-foreground">Completed</h2>
              <div className="space-y-3">
                {completed.map((lc) => (
                  <LiveClassRow key={lc.id} liveClass={lc} onJoin={handleJoinClick} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <JoinLiveClassDialog liveClass={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
