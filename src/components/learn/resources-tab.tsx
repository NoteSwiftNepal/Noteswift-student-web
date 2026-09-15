"use client";

import { useQuery } from "@tanstack/react-query";
import { FileQuestion, Video, FileText, ExternalLink } from "lucide-react";
import { getCourseResources, type CourseResource, type ResourceType } from "@/api/student/resources";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";

const TYPE_LABELS: Record<ResourceType, string> = {
  video: "Video",
  syllabus: "Syllabus / Curriculum",
  "test-appendix": "Test Appendix",
  "model-question": "Model Question",
  "past-year-question": "Past Year Questions",
  "mind-map": "Mind Map",
  other: "Other",
};

function resourceIcon(resource: CourseResource) {
  if (resource.type === "video" || resource.mimeType?.startsWith("video/")) return Video;
  return FileText;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourcesTab({ courseId }: { courseId: string }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["course-resources", courseId],
    queryFn: async () => {
      const res = await getCourseResources(courseId);
      if (!res.success) throw new Error(res.message);
      return res.data.resources;
    },
    enabled: !!courseId,
  });

  if (isPending) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <InlineError message="Couldn't load resources." onRetry={() => refetch()} />;
  }

  const resources = data ?? [];

  if (resources.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
        <FileQuestion className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No resources available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Study materials shared by your teacher — syllabus, model questions, past papers, mind maps, and more.
      </p>
      <div className="space-y-2">
        {resources.map((resource) => {
          const Icon = resourceIcon(resource);
          return (
            <a
              key={resource._id}
              href={resource.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-shadow hover:shadow-md"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{resource.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {TYPE_LABELS[resource.type] ?? "Other"}
                  {resource.moduleName ? ` · ${resource.moduleName}` : ""}
                  {resource.fileSize ? ` · ${formatFileSize(resource.fileSize)}` : ""}
                </p>
              </div>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
