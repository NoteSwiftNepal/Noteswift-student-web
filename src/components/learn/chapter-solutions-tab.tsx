"use client";

import { CheckCircle2 } from "lucide-react";
import { DocumentViewerList } from "./document-viewer-list";
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
  return (
    <DocumentViewerList
      courseId={courseId}
      subjectName={subjectName}
      moduleNumber={moduleNumber}
      courseSubjectId={courseSubjectId}
      contentType="solution"
      items={solutions}
      icon={CheckCircle2}
      emptyTitle="No solutions available for this module"
      fallbackTitle="Solution"
    />
  );
}
