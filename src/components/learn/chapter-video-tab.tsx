"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PlayCircle } from "lucide-react";
import { getVideoSignedUrl } from "@/api/student/learn";
import { updateModuleProgress } from "@/api/lessonProgress";
import type { ModuleVideo } from "@/types/subject-content";
import { Skeleton } from "@/components/ui/skeleton";

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

  if (isPending) {
    return <Skeleton className="aspect-video w-full rounded-xl" />;
  }

  if (error || !data) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border">
        <PlayCircle className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Couldn&apos;t load this video.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <video
        ref={videoRef}
        src={data.signedUrl}
        controls
        className="aspect-video w-full rounded-xl bg-black"
        onTimeUpdate={handleTimeUpdate}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{data.title}</span>
        {(hasMarkedRef.current || watchedRatio >= completionThreshold(video)) && (
          <span className="font-medium text-green-700">Completed</span>
        )}
      </div>
    </div>
  );
}
