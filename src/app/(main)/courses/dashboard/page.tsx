"use client";

import Link from "next/link";
import { School, ClipboardCheck, TrendingUp, Radio, Clock, Timer, HelpCircle, Layers, History, Download, ClipboardList, Bookmark, Rocket, PlayCircle, FileText, CheckCircle2, Users } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { useDashboard } from "@/hooks/queries/useDashboard";
import { getCourseId, resolveCourse } from "@/lib/course";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";

const STATS_CONFIG = [
  { key: "enrolledCourses" as const, label: "Courses", icon: School, className: "bg-primary/10 text-primary" },
  { key: "testsCompleted" as const, label: "Tests Done", icon: ClipboardCheck, className: "bg-green-500/10 text-green-600" },
  { key: "overallProgress" as const, label: "Avg Progress", icon: TrendingUp, className: "bg-amber-500/10 text-amber-600", suffix: "%" },
  { key: "liveClassesToday" as const, label: "Live Today", icon: Radio, className: "bg-purple-500/10 text-purple-600" },
];

const ACTIVITY_ICONS: Record<string, { icon: typeof PlayCircle; className: string }> = {
  video: { icon: PlayCircle, className: "bg-red-500/10 text-red-600" },
  notes: { icon: FileText, className: "bg-primary/10 text-primary" },
  test: { icon: CheckCircle2, className: "bg-green-500/10 text-green-600" },
  live_class: { icon: Users, className: "bg-purple-500/10 text-purple-600" },
  download: { icon: Download, className: "bg-amber-500/10 text-amber-600" },
};

const QUICK_LINKS = [
  { label: "My Batches", href: "/courses/my-batches", icon: Layers, className: "bg-indigo-500/10 text-indigo-600" },
  { label: "My History", href: "/history", icon: History, className: "bg-purple-500/10 text-purple-600" },
  { label: "Downloads", href: "/downloads", icon: Download, className: "bg-sky-500/10 text-sky-600" },
  { label: "My Doubts", href: "/ask/questions", icon: HelpCircle, className: "bg-orange-500/10 text-orange-600" },
  { label: "Tests", href: "/test", icon: ClipboardList, className: "bg-green-500/10 text-green-600" },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark, className: "bg-pink-500/10 text-pink-600" },
];

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  return { text: "Good Evening", emoji: "🌙" };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  if (hrs < 48) return "Yesterday";
  return `${Math.floor(hrs / 24)}d ago`;
}

