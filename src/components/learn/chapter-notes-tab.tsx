"use client";

import { FileText } from "lucide-react";
import { DocumentViewerList } from "./document-viewer-list";
import type { ModuleNote } from "@/types/subject-content";

export function ChapterNotesTab({
  courseId,
  subjectName,
  moduleNumber,
  courseSubjectId,
  notes,
}: {
  courseId: string;
  subjectName: string;
  moduleNumber: number;
  courseSubjectId: string;
  notes: ModuleNote[];
}) {
  return (
    <DocumentViewerList
      courseId={courseId}
      subjectName={subjectName}
      moduleNumber={moduleNumber}
      courseSubjectId={courseSubjectId}
      contentType="notes"
      items={notes}
      icon={FileText}
      emptyTitle="No notes available for this chapter"
      fallbackTitle="Notes"
    />
  );
}
