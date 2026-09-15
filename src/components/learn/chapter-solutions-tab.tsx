"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { getContentSignedUrl } from "@/api/student/learn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ModuleSolution } from "@/types/subject-content";

export function ChapterSolutionsTab({
  courseId,
  subjectName,
  moduleNumber,
  courseSubjectId,
  solutions,
}: {
  courseId: string;
  subjectName: string;
  moduleNumber: number;
  courseSubjectId: string;
  solutions: ModuleSolution[];
}) {
  const [open, setOpen] = useState(false);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["content-signed-url", courseId, subjectName, moduleNumber, "solution"],
    queryFn: async () => {
      const res = await getContentSignedUrl(courseId, subjectName, moduleNumber, "solution", courseSubjectId);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: false,
  });

  if (solutions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border">
        <CheckCircle2 className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No solutions available for this module.</p>
      </div>
    );
  }

  const handleClick = async () => {
    if (data) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setOpen(true);
    const result = await refetch();
    if (result.data) window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <CheckCircle2 className="size-5 shrink-0 text-green-600" />
          <p className="truncate text-sm font-medium text-foreground">{solutions[0].title || "Solution"}</p>
        </div>
        {/* Only the first solution is ever signable — same backend
            limitation as DPP/notes (getContentSignedUrl always signs
            index 0). */}
        <Button variant="outline" size="sm" onClick={handleClick} disabled={isFetching || open}>
          <ExternalLink className="size-3.5" />
          {isFetching || open ? "Opening..." : "Open Solution"}
        </Button>
      </CardContent>
    </Card>
  );
}
