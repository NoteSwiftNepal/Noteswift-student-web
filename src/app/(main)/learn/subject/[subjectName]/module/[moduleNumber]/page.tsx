"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageCircleQuestion } from "lucide-react";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { useSubjectContent } from "@/hooks/queries/useSubjectContent";
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

  if (!selectedCourse) {
    return <RoutePlaceholder title="No course selected" />;
  }

  if (subjectContentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md rounded-md" />
        <Skeleton className="aspect-video w-full rounded-md" />
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
      <Tabs defaultValue="lectures">
        {/* Back button lives in the tab strip's own row (same fix as
            /learn/subject/[subjectName]) instead of floating above it as an
            isolated full-width line. */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <TabsList className="h-auto min-w-0 flex-1 flex-wrap">
            <TabsTrigger value="lectures">Lectures</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="dpps">DPPs</TabsTrigger>
            <TabsTrigger value="solutions">Solutions</TabsTrigger>
            <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lectures" className="mt-4">
          <ChapterLecturesTab subjectName={subjectName} moduleNumber={moduleNumber} videos={mod.videos} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <ChapterNotesTab
            courseId={courseId}
            subjectName={subjectName}
            moduleNumber={moduleNumber}
            courseSubjectId={courseSubjectId}
            notes={mod.notes}
          />
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
