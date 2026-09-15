"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { ChapterVideoTab } from "@/components/learn/chapter-video-tab";
import { cn } from "@/lib/utils";
import type { ModuleVideo } from "@/types/subject-content";

// Mobile calls this tab "Lectures" (plural) because a module can have more
// than one lecture video (modules/[moduleId].tsx's videos[] list) — the
// earlier Phase 3 implementation only ever played videos[0] under a
// singular "Video" tab. This adds the picker mobile has and reuses the
// existing, already-working ChapterVideoTab player/progress-marking
// component as-is for whichever lecture is selected, rather than
// duplicating video-playback logic.
export function ChapterLecturesTab({
  courseId,
  subjectName,
  moduleNumber,
  courseSubjectId,
  videos,
  alreadyCompleted,
}: {
  courseId: string;
  subjectName: string;
  moduleNumber: number;
  courseSubjectId: string;
  videos: ModuleVideo[];
  alreadyCompleted: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (videos.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border">
        <PlayCircle className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No video lectures for this module yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ChapterVideoTab
        key={activeIndex}
        courseId={courseId}
        subjectName={subjectName}
        moduleNumber={moduleNumber}
        courseSubjectId={courseSubjectId}
        video={videos[activeIndex]}
        videoIndex={activeIndex}
        alreadyCompleted={activeIndex === 0 && alreadyCompleted}
      />

      {videos.length > 1 && (
        <div className="space-y-2">
          {videos.map((video, index) => (
            <button
              key={video.url}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                index === activeIndex ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PlayCircle className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {video.title || `Lecture ${index + 1}`}
                </p>
                {video.duration && <p className="text-xs text-muted-foreground">{video.duration}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
