"use client";

import { FileWarning } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// Shared in-app PDF viewer for Notes/DPP/Solutions (docs/DESIGN-STANDARDS.md
// §12 fix-pass, view-only hardening). The signed URL is only ever handed to
// this iframe, never to a real <a href>/window.open target — that would put
// the file's actual URL in a *new browser tab's own address bar*, which is
// one Ctrl+L/right-click "copy link address" away from being lifted out
// with zero effort. This is a best-effort deterrent, not real DRM: the
// underlying request/response is still fully visible to anyone who opens
// devtools' Network tab, and nothing here can change that.
export function ContentViewerDialog({
  open,
  onOpenChange,
  title,
  url,
  isLoading,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string | undefined;
  isLoading?: boolean;
  error?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] w-full max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-3 text-left">
          <DialogTitle className="truncate text-title">{title}</DialogTitle>
        </DialogHeader>
        {/* onContextMenu here only stops the right-click menu on the page
            around the PDF — it can't reach inside the iframe's own
            document, so the browser's built-in PDF viewer (including its
            own toolbar/download button) is still reachable from within the
            frame itself. Disclosed, not solvable from the parent page. */}
        <div className="min-h-0 flex-1 bg-secondary p-4" onContextMenu={(e) => e.preventDefault()}>
          {error || (!isLoading && !url) ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <FileWarning className="size-8 text-muted-foreground" />
              <p className="text-body-sm text-muted-foreground">Couldn&apos;t load this file.</p>
            </div>
          ) : !url ? (
            <Skeleton className="h-full w-full rounded-md" />
          ) : (
            // #toolbar=0 is a Chrome PDF-plugin convention that hides its
            // toolbar — applied best-effort since it costs nothing when
            // ignored, not depended on (Firefox's built-in viewer doesn't
            // honor it, and this hasn't been independently confirmed in a
            // live browser here — verify visually).
            <iframe
              src={`${url}#toolbar=0`}
              title={title}
              className="h-full w-full rounded-md border border-border bg-background"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
