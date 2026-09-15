"use client";

import { useState } from "react";
import { Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { Button } from "@/components/ui/button";
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
import type { BookmarkedFile } from "@/stores/bookmarkStore";

export default function BookmarksPage() {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const [pendingDelete, setPendingDelete] = useState<BookmarkedFile | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bookmarks</h1>
        <p className="text-sm text-muted-foreground">PDFs and notes you&apos;ve saved for quick access, saved on this device.</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Bookmark className="mb-3 size-10 text-muted-foreground" />
          <p className="text-base font-medium text-foreground">No bookmarks yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Bookmark notes and DPPs while learning to find them here later.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((b) => (
            <div key={b.id} className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bookmark className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{b.fileName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[b.subjectName, b.courseName].filter(Boolean).join(" • ") || new Date(b.bookmarkedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button asChild size="icon" variant="outline">
                  <a href={b.fileUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" className="text-destructive" onClick={() => setPendingDelete(b)}>
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
            <AlertDialogTitle>Remove Bookmark</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &quot;{pendingDelete?.fileName}&quot; from your bookmarks?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) removeBookmark(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
