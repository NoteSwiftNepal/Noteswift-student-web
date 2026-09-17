"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { getContentSignedUrl } from "@/api/student/learn";
import { needsSignedUrl } from "@/lib/contentUrl";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ContentViewerDialog } from "./content-viewer-dialog";
import { cn } from "@/lib/utils";

interface DocumentItem {
  url: string;
  title?: string;
}

// Shared engine behind ChapterNotesTab/ChapterDppTab/ChapterSolutionsTab.
//
// Every item's OWN `url` field (already present in the module data — see
// ModuleNote/ModuleDpp/ModuleSolution) is used directly whenever it's
// already a usable, fully-qualified URL — exactly matching mobile's
// openPdf, which only falls back to the backend's signing endpoint when the
// stored URL itself needs it (needsSignedUrl, src/lib/contentUrl.ts). That
// endpoint (getContentSignedUrl) can only ever sign the FIRST entry of a
// content type — no index parameter exists (confirmed directly against
// courseContentController.ts; see MOBILE_APP_CODE_ISSUES.md) — so the
// fallback is only ever attempted for index 0. Previously this component
// blocked every entry past index 0 behind that limitation even when its own
// URL needed no signing at all; now only the genuinely-unfixable
// combination (needs signing AND not the first entry) stays "Unavailable."
export function DocumentViewerList({
  courseId,
  subjectName,
  moduleNumber,
  courseSubjectId,
  contentType,
  items,
  icon: Icon,
  emptyTitle,
  fallbackTitle,
}: {
  courseId: string;
  subjectName: string;
  moduleNumber: number;
  courseSubjectId: string;
  contentType: "notes" | "dpp" | "solution";
  items: DocumentItem[];
  icon: LucideIcon;
  emptyTitle: string;
  fallbackTitle: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selected = selectedIndex !== null ? items[selectedIndex] : undefined;
  const selectedNeedsSigning = !!selected && needsSignedUrl(selected.url);

  // Only ever actually called for a signing-needed index-0 item (the
  // openable gate below never lets a signing-needed non-zero item set
  // selectedIndex in the first place) — a direct-URL item never triggers a
  // network call at all, it opens instantly.
  const { data, isFetching, error } = useQuery({
    queryKey: ["content-signed-url", courseId, subjectName, moduleNumber, contentType],
    queryFn: async () => {
      const res = await getContentSignedUrl(courseId, subjectName, moduleNumber, contentType, courseSubjectId);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: selectedNeedsSigning,
  });

  if (items.length === 0) {
    return <EmptyState icon={Icon} title={emptyTitle} />;
  }

  const resolvedUrl = selected ? (selectedNeedsSigning ? data?.signedUrl : selected.url) : undefined;
  const selectedTitle = (selected?.title) || fallbackTitle;

  return (
    <>
      <div className="space-y-3">
        {items.map((item, index) => {
          // The one genuinely unfixable case: this specific item's own URL
          // needs signing, but it isn't index 0, so the signing endpoint
          // would silently hand back a DIFFERENT item's file — same real
          // backend limitation mobile has, not solved here either.
          const openable = !needsSignedUrl(item.url) || index === 0;
          return (
            <Card
              key={item.url}
              onClick={openable ? () => setSelectedIndex(index) : undefined}
              className={cn(
                "transition-[transform,box-shadow] duration-fast ease-standard",
                openable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-2" : "cursor-not-allowed opacity-60"
              )}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <p className="min-w-0 flex-1 truncate text-title text-foreground">{item.title || fallbackTitle}</p>
                {!openable && <span className="shrink-0 text-caption text-muted-foreground">Unavailable</span>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ContentViewerDialog
        open={selectedIndex !== null}
        onOpenChange={(open) => !open && setSelectedIndex(null)}
        title={selectedTitle}
        url={resolvedUrl}
        isLoading={selectedNeedsSigning && isFetching}
        error={selectedNeedsSigning && !!error}
      />
    </>
  );
}
