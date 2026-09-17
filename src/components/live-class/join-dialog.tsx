"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import type { LiveClass } from "@/types/live-class";

// Web equivalent of mobile's LiveClassJoinBottomSheet.tsx — same copy/flow
// (title + teacher/subject, Join Now / Maybe Later), adapted to a centered
// dialog instead of a bottom sheet, which has no clear web analogue.
export function JoinLiveClassDialog({
  liveClass,
  open,
  onOpenChange,
}: {
  liveClass: LiveClass | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  if (!liveClass) return null;

  const handleJoin = () => {
    onOpenChange(false);
    router.push(`/learn/live-class/${liveClass.roomId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          {liveClass.status === "ongoing" && (
            <StatusBadge tone="live" className="mb-2">
              LIVE
            </StatusBadge>
          )}
          <DialogTitle>{liveClass.title}</DialogTitle>
          <p className="text-body-sm text-muted-foreground">
            {liveClass.teacher} &middot; {liveClass.subject}
          </p>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="flex-1">
            Maybe later
          </Button>
          <Button onClick={handleJoin} className="flex-1 bg-danger-500 hover:bg-danger-500/90">
            Join now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
