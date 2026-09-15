"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MessageCircleQuestion } from "lucide-react";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { useSubjectContent } from "@/hooks/queries/useSubjectContent";
import { useModuleProgressBulk } from "@/hooks/queries/useModuleProgress";
import { useTests } from "@/hooks/queries/useTests";
import { getCourseId } from "@/lib/course";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { ChapterCard } from "@/components/learn/chapter-card";
import { MindmapTab } from "@/components/learn/mindmap-tab";
import { ResourcesTab } from "@/components/learn/resources-tab";

function statusBadgeClass(status: string) {
  if (status === "submitted" || status === "evaluated") return "bg-green-100 text-green-700 hover:bg-green-100";
  if (status === "in-progress") return "bg-orange-100 text-orange-700 hover:bg-orange-100";
  return "bg-secondary text-secondary-foreground";
}

// Mirrors mobile's app/Chapter/ChapterTabs.tsx — the subject-detail screen,
// reached by tapping a subject on /learn. Same 6-tab structure as
// components/Tabs/TabNav.tsx (Modules default, Mind Map, Tests, [Ask],
// Resources, About), each tab's content ported from ChapterTabs.tsx's own
// per-tab rendering rather than assumed.
export default function SubjectDetailPage() {
  const params = useParams<{ subjectName: string }>();
  const subjectName = decodeURIComponent(params.subjectName);
  const router = useRouter();
  const { selectedCourse } = useSelectedCourse();
  const courseId = selectedCourse ? getCourseId(selectedCourse) : "";

  const { subjectContent, subjectContentLoading, subjectContentError, refetch } = useSubjectContent(courseId, subjectName);
  const modules = useMemo(
    () => (subjectContent?.modules ?? []).slice().sort((a, b) => a.moduleNumber - b.moduleNumber),
    [subjectContent]
  );
  const moduleNumbers = useMemo(() => modules.filter((m) => m.hasVideo).map((m) => m.moduleNumber), [modules]);
  const { progressByModule } = useModuleProgressBulk(courseId, subjectContent?.courseSubjectId, moduleNumbers);

  const { tests, testsLoading } = useTests(courseId || undefined);
  const subjectTests = tests.filter((t) => t.subjectName === subjectName);

  const askParams = new URLSearchParams({
    courseId,
    courseName: subjectContent?.courseName ?? selectedCourse?.title ?? "",
    subjectName,
  });

  if (!selectedCourse) {
    return <RoutePlaceholder title="No course selected" />;
  }

  if (subjectContentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (subjectContentError) {
    return <InlineError message="Couldn't load this subject." onRetry={() => refetch()} />;
  }

  if (!subjectContent) {
    return <RoutePlaceholder title="Subject not found" />;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => router.back()}>
        <ChevronLeft className="size-4" />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{subjectName}</h1>
        <p className="text-sm text-muted-foreground">{subjectContent.courseName}</p>
      </div>

      <Tabs defaultValue="modules">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="ask">Ask a Question</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-4">
          {modules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No chapters published for this subject yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod) => (
                <ChapterCard
                  key={mod.moduleNumber}
                  href={`/learn/subject/${encodeURIComponent(subjectName)}/module/${mod.moduleNumber}`}
                  moduleNumber={mod.moduleNumber}
                  moduleName={mod.moduleName}
                  tags={mod.tags}
                  watched={!!progressByModule.get(mod.moduleNumber)?.videoCompleted}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mindmap" className="mt-4">
          <MindmapTab courseId={courseId} subjectName={subjectName} />
        </TabsContent>

        <TabsContent value="tests" className="mt-4">
          {testsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : subjectTests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No tests available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {subjectTests.map((test) => (
                <Link
                  key={test._id}
                  href={
                    test.attemptInfo?.status === "submitted" || test.attemptInfo?.status === "evaluated"
                      ? `/test/${test._id}/result/${test.attemptInfo.attemptId}`
                      : `/test/${test._id}`
                  }
                >
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{test.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {test.duration} min &middot; {test.totalQuestions} questions
                        </p>
                      </div>
                      {test.attemptInfo?.status && (
                        <Badge className={statusBadgeClass(test.attemptInfo.status)}>{test.attemptInfo.status}</Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Mobile labels this tab "Ask AI," but it's a plain doubt-submission
            form (posts to /questions), not an AI chat — see
            MOBILE_APP_CODE_ISSUES.md. Renamed honestly here and routed to
            the already-built /ask/doubt page (with this subject prefilled)
            instead of duplicating a second inline form. */}
        <TabsContent value="ask" className="mt-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <MessageCircleQuestion className="size-8 text-primary" />
              <p className="text-sm font-medium text-foreground">Have a doubt about {subjectName}?</p>
              <p className="text-sm text-muted-foreground">Ask your course teachers directly — they&apos;ll be notified.</p>
              <Button asChild>
                <Link href={`/ask/doubt?${askParams.toString()}`}>Ask a Question</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <ResourcesTab courseId={courseId} />
        </TabsContent>

        {/* "Duration" is omitted here — confirmed fake: [subject].tsx hardcodes
            `duration: 'Duration not specified'` literally rather than reading
            any real field, and no per-subject duration exists on the real
            course model either way (see MOBILE_APP_CODE_ISSUES.md). */}
        <TabsContent value="about" className="mt-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-2 text-sm font-bold text-foreground">About this subject</h2>
              <p className="text-sm text-muted-foreground">
                {subjectContent.description || "No description available."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