// Ported from app/QuickAccess/Dashboard.tsx — the real, working mobile
// "Dashboard" screen, NOT the app/ProDashboard/* folder the previous
// /pro-dashboard build was sourced from (100% commented-out dead code, see
// MOBILE_APP_CODE_ISSUES.md). Scoped to whatever course useSelectedCourse
// resolves, same as mobile scopes this screen to courseStore.selectedCourse.
export default function CourseDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { selectedCourse, enrollments } = useSelectedCourse();
  const courseId = selectedCourse ? getCourseId(selectedCourse) : undefined;
  const { dashboardData, dashboardLoading, error, refetch } = useDashboard(courseId);

  const selectedEnrollment = selectedCourse
    ? enrollments.find((e) => (resolveCourse(e.courseId)?._id ?? e.courseId) === courseId)
    : undefined;

  const greeting = getGreeting();
  const hasData = dashboardData && (dashboardData.stats.enrolledCourses > 0 || dashboardData.stats.testsAvailable > 0);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A5F] to-primary p-6 text-primary-foreground">
        <p className="text-sm text-primary-foreground/80">
          {greeting.emoji} {greeting.text}
        </p>
        <h1 className="text-2xl font-extrabold">{user?.full_name || "Student"}</h1>
        <p className="mt-1 text-xs text-primary-foreground/70">
          {hasData ? `${dashboardData.stats.overallProgress}% overall progress · Keep going! 🚀` : "Let's start your learning journey today ✨"}
        </p>
      </div>

      {dashboardLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load your dashboard." onRetry={() => refetch()} />
      ) : (
        <>
          {dashboardData?.stats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS_CONFIG.map((stat) => (
                <Card key={stat.key}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${stat.className}`}>
                      <stat.icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-black leading-tight text-foreground">
                        {dashboardData.stats[stat.key]}
                        {stat.suffix ?? ""}
                      </p>
                      <p className="truncate text-xs font-medium text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedCourse && (
            <Link href="/learn" className="block">
              <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-700 p-5 text-primary-foreground">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">Continue Learning</p>
                <p className="mt-1 truncate text-lg font-bold">{selectedCourse.title}</p>
                {selectedCourse.offeredBy && (
                  <p className="truncate text-sm text-primary-foreground/80">by {selectedCourse.offeredBy}</p>
                )}
                <div className="mt-3.5 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${Math.round(selectedEnrollment?.weightedCourseProgress ?? 0)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{Math.round(selectedEnrollment?.weightedCourseProgress ?? 0)}%</span>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white">
                    <PlayCircle className="size-4 text-primary" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {dashboardData?.liveClassesToday && dashboardData.liveClassesToday.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">Live Classes</h2>
                <Link href="/learn/live-class" className="text-sm font-semibold text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {dashboardData.liveClassesToday.map((lc) => (
                  <div
                    key={lc._id}
                    className={`w-56 shrink-0 rounded-xl border p-4 ${lc.status === "live" ? "border-red-200 bg-red-50" : "border-border bg-card"}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          lc.status === "live" ? "bg-red-500 text-white" : lc.status === "attended" ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {lc.status === "live" ? "● LIVE" : lc.status === "attended" ? "Attended" : "Upcoming"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {lc.duration}m
                      </span>
                    </div>
                    <p className="mb-1 line-clamp-2 text-sm font-bold text-foreground">{lc.title}</p>
                    <p className="mb-2 truncate text-xs text-muted-foreground">{lc.teacherName}</p>
                    <p className="text-xs text-muted-foreground">{lc.scheduledAt ? formatTime(lc.scheduledAt) : "TBD"}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {dashboardData?.upcomingTests && dashboardData.upcomingTests.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">Upcoming Tests</h2>
                <Link href="/test" className="text-sm font-semibold text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {dashboardData.upcomingTests.map((test) => (
                  <div key={test._id} className="w-56 shrink-0 rounded-xl border border-border bg-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                        {test.type?.toUpperCase() || "MCQ"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="size-3" />
                        {test.duration}m
                      </span>
                    </div>
                    <p className="mb-1 line-clamp-2 text-sm font-bold text-foreground">{test.title}</p>
                    <p className="mb-2 truncate text-xs text-muted-foreground">{test.courseName}</p>
                    <p className="text-xs font-semibold text-amber-600">
                      {test.startTime ? `Opens ${new Date(test.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "Coming soon"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
                <Link href="/history" className="text-sm font-semibold text-primary hover:underline">
                  View all
                </Link>
              </div>
              <Card>
                <CardContent className="divide-y divide-border p-0">
                  {dashboardData.recentActivity.map((item) => {
                    const meta = ACTIVITY_ICONS[item.type] ?? ACTIVITY_ICONS.video;
                    return (
                      <div key={item._id} className="flex items-center gap-3 p-3.5">
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${meta.className}`}>
                          <meta.icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                          <div className="flex items-center gap-2">
                            {item.courseName && <p className="truncate text-xs text-muted-foreground">{item.courseName}</p>}
                            {item.type === "test" && item.score && (
                              <span className="text-xs font-semibold text-green-600">
                                {item.score.obtained}/{item.score.total}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(item.timestamp)}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          )}

          {!hasData && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Rocket className="size-7 text-primary" />
                </div>
                <p className="text-lg font-bold text-foreground">Kickstart Your Learning</p>
                <p className="text-sm text-muted-foreground">Enroll in courses, join live classes, and take tests to track your progress here.</p>
                <Button asChild>
                  <Link href="/courses">Explore Courses</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <section>
            <h2 className="mb-3 text-base font-bold text-foreground">Quick Links</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 transition-shadow hover:shadow-md"
                >
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${link.className}`}>
                    <link.icon className="size-4" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{link.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
