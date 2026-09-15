"use client";

import { Flame } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useDashboard } from "@/hooks/queries/useDashboard";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { getCourseId } from "@/lib/course";
import { getFlameColor } from "@/lib/streakTiers";
import { PromoCarousel } from "@/components/dashboard/promo-carousel";
import { StatsRow } from "@/components/dashboard/stats-row";
import { RankCard } from "@/components/dashboard/rank-card";
import { TodaysClassesSection } from "@/components/dashboard/todays-classes-section";
import { CourseCatalogSection } from "@/components/dashboard/course-catalog-section";
import { NoteSwiftPromo } from "@/components/dashboard/noteswift-promo";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  // The dashboard endpoint only returns liveClassesToday when scoped to a
  // specific, enrollment-verified courseId (blueprint §9). Scoped to
  // whatever course is currently selected (useSelectedCourse — the same
  // mechanism My Batches/Profile/Learn all share), not just "the first
  // enrolled course," now that a real selected-course concept exists.
  const { selectedCourse } = useSelectedCourse();
  const scopedCourseId = selectedCourse ? getCourseId(selectedCourse) : undefined;

  const { dashboardData, dashboardLoading, error, refetch } = useDashboard(scopedCourseId);
  const streak = user?.currentStreak ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {user ? `Welcome back, ${user.full_name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening today.</p>
        </div>
        {/* Real daily streak — user.currentStreak is already server-computed
            (real learning activity, not app-opens) and already on the
            authenticated user object; no new endpoint needed. */}
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
          <Flame className="size-4" style={{ color: getFlameColor(streak) }} fill={getFlameColor(streak)} />
          <span className="text-sm font-bold text-foreground">{streak}d</span>
        </div>
      </div>

      <PromoCarousel />

      {dashboardLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load your stats." onRetry={() => refetch()} />
      ) : dashboardData ? (
        <div className="space-y-3">
          <StatsRow stats={dashboardData.stats} />
          <RankCard studentId={user?.id} courseId={scopedCourseId} />
        </div>
      ) : null}

      <TodaysClassesSection classes={dashboardData?.liveClassesToday ?? []} />

      <CourseCatalogSection />

      <NoteSwiftPromo />
    </div>
  );
}
