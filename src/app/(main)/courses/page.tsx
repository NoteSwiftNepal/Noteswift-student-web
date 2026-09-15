"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCourses } from "@/hooks/queries/useCourses";
import { useEnrollments } from "@/hooks/queries/useEnrollments";
import { resolveCourse } from "@/lib/course";
import { CourseCard } from "@/components/courses/course-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";

type Tab = "all" | "free" | "pro" | "enrolled";

function CoursesPageContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "all";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");

  const userId = useAuthStore((s) => s.user?.id);
  const { courses, coursesLoading, error, refetch } = useCourses();
  const { enrollments, enrollmentsLoading } = useEnrollments(userId);

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((e) => (resolveCourse(e.courseId)?._id) ?? e.courseId)),
    [enrollments]
  );

  const filtered = useMemo(() => {
    let list = courses.filter((c) => c.status === "Published");
    if (tab === "free") list = list.filter((c) => c.type === "free");
    if (tab === "pro") list = list.filter((c) => c.type === "pro" || c.type === "featured");
    if (tab === "enrolled") list = list.filter((c) => enrolledIds.has(c._id));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || c.program?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [courses, tab, search, enrolledIds]);

  const loading = tab === "enrolled" ? enrollmentsLoading || coursesLoading : coursesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Courses</h1>
        <p className="text-sm text-muted-foreground">Browse and enroll in courses.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="free">Free</TabsTrigger>
            <TabsTrigger value="pro">Pro</TabsTrigger>
            <TabsTrigger value="enrolled">My Courses</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load courses." onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No courses found.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={null}>
      <CoursesPageContent />
    </Suspense>
  );
}
