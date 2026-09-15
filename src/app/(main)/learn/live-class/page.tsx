"use client";

import { useState } from "react";
import { Radio, Calendar, Video } from "lucide-react";
import { useLiveClasses } from "@/hooks/queries/useLiveClasses";
import { JoinLiveClassDialog } from "@/components/live-class/join-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

function LiveClassRow({ liveClass, onJoin }: { liveClass: LiveClass; onJoin: (lc: LiveClass) => void }) {
  const isOngoing = liveClass.status === "ongoing";
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isOngoing ? (
              <Badge className="gap-1 bg-red-100 text-red-700 hover:bg-red-100">
                <Radio className="size-3" />
                Live
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="size-3" />
                Scheduled
              </Badge>
            )}
            {liveClass.courseName && (
              <span className="truncate text-xs text-muted-foreground">{liveClass.courseName}</span>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{liveClass.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {liveClass.teacher} &middot; {liveClass.subject}
            {!isOngoing && liveClass.scheduledAt && ` · ${formatScheduledAt(liveClass.scheduledAt)}`}
          </p>
        </div>
        <Button size="sm" disabled={!isOngoing} onClick={() => onJoin(liveClass)}>
          <Video className="size-4" />
          {isOngoing ? "Join" : "Not started"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LiveClassListPage() {
  // Unscoped (no courseId) — every enrolled course's classes, matching the
  // backend's own default behavior when no ?courseId= filter is given.
  // 30s poll, same interval mobile's useLiveClasses uses so an "ongoing
  // now" class shows up without a manual refresh.
  const { liveClasses, liveClassesLoading, error, refetch } = useLiveClasses(undefined, { refetchInterval: 30000 });
  const [selected, setSelected] = useState<LiveClass | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const ongoing = liveClasses.filter((lc) => lc.status === "ongoing");
  const scheduled = liveClasses.filter((lc) => lc.status === "scheduled");

  const handleJoinClick = (lc: LiveClass) => {
    setSelected(lc);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Classes</h1>
        <p className="text-sm text-muted-foreground">Join an ongoing class or see what&apos;s scheduled.</p>
      </div>

      {liveClassesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load live classes." onRetry={() => refetch()} />
      ) : liveClasses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No live classes right now. Check back later.
        </div>
      ) : (
        <>
          {ongoing.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-foreground">Happening now</h2>
              <div className="space-y-3">
                {ongoing.map((lc) => (
                  <LiveClassRow key={lc.id} liveClass={lc} onJoin={handleJoinClick} />
                ))}
              </div>
            </section>
          )}

          {scheduled.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-foreground">Scheduled</h2>
              <div className="space-y-3">
                {scheduled.map((lc) => (
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
