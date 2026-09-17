"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";
import { getModuleComments, postModuleComment } from "@/api/student/learn";
import type { ListModuleCommentsResult } from "@/types/module-comment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineError } from "@/components/inline-error";

// A real, currently-missing-on-web feature (mobile's ChapterDetailCard.tsx)
// — a plain per-video comment thread, GET/POST
// .../module/:moduleNumber/comments?videoId=... Scoped by the video
// subdocument's own _id (ModuleVideo._id), not the array index — matches
// Comment.model.ts's videoId doc comment. No replies/likes-on-comments:
// mobile doesn't have those either, a simple flat list is the real feature.
export function ModuleComments({
  courseId,
  subjectName,
  moduleNumber,
  courseSubjectId,
  videoId,
}: {
  courseId: string;
  subjectName: string;
  moduleNumber: number;
  courseSubjectId: string;
  videoId: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["module-comments", courseId, subjectName, moduleNumber, videoId];

  const { data, isPending, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getModuleComments(courseId, subjectName, moduleNumber, videoId, courseSubjectId);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      const res = await postModuleComment(courseId, subjectName, moduleNumber, videoId, courseSubjectId, text);
      if (res.success) {
        setDraft("");
        queryClient.setQueryData<ListModuleCommentsResult>(queryKey, (prev) =>
          prev ? { ...prev, comments: [...prev.comments, res.data.comment] } : prev
        );
      }
    } finally {
      setPosting(false);
    }
  };

  const comments = data?.comments ?? [];

  return (
    <section className="space-y-4">
      <h2 className="text-h2 text-foreground">
        Comments
        {comments.length > 0 && (
          <span className="ml-2 text-body-sm font-normal text-muted-foreground">{comments.length}</span>
        )}
      </h2>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment..."
          disabled={posting}
          maxLength={1000}
        />
        <Button type="submit" size="icon" disabled={!draft.trim() || posting} aria-label="Post comment">
          <Send className="size-4" />
        </Button>
      </form>

      {isPending ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load comments." />
      ) : comments.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No comments yet" description="Be the first to say something." />
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c._id} className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-caption font-semibold text-secondary-foreground">
                {c.authorName.trim().charAt(0).toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-body-sm font-semibold text-foreground">{c.authorName}</p>
                  {c.authorRole === "Teacher" && <StatusBadge tone="neutral">Teacher</StatusBadge>}
                  <p className="text-caption text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </p>
                </div>
                <p className="mt-0.5 text-body-sm text-foreground">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
