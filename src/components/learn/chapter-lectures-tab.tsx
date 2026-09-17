"use client";

import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useVideoDurationStore } from "@/stores/videoDurationStore";
import { formatDuration, formatSecondsToClock } from "@/lib/formatDuration";
import type { ModuleVideo } from "@/types/subject-content";

// Mobile calls this tab "Lectures" (plural) because a module can have more
// than one lecture video (modules/[moduleId].tsx's videos[] list). Cards
// here are a picker list only — clicking one navigates to the dedicated
// lecture-detail route (player + teacher + like + comments, mirroring
// mobile's real per-video screen) rather than expanding a player inline.
function LectureCard({
  video,
  index,
  onClick,
}: {
  video: ModuleVideo;
  index: number;
  onClick: () => void;
}) {
  const cachedSeconds = useVideoDurationStore((s) => s.durationsBySeconds[video.url]);
  const displayDuration = cachedSeconds ? formatSecondsToClock(cachedSeconds) : formatDuration(video.duration);

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-[transform,box-shadow] duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-2"
    >
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PlayCircle className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-title text-foreground">{video.title || `Lecture ${index + 1}`}</p>
          {displayDuration && <p className="text-caption text-muted-foreground">{displayDuration}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function ChapterLecturesTab({
  subjectName,
  moduleNumber,
  videos,
}: {
  subjectName: string;
  moduleNumber: number;
  videos: ModuleVideo[];
}) {
  const router = useRouter();

  if (videos.length === 0) {
    return <EmptyState icon={PlayCircle} title="No video lectures for this module yet" />;
  }

  return (
    <div className="space-y-2">
      {videos.map((video, index) => (
        <LectureCard
          key={video.url}
          video={video}
          index={index}
          onClick={() =>
            router.push(
              `/learn/subject/${encodeURIComponent(subjectName)}/module/${moduleNumber}/lecture/${index}`
            )
          }
        />
      ))}
    </div>
  );
}
