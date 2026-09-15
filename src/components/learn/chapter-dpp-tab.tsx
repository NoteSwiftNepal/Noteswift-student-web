"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, ExternalLink } from "lucide-react";
import { getContentSignedUrl } from "@/api/student/learn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ModuleDpp } from "@/types/subject-content";

// Own tab now — Solutions is a separate tab (chapter-solutions-tab.tsx),
// not nested inside this one. Mobile's modules/[moduleId].tsx renders them
// as two independent tab panes ("DPPs" and "Solutions"); the earlier Phase 3
// implementation combined them into one "dpp" tab, which this splits apart.
function SignedLinkButton({
  courseId,
  subjectName,
  moduleNumber,
  courseSubjectId,
  label,
  disabled,
}: {
  courseId: string;
  subjectName: string;
  moduleNumber: number;
  courseSubjectId: string;
  label: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["content-signed-url", courseId, subjectName, moduleNumber, "dpp"],
    queryFn: async () => {
      const res = await getContentSignedUrl(courseId, subjectName, moduleNumber, "dpp", courseSubjectId);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: false,
  });

  const handleClick = async () => {
    if (data) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setOpen(true);
    const result = await refetch();
    if (result.data) {
      window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
    }
    setOpen(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={disabled || isFetching || open}>
      <ExternalLink className="size-3.5" />
      {isFetching || open ? "Opening..." : label}
    </Button>
  );
}

export function ChapterDppTab({
  courseId,
  subjectName,
  moduleNumber,
  courseSubjectId,
  dpps,
}: {
  courseId: string;
  subjectName: string;
  moduleNumber: number;
  courseSubjectId: string;
  dpps: ModuleDpp[];
}) {
  if (dpps.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border">
        <ClipboardList className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No DPP available for this module.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dpps.map((dpp, index) => (
        <Card key={dpp.url}>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <ClipboardList className="size-5 shrink-0 text-primary" />
              <p className="truncate text-sm font-medium text-foreground">{dpp.title}</p>
            </div>
            {/* The backend only ever signs the first DPP's URL (see
                api/student/learn.ts) — additional entries have no way to
                open today. */}
            <SignedLinkButton
              courseId={courseId}
              subjectName={subjectName}
              moduleNumber={moduleNumber}
              courseSubjectId={courseSubjectId}
              label="Open DPP"
              disabled={index > 0}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
