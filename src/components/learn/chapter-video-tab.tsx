"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PlayCircle } from "lucide-react";
import { getVideoSignedUrl } from "@/api/student/learn";
import { updateModuleProgress } from "@/api/lessonProgress";
import type { ModuleVideo } from "@/types/subject-content";
import { Skeleton } from "@/components/ui/skeleton";
import { useVideoDurationStore } from "@/stores/videoDurationStore";

// A recording pulled in from a live class uses the same 80% "watched"
// threshold as the attendance-based content grant; every other (teacher-
// uploaded) video uses 90% (mirrors mobile's RecordedVideo.tsx).
function completionThreshold(video: ModuleVideo): number {
  return video.liveClassId ? 0.8 : 0.9;
}

export function ChapterVideoTab({
  courseId,
  subjectName,
  moduleNumber,
  courseSubjectId,
  video,
  videoIndex = 0,
  alreadyCompleted,
}: {
  courseId: string;
  subjectName: string;
  moduleNumber: number;
  courseSubjectId: string;
  video: ModuleVideo;
  videoIndex?: number;
  alreadyCompleted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasMarkedRef = useRef(alreadyCompleted);
  const setDuration = useVideoDurationStore((s) => s.setDuration);

  const { data, isPending, error } = useQuery({
    queryKey: ["video-signed-url", courseId, subjectName, moduleNumber, videoIndex],
    queryFn: async () => {
      const res = await getVideoSignedUrl(courseId, subjectName, moduleNumber, courseSubjectId, videoIndex);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const markComplete = useMutation({
    mutationFn: () =>
      updateModuleProgress(courseId, moduleNumber, courseSubjectId, { videoCompleted: true }),
  });

  const [watchedRatio, setWatchedRatio] = useState(0);

  useEffect(() => {
    hasMarkedRef.current = alreadyCompleted;
  }, [alreadyCompleted]);

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration || hasMarkedRef.current) return;
    const ratio = el.currentTime / el.duration;
    setWatchedRatio(ratio);
    if (ratio >= completionThreshold(video)) {
      hasMarkedRef.current = true;
      markComplete.mutate();
    }
  };

  // The lecture list's stored `duration` string is unreliable (see
  // formatDuration.ts) — once the actual media loads, its real duration is
  // authoritative. Cached (not just used locally) so the list shows the
  // corrected value on future visits too, mirroring mobile's own
  // real-metadata-over-stored-string behavior.
  const handleLoadedMetadata = () => {
    const el = videoRef.current;
    if (el && Number.isFinite(el.duration) && el.duration > 0) {
      setDuration(video.url, el.duration);
    }
  };

  if (isPending) {
    return <Skeleton className="aspect-video w-full rounded-md" />;
  }

  if (error || !data) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border">
        <PlayCircle className="size-10 text-muted-foreground" />
        <p className="text-body-sm text-muted-foreground">Couldn&apos;t load this video.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* View-only hardening (docs/DESIGN-STANDARDS.md §12 fix-pass) — a
          best-effort deterrent, not real DRM: the signed URL is still a
          real, fetchable network response visible in devtools regardless
          of any of this. controlsList/disablePictureInPicture remove the
          browser's own built-in "download"/PiP affordances from the native
          player chrome, and onContextMenu removes the one-right-click "Save
          video as" shortcut — neither stops a determined extraction. */}
      <video
        ref={videoRef}
        src={data.signedUrl}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        className="aspect-video w-full rounded-md bg-neutral-950"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      <div className="flex items-center justify-between text-caption text-muted-foreground">
        <span>{data.title}</span>
        {(hasMarkedRef.current || watchedRatio >= completionThreshold(video)) && (
          <span className="font-medium text-success-500">Completed</span>
        )}
      </div>
    </div>
  );
}
