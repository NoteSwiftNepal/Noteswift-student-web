"use client";

import { ClipboardList } from "lucide-react";
import { DocumentViewerList } from "./document-viewer-list";
import type { ModuleDpp } from "@/types/subject-content";

// Own tab now — Solutions is a separate tab (chapter-solutions-tab.tsx),
// not nested inside this one. Mobile's modules/[moduleId].tsx renders them
// as two independent tab panes ("DPPs" and "Solutions"); the earlier Phase 3
// implementation combined them into one "dpp" tab, which this splits apart.
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
  return (
    <DocumentViewerList
      courseId={courseId}
      subjectName={subjectName}
      moduleNumber={moduleNumber}
      courseSubjectId={courseSubjectId}
      contentType="dpp"
      items={dpps}
      icon={ClipboardList}
      emptyTitle="No DPP available for this module"
      fallbackTitle="DPP"
    />
  );
}
