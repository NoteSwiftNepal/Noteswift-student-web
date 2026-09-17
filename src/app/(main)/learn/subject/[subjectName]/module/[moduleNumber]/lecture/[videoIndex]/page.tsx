"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { useSubjectContent } from "@/hooks/queries/useSubjectContent";
import { getModuleProgress } from "@/api/lessonProgress";
import { getCourseId } from "@/lib/course";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { ChapterVideoTab } from "@/components/learn/chapter-video-tab";
import { ModuleLikeButton } from "@/components/learn/module-like-button";
import { ModuleComments } from "@/components/learn/module-comments";

// Mobile's real per-video screen (app/Chapter/[chapterDetail].tsx +
// ChapterDetail/ChapterDetailCard.tsx) — a full page (player, teacher
// attribution, like, comments), not an in-tab-panel expansion. Its own
// route (not folded into the module's Lectures tab) so a specific lecture
// can be deep-linked, matching mobile's own screen-per-video model.
// ChapterLecturesTab now navigates here on click instead of expanding a
// player inline.
export default function LectureDetailPage() {
  const params = useParams<{ subjectName: string; moduleNumber: string; videoIndex: string }>();
  const subjectName = decodeURIComponent(params.subjectName);
  const moduleNumber = Number(params.moduleNumber);
  const videoIndex = Number(params.videoIndex);
  const router = useRouter();
  const { selectedCourse } = useSelectedCourse();
  const courseId = selectedCourse ? getCourseId(selectedCourse) : "";

  const { subjectContent, subjectContentLoading, subjectContentError } = useSubjectContent(courseId, subjectName);
  const mod = subjectContent?.modules.find((m) => m.moduleNumber === moduleNumber);
  const video = mod?.videos[videoIndex];
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

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  if (!selectedCourse) {
    return <RoutePlaceholder title="No course selected" />;
  }

  if (subjectContentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-10 rounded-sm" />
        <Skeleton className="aspect-video w-full rounded-md" />
      </div>
    );
  }

  if (subjectContentError || !subjectContent || !mod || !video) {
    return <RoutePlaceholder title="Lecture not found" />;
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        onClick={() => router.back()}
        aria-label="Back"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {/* Existing player/progress-tracking component, untouched — only
          where/when it's mounted changed in this pass (a dedicated route
          instead of an in-tab reveal). */}
      <ChapterVideoTab
        courseId={courseId}
        subjectName={subjectName}
        moduleNumber={moduleNumber}
        courseSubjectId={courseSubjectId}
        video={video}
        videoIndex={videoIndex}
        alreadyCompleted={videoIndex === 0 && !!progress?.videoCompleted}
      />

      <div>
        {mod.description ? (
          <button
            type="button"
            onClick={() => setDescriptionExpanded((v) => !v)}
            className="flex w-full items-start justify-between gap-2 text-left"
          >
            <p className="flex-1 text-h3 text-foreground">{video.title || mod.moduleName}</p>
            <ChevronDown
              className={cn(
                "mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-fast ease-standard",
                descriptionExpanded && "rotate-180"
              )}
            />
          </button>
        ) : (
          <p className="text-h3 text-foreground">{video.title || mod.moduleName}</p>
        )}
        {descriptionExpanded && mod.description && (
          <p className="mt-2 text-body-sm text-muted-foreground">{mod.description}</p>
        )}
        {video.uploadedAt && (
          <p className="mt-2 text-caption text-muted-foreground">
            {new Date(video.uploadedAt).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Per-video teacherName/teacherAvatar — always populated by
            getSubjectContent (the real presenting teacher for a live-class
            recording, resolved server-side from the linked LiveClass; the
            subject's general assignment for a manual upload). No client-
            side fallback chain needed: confirmed directly against
            courseContentController.ts that the backend already resolves
            this precedence before the response ever reaches here. */}
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-11">
            <AvatarImage src={video.teacherAvatar} alt={video.teacherName || "Instructor"} />
            <AvatarFallback>{(video.teacherName || "I").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-title text-foreground">{video.teacherName || "Instructor"}</p>
            <p className="text-caption text-muted-foreground">Instructor</p>
          </div>
        </div>

        <ModuleLikeButton
          courseId={courseId}
          subjectName={subjectName}
          moduleNumber={moduleNumber}
          courseSubjectId={courseSubjectId}
          initialLiked={mod.likedByUser}
          initialCount={mod.likeCount}
        />
      </div>

      <ModuleComments
        courseId={courseId}
        subjectName={subjectName}
        moduleNumber={moduleNumber}
        courseSubjectId={courseSubjectId}
        videoId={video._id}
      />
    </div>
  );
}
