"use client";

import { useState } from "react";
import { CloudDownload, FileText, Trash2, Video } from "lucide-react";
import { useDownloads } from "@/hooks/queries/useDownloads";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { InlineError } from "@/components/inline-error";
import type { DownloadFileType, DownloadRecord } from "@/types/download";

type Tab = "all" | "video" | "document";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "video", label: "Videos" },
  { key: "document", label: "Documents" },
];

function isVideo(fileType: DownloadFileType) {
  return fileType === "video";
}

// Shared between the standalone /downloads route (still linked from the
// sidebar's More menu) and the "Saved" tab on /learn (mirrors mobile's
// "Saved Notes" tab — docs/DESIGN-STANDARDS.md §12 fix-pass) — one
// component, two entry points, not a copy-pasted fork.
//
// Web has no local encrypted file store the way mobile does (no equivalent
// to react-native's filesystem + on-device encryption) — "Downloads"/
// "Saved" here is a server-side log of files the student opened via a
// download link, per this phase's brief. Opening a record re-opens its
// original source URL rather than decrypting a local copy.
export function DownloadsList() {
  const { downloads, downloadsLoading, error, refetch, removeDownload } = useDownloads();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [pendingDelete, setPendingDelete] = useState<DownloadRecord | null>(null);

  const filtered =
    activeTab === "all"
      ? downloads
      : downloads.filter((d) => (activeTab === "video" ? isVideo(d.fileType) : !isVideo(d.fileType)));

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {TABS.map((tab) => {
          const count =
            tab.key === "all" ? downloads.length : downloads.filter((d) => (tab.key === "video" ? isVideo(d.fileType) : !isVideo(d.fileType))).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-body-sm font-semibold transition-colors duration-fast ease-standard",
                activeTab === tab.key ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:bg-secondary/60"
              )}
            >
              {tab.label}
              {count > 0 && <span className="text-caption opacity-80">({count})</span>}
            </button>
          );
        })}
      </div>

      {downloadsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load your downloads." onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CloudDownload}
          title="No downloads yet"
          description="Files you download from your lessons will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((dl) => (
            <div key={dl._id} className="flex items-center gap-3.5 rounded-md border border-border bg-card p-4 shadow-1">
              <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-sm", isVideo(dl.fileType) ? "bg-danger-100 text-danger-700" : "bg-primary/10 text-primary")}>
                {isVideo(dl.fileType) ? <Video className="size-5" /> : <FileText className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-title text-foreground">{dl.fileName}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-caption text-muted-foreground">
                  {dl.subject && <span>{dl.subject}</span>}
                  <span>{new Date(dl.downloadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                {dl.chapter && <p className="mt-0.5 truncate text-caption text-muted-foreground">Chapter: {dl.chapter}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {dl.fileUri && (
                  <Button asChild size="sm">
                    <a href={dl.fileUri} target="_blank" rel="noreferrer">
                      {isVideo(dl.fileType) ? "Play" : "View"}
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="icon" className="text-destructive" onClick={() => setPendingDelete(dl)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Download</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{pendingDelete?.fileName}&quot; from your downloads?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) removeDownload.mutate(pendingDelete._id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
