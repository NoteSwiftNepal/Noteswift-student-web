"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Crown, Package, Settings } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEnrollments } from "@/hooks/queries/useEnrollments";
import { resolveCourse } from "@/lib/course";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import { cn } from "@/lib/utils";

type Section = "packages" | "payments" | "account";

const SECTIONS: { key: Section; label: string; icon: typeof Package }[] = [
  { key: "packages", label: "My Packages", icon: Package },
  { key: "payments", label: "Payment History", icon: CreditCard },
  { key: "account", label: "Account Settings", icon: Settings },
];

// ProDashboard/DashboardHome.tsx, PaymentHistory.tsx, AccountSettings.tsx,
// and AddMorePackages.tsx are entirely commented-out dead code on mobile —
// no live export, hardcoded mock data even where content exists (see
// MOBILE_APP_CODE_ISSUES.md). "MyPackages" isn't a real screen either, only
// a commented-out route reference. Built fresh here instead of porting mock
// arrays: My Packages uses the real enrollment data this app already has
// (Pro/featured course enrollments); Payment History has no backing
// endpoint anywhere in the backend, so it's an honest empty state rather
// than fabricated transactions; Account Settings links to the real
// /settings page instead of duplicating its unpersisted mobile toggles.
export default function ProDashboardPage() {
  const [section, setSection] = useState<Section>("packages");
  const userId = useAuthStore((s) => s.user?.id);
  const { enrollments, enrollmentsLoading, error, refetch } = useEnrollments(userId);

  const proEnrollments = enrollments.filter((e) => {
    const course = resolveCourse(e.courseId);
    return course?.type === "pro" || course?.type === "featured";
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              section === s.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/60"
            )}
          >
            <s.icon className="size-4" />
            {s.label}
          </button>
        ))}
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="size-5 text-purple-600" />
          <h1 className="text-2xl font-bold text-foreground">Pro Dashboard</h1>
        </div>

        {section === "packages" && (
          <div className="space-y-3">
            {enrollmentsLoading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
            ) : error ? (
              <InlineError message="Couldn't load your packages." onRetry={() => refetch()} />
            ) : proEnrollments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <Package className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">You don&apos;t have any Pro packages yet.</p>
                  <Button asChild>
                    <Link href="/courses">Browse Pro Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              proEnrollments.map((e) => {
                const course = resolveCourse(e.courseId);
                if (!course) return null;
                return (
                  <Card key={e._id}>
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Enrolled {new Date(e.enrolledAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                        {Math.round(e.weightedCourseProgress)}% complete
                      </span>
                    </CardContent>
                  </Card>
                );
              })
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/courses">Add More Packages</Link>
            </Button>
          </div>
        )}

        {section === "payments" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CreditCard className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No payment history available</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Payment history isn&apos;t tracked by the backend yet — this section will populate once that&apos;s added.
              </p>
            </CardContent>
          </Card>
        )}

        {section === "account" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Settings className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Manage your password and notification preferences in Settings.</p>
              <Button asChild>
                <Link href="/settings">Go to Settings</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
