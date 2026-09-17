"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleModuleLike } from "@/api/student/learn";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Module-level like (POST .../module/:moduleNumber/like) — one like per
// student per module, matching mobile's own granularity (not per-video).
// Optimistic toggle, reconciled against the real response; reverted on
// failure — mirrors ChapterDetailCard.tsx's handleToggleLike exactly.
export function ModuleLikeButton({
  courseId,
  subjectName,
  moduleNumber,
  courseSubjectId,
  initialLiked,
  initialCount,
}: {
  courseId: string;
  subjectName: string;
  moduleNumber: number;
  courseSubjectId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    setPending(true);
    try {
      const res = await toggleModuleLike(courseId, subjectName, moduleNumber, courseSubjectId);
      if (res.success) {
        setLiked(res.data.liked);
        setCount(res.data.likes);
      } else {
        setLiked(!nextLiked);
        setCount((c) => c - (nextLiked ? 1 : -1));
      }
    } catch {
      setLiked(!nextLiked);
      setCount((c) => c - (nextLiked ? 1 : -1));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className={cn(liked && "border-primary text-primary")}
    >
      <Heart className={cn("size-4", liked && "fill-current")} />
      {count > 0 ? count : "Like"}
    </Button>
  );
}
