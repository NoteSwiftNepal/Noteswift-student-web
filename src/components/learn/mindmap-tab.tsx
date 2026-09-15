"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, ExternalLink } from "lucide-react";
import { getSubjectMindmap } from "@/api/lessonProgress";
import { Skeleton } from "@/components/ui/skeleton";
import type { MindmapNode } from "@/types/mindmap";

// The backend stores a mindmap as a flat list of {id, parentId, title, ...}
// nodes with NO layout/position data at all (Mindmap.model.ts) — mobile's
// SubjectMindmapViewer computes its own radial/tree canvas layout from that
// flat list for a pan-zoom canvas. Reproducing a pan-zoom node canvas is a
// lot of surface for what the data actually is: a plain tree. A collapsible
// nested list renders the exact same information — parent/child structure,
// title, type, optional link — without inventing canvas positions the
// backend never provides, and is more legible on web (readable, no drag/
// zoom needed) than trying to clone mobile's canvas. Deliberate scope
// reduction, not a missing feature: noted in the phase report.
function buildTree(nodes: MindmapNode[]): Map<string | null, MindmapNode[]> {
  const byParent = new Map<string | null, MindmapNode[]>();
  for (const node of nodes) {
    const list = byParent.get(node.parentId) ?? [];
    list.push(node);
    byParent.set(node.parentId, list);
  }
  return byParent;
}

function NodeBranch({ node, byParent, depth }: { node: MindmapNode; byParent: Map<string | null, MindmapNode[]>; depth: number }) {
  const children = byParent.get(node.id) ?? [];

  return (
    <li>
      <div className="flex items-center gap-2 py-1.5">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: node.color || "#3B82F6" }}
        />
        {node.link ? (
          <a
            href={node.link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {node.title}
            <ExternalLink className="size-3" />
          </a>
        ) : (
          <span className={depth === 0 ? "text-sm font-bold text-foreground" : "text-sm text-foreground"}>
            {node.title}
          </span>
        )}
        {node.type && node.type !== "Topic" && (
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{node.type}</span>
        )}
      </div>
      {children.length > 0 && (
        <ul className="ml-4 space-y-0.5 border-l border-border pl-4">
          {children.map((child) => (
            <NodeBranch key={child.id} node={child} byParent={byParent} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function MindmapTab({
  courseId,
  subjectName,
  moduleNumber,
}: {
  courseId: string;
  subjectName: string;
  moduleNumber?: number;
}) {
  const { data, isPending } = useQuery({
    queryKey: ["mindmap", courseId, subjectName, moduleNumber ?? null],
    queryFn: async () => {
      const res = await getSubjectMindmap(courseId, subjectName, moduleNumber);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const byParent = useMemo(() => buildTree(data?.nodes ?? []), [data]);
  const roots = byParent.get(null) ?? [];

  if (isPending) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-2/5" />
      </div>
    );
  }

  if (!data || roots.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
        <GitBranch className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No mind map available for this {moduleNumber ? "module" : "subject"} yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {data.title && <p className="mb-3 text-sm font-bold text-foreground">{data.title}</p>}
      <ul className="space-y-0.5">
        {roots.map((node) => (
          <NodeBranch key={node.id} node={node} byParent={byParent} depth={0} />
        ))}
      </ul>
    </div>
  );
}
