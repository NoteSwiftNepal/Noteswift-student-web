"use client";

import { Flame, Gauge, Radio, Trophy } from "lucide-react";
import { useCourseRank } from "@/hooks/queries/useCourseRank";
import { getFlameColor } from "@/lib/streakTiers";
import { StatTile } from "@/components/ui/stat-tile";
import type { DashboardData } from "@/types/dashboard";

// Replaces the old StatsRow (4 tiles, 2 of which — enrolled courses, tests
// completed — read as filler once "today"'s numbers are this small) and the
// separately-floating RankCard + header streak pill with one composed
// identity/stats row. Same visual language (icon chip + value + label) for
// all four tiles so streak/rank don't read as bolted-on extras next to the
// two real dashboard stats. StatTile itself now lives in
// components/ui/stat-tile.tsx — shared with the Test page's own stats row
// rather than a second copy.

export function StatsOverview({
  stats,
  streak,
  studentId,
  courseId,
}: {
  stats: DashboardData["stats"];
  streak: number;
  studentId: string | undefined;
  courseId: string | undefined;
}) {
  const { rank, rankLoading: rankPending } = useCourseRank(studentId, courseId);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* Icon-chip tint: --primary/--accent are the tokens with real dark-mode
          lift (§2.1's .dark block), so an opacity tint on them (rather than a
          bare bg-brand-50/bg-gold-50 ramp stop, which the .dark block never
          redefines) is what actually stays legible if dark mode is toggled —
          confirmed by reading the .dark block, not assumed. */}
      <StatTile
        icon={Gauge}
        iconClassName="bg-primary/10 text-primary"
        value={`${stats.overallProgress}%`}
        label="Overall progress"
      />
      <StatTile
        icon={Radio}
        iconClassName="bg-danger-100 text-danger-700"
        value={stats.liveClassesToday}
        label="Live classes today"
      />
      <StatTile
        icon={Flame}
        iconClassName="bg-accent/10"
        iconStyle={{ color: getFlameColor(streak) }}
        value={`${streak}d`}
        label="Day streak"
      />
      {courseId ? (
        <StatTile
          icon={Trophy}
          iconClassName="bg-accent/10 text-accent"
          value={rankPending ? "—" : rank ? `#${rank.rank}` : "—"}
          label={rankPending ? "Class rank" : rank ? `of ${rank.totalStudents} students` : "Not ranked yet"}
        />
      ) : (
        <StatTile icon={Trophy} iconClassName="bg-accent/10 text-accent" value="—" label="Class rank" />
      )}
    </div>
  );
}
