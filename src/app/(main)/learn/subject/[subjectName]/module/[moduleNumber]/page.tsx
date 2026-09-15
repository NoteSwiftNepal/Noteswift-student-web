"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageCircleQuestion } from "lucide-react";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { useSubjectContent } from "@/hooks/queries/useSubjectContent";
import { getModuleProgress } from "@/api/lessonProgress";
import { getCourseId } from "@/lib/course";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { ChapterLecturesTab } from "@/components/learn/chapter-lectures-tab";
import { ChapterNotesTab } from "@/components/learn/chapter-notes-tab";
import { ChapterDppTab } from "@/components/learn/chapter-dpp-tab";
import { ChapterSolutionsTab } from "@/components/learn/chapter-solutions-tab";
import { MindmapTab } from "@/components/learn/mindmap-tab";

// Mirrors mobile's app/Chapter/modules/[moduleId].tsx — the module-detail
// screen reached by tapping a module in the Subjects tab's Modules grid.
// Five tabs (Lectures/Notes/DPPs/Solutions/Mindmap), NOT the earlier Phase 3
// shape (Video/Notes/DPP-with-nested-solutions) — see MOBILE_APP_CODE_ISSUES.md
// for why that shape was wrong.
export default function ModuleDetailPage() {
  const params = useParams<{ subjectName: string; moduleNumber: string }>();
  const subjectName = decodeURIComponent(params.subjectName);
  const moduleNumber = Number(params.moduleNumber);
  const router = useRouter();
  const { selectedCourse } = useSelectedCourse();
  const courseId = selectedCourse ? getCourseId(selectedCourse) : "";

  const { subjectContent, subjectContentLoading, subjectContentError } = useSubjectContent(courseId, subjectName);
  const mod = subjectContent?.modules.find((m) => m.moduleNumber === moduleNumber);
  const courseSubjectId = subjectContent?.courseSubjectId ?? "";

  const { data: progress } = useQuery({
    queryKey: ["module-progress", courseId, moduleNumber, courseSubjectId],
    queryFn: async () => {
      const res = await getModuleProgress(courseId, moduleNumber, courseSubjectId);
      if (!res.success) throw new Error(res.message);
      return res.data.moduleProgress;
    },
    enabled: !!courseId && !!courseSubjectId,
  });

  if (!selectedCourse) {
    return <RoutePlaceholder title="No course selected" />;
  }

  if (subjectContentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="aspect-video w-full rounded-xl" />
      </div>
    );
  }

  if (subjectContentError || !subjectContent || !mod) {
    return <RoutePlaceholder title="Chapter not found" />;
  }

  const askParams = new URLSearchParams({
    courseId,
    courseName: subjectContent.courseName,
    subjectName,
    moduleNumber: String(moduleNumber),
    moduleName: mod.moduleName,
  });

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => router.back()}>
        <ChevronLeft className="size-4" />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{mod.moduleName}</h1>
        <p className="text-sm text-muted-foreground">
          {subjectContent.courseName} &middot; {subjectName}
        </p>
      </div>

      <Tabs defaultValue="lectures">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="lectures">Lectures</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="dpps">DPPs</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
        </TabsList>

        <TabsContent value="lectures" className="mt-4">
          <ChapterLecturesTab
            courseId={courseId}
            subjectName={subjectName}
            moduleNumber={moduleNumber}
            courseSubjectId={courseSubjectId}
            videos={mod.videos}
            alreadyCompleted={!!progress?.videoCompleted}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          {mod.hasNotes ? (
            <ChapterNotesTab courseId={courseId} subjectName={subjectName} moduleNumber={moduleNumber} courseSubjectId={courseSubjectId} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              No notes available for this module.
            </div>
          )}
        </TabsContent>

        <TabsContent value="dpps" className="mt-4">
          <ChapterDppTab
            courseId={courseId}
            subjectName={subjectName}
            moduleNumber={moduleNumber}
            courseSubjectId={courseSubjectId}
            dpps={mod.dpps}
          />
        </TabsContent>

        <TabsContent value="solutions" className="mt-4">
          <ChapterSolutionsTab
            courseId={courseId}
            subjectName={subjectName}
            moduleNumber={moduleNumber}
            courseSubjectId={courseSubjectId}
            solutions={mod.solutions}
          />
        </TabsContent>

        <TabsContent value="mindmap" className="mt-4">
          <MindmapTab courseId={courseId} subjectName={subjectName} moduleNumber={moduleNumber} />
        </TabsContent>
      </Tabs>

      <Button variant="outline" asChild className="w-full sm:w-auto">
        <Link href={`/ask/doubt?${askParams.toString()}`}>
          <MessageCircleQuestion className="size-4" />
          Ask about this module
        </Link>
      </Button>
    </div>
  );
}
