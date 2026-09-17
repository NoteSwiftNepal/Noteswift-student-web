"use client";

import { Flame, Trophy } from "lucide-react";
import { useCourseRank } from "@/hooks/queries/useCourseRank";
import { getFlameColor } from "@/lib/streakTiers";
import { StatTile } from "@/components/ui/stat-tile";

// Mirrors mobile's real ProfileHeader.tsx — a streak stat card (flame
// colored by tier, same getFlameColor mobile uses) and a rank card (the
// same real per-course rank endpoint mobile's StatCard.tsx/ProfileHeader.tsx
// share), not the previous bare "X day streak" text line with no rank at
// all. Reuses the exact StatTile component and useCourseRank hook the
// Dashboard's own stats-overview.tsx uses — same tiles, same fetch, not a
// second implementation.
//
// Mobile's ProfileHeader.tsx also defines a PointsStat (XP) component but
// never actually renders it — its own comment says why: "Points stays
// disabled (PointsStat, unused above) since it has no real data source
// yet." Confirmed directly in that file, not assumed from a description —
// left out here for the same reason, matching this project's standing
// discipline against porting unverified/stub mobile features.
export function ProfileStats({
  streak,
  studentId,
  courseId,
}: {
  streak: number;
  studentId: string | undefined;
  courseId: string | undefined;
}) {
  const { rank, rankLoading } = useCourseRank(studentId, courseId);

  return (
    <div className="grid grid-cols-2 gap-3">
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
          value={rankLoading ? "—" : rank ? `#${rank.rank}` : "—"}
          label={rankLoading ? "Class rank" : rank ? `of ${rank.totalStudents} students` : "Not ranked yet"}
        />
      ) : (
        <StatTile icon={Trophy} iconClassName="bg-accent/10 text-accent" value="—" label="Class rank" />
      )}
    </div>
  );
}
