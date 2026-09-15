"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, ExternalLink } from "lucide-react";
import { getContentSignedUrl } from "@/api/student/learn";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Browser-native PDF viewing (iframe), no offline download step — blueprint
// §4. Only the first notes file is ever signable by the backend today (see
// api/student/learn.ts's getContentSignedUrl comment), so a module with more
// than one notes upload can only preview the first.
export function ChapterNotesTab({
  courseId,
  subjectName,
  moduleNumber,
  courseSubjectId,
}: {
  courseId: string;
  subjectName: string;
  moduleNumber: number;
  courseSubjectId: string;
}) {
  const { data, isPending, error } = useQuery({
    queryKey: ["content-signed-url", courseId, subjectName, moduleNumber, "notes"],
    queryFn: async () => {
      const res = await getContentSignedUrl(courseId, subjectName, moduleNumber, "notes", courseSubjectId);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  if (isPending) {
    return <Skeleton className="h-[70vh] w-full rounded-xl" />;
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border">
        <FileText className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No notes available for this chapter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{data.title || "Notes"}</p>
        <Button variant="outline" size="sm" asChild>
          <a href={data.signedUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            Open in new tab
          </a>
        </Button>
      </div>
      <iframe
        src={data.signedUrl}
        title={data.title || "Notes"}
        className="h-[70vh] w-full rounded-xl border border-border"
      />
    </div>
  );
}
