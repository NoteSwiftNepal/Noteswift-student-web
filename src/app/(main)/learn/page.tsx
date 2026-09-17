"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, GraduationCap } from "lucide-react";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { useAllSubjectContents } from "@/hooks/queries/useSubjectContent";
import { getCourseId } from "@/lib/course";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/inline-error";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveClassList } from "@/components/learn/live-class-list";
import { DownloadsList } from "@/components/learn/downloads-list";

// Three pill tabs — Subjects, Live Classes, Saved — mirroring mobile's real
// app/(tabs)/Learn/LearnPage.tsx structure exactly (docs/DESIGN-STANDARDS.md
// §12 fix-pass). The previous web version diverged: a course-title header
// plus two outline buttons linking out to /learn/live-class and /downloads
// instead of real in-page tabs, and a "Downloads" entry that doesn't exist
// on mobile at all (mobile's third tab is "Saved Notes", not "Downloads").
export default function LearnPage() {
  const router = useRouter();
  const { selectedCourse, enrolledCourses, enrollmentsLoading, error, refetch } = useSelectedCourse();
  const subjectNames = selectedCourse?.subjects?.map((s) => s.name) ?? [];
  const { subjectContents, isLoaded } = useAllSubjectContents(selectedCourse ? getCourseId(selectedCourse) : undefined, subjectNames);

  if (enrollmentsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <InlineError message="Couldn't load your courses." onRetry={() => refetch()} />;
  }

  if (enrolledCourses.length === 0 || !selectedCourse) {
    return enrolledCourses.length === 0 ? (
      <EmptyState
        icon={BookOpen}
        title="No course selected"
        description="Browse courses to get started."
        action={{ label: "Browse courses", onClick: () => router.push("/courses") }}
      />
    ) : (
      <EmptyState
        icon={BookOpen}
        title="No course selected"
        description="Select a course from My Batches to start learning."
        action={{ label: "Go to My Batches", onClick: () => router.push("/courses/my-batches") }}
      />
    );
  }

  return (
    <Tabs defaultValue="subjects">
      <TabsList>
        <TabsTrigger value="subjects">Subjects</TabsTrigger>
        <TabsTrigger value="live">Live Classes</TabsTrigger>
        <TabsTrigger value="saved">Saved</TabsTrigger>
      </TabsList>

      <TabsContent value="subjects">
        {selectedCourse.subjects && selectedCourse.subjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedCourse.subjects.map((s) => {
              const content = subjectContents.get(s.name);
              const lessonCount = content ? content.modules.length : isLoaded ? (s.modules?.length ?? 0) : null;
              return (
                <Link key={s.name} href={`/learn/subject/${encodeURIComponent(s.name)}`}>
                  <Card className="h-full transition-shadow duration-fast ease-standard hover:shadow-2">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                        <GraduationCap className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-title text-foreground">{s.name}</p>
                        <div className="mt-1 text-caption text-muted-foreground">
                          {lessonCount === null ? (
                            <Skeleton className="h-3 w-16" />
                          ) : (
                            <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5">
                              {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={BookOpen} title="No subjects configured for this course yet" />
        )}
      </TabsContent>

      <TabsContent value="live">
        <LiveClassList />
      </TabsContent>

      <TabsContent value="saved">
        <DownloadsList />
      </TabsContent>
    </Tabs>
  );
}
