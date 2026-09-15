import { Radio, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardLiveClass } from "@/types/dashboard";
import { SectionHeader } from "./section-header";

export function TodaysClassesSection({ classes }: { classes: DashboardLiveClass[] }) {
  if (classes.length === 0) {
    return (
      <section>
        <SectionHeader title="Today's Classes" />
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-8 text-center">
            <p className="text-sm font-semibold text-foreground">No classes today</p>
            <p className="text-xs text-muted-foreground">
              Check back later for upcoming live classes.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title="Today's Classes" href="/learn/live-class" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((lc) => (
          <Card key={lc._id}>
            <CardContent className="flex flex-col gap-3 p-4">
              <div>
                <p className="line-clamp-1 text-sm font-bold text-foreground">{lc.title}</p>
                {lc.courseName && (
                  <p className="line-clamp-1 text-xs text-muted-foreground">{lc.courseName}</p>
                )}
              </div>

              {lc.status === "live" ? (
                <Badge className="w-fit gap-1 bg-red-500 text-white hover:bg-red-500">
                  <Radio className="size-3" />
                  Live now
                </Badge>
              ) : (
                <span className="flex w-fit items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {lc.scheduledAt ? new Date(lc.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scheduled"}
                </span>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
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
