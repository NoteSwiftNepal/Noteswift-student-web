import { BookOpen, TrendingUp, ClipboardCheck, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardData } from "@/types/dashboard";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-lg font-bold leading-none text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsRow({ stats }: { stats: DashboardData["stats"] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile icon={BookOpen} label="Enrolled courses" value={stats.enrolledCourses} />
      <StatTile icon={TrendingUp} label="Overall progress" value={`${stats.overallProgress}%`} />
      <StatTile
        icon={ClipboardCheck}
        label="Tests completed"
        value={`${stats.testsCompleted}/${stats.testsAvailable}`}
      />
      <StatTile icon={Video} label="Live classes today" value={stats.liveClassesToday} />
    </div>
  );
}
