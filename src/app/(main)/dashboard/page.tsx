"use client";

import { useAuthStore } from "@/stores/authStore";
import { useDashboard } from "@/hooks/queries/useDashboard";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { getCourseId } from "@/lib/course";
import { PromoCarousel } from "@/components/dashboard/promo-carousel";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { TodaysClassesSection } from "@/components/dashboard/todays-classes-section";
import { CourseCatalogSection } from "@/components/dashboard/course-catalog-section";
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
    <div className="space-y-8 lg:space-y-12">
      <PromoCarousel />

      {/* Identity/stats section — progress, live-today, streak, and rank in
          one composed row (docs/DESIGN-STANDARDS.md §12 Part A.2) rather
          than a stats grid plus a separately-floating streak pill and
          RankCard, which read as two bolted-on features. */}
      {dashboardLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load your stats." onRetry={() => refetch()} />
      ) : dashboardData ? (
        <StatsOverview
          stats={dashboardData.stats}
          streak={streak}
          studentId={user?.id}
          courseId={scopedCourseId}
        />
      ) : null}

      <TodaysClassesSection classes={dashboardData?.liveClassesToday ?? []} />

      <CourseCatalogSection />
    </div>
  );
}
