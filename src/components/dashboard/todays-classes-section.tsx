import { CalendarClock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardLiveClass } from "@/types/dashboard";
import { SectionHeader } from "./section-header";

export function TodaysClassesSection({ classes }: { classes: DashboardLiveClass[] }) {
  if (classes.length === 0) {
    return (
      <section>
        <SectionHeader title="Today's Classes" />
        {/* Reassuring tone (§6.10) — an empty schedule today is expected/
            normal, not a problem to fix, so no action button. */}
        <EmptyState
          icon={CalendarClock}
          title="No classes today"
          description="Check back later for upcoming live classes."
        />
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title="Today's Classes" href="/learn/live-class" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((lc) => (
          <Card key={lc._id}>
            <CardContent className="flex flex-col gap-3 p-5">
              <div>
                <p className="line-clamp-1 text-title text-foreground">{lc.title}</p>
                {lc.courseName && (
                  <p className="line-clamp-1 text-body-sm text-muted-foreground">{lc.courseName}</p>
                )}
              </div>

              {lc.status === "live" ? (
                <StatusBadge tone="live">Live now</StatusBadge>
              ) : (
                <span className="flex w-fit items-center gap-1 text-caption text-muted-foreground">
                  <CalendarClock className="size-3.5" />
                  {lc.scheduledAt ? new Date(lc.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scheduled"}
                </span>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="flex items-center gap-1 text-caption text-muted-foreground">
                  <Users className="size-3.5" />
                  {lc.participants}
                </span>
                <Button size="sm" disabled={lc.status !== "live"} asChild={lc.status === "live"}>
                  {lc.status === "live" ? (
                    <a href={`/learn/live-class/${lc.roomId ?? ""}`}>Join now</a>
                  ) : (
                    <span>Notify me</span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
