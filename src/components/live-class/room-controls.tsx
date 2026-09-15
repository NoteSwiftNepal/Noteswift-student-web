"use client";

import { useRoomContext } from "@livekit/components-react";
import { Hand, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RoomControls({
  handRaised,
  onToggleHand,
  onLeave,
}: {
  handRaised: boolean;
  onToggleHand: () => void;
  onLeave: () => void;
}) {
  const room = useRoomContext();

  // Explicit disconnect rather than relying solely on LiveKitRoom's own
  // unmount cleanup — the click handler triggers navigation (onLeave), and
  // an explicit room.disconnect() here means the LiveKit connection is torn
  // down the instant the student clicks Leave, not whenever React gets
  // around to unmounting the room tree during that navigation.
  const handleLeave = () => {
    room.disconnect();
    onLeave();
  };

  return (
    <div className="flex items-center justify-center gap-3 border-t border-zinc-800 bg-zinc-900 p-3">
      <button
        type="button"
        onClick={onToggleHand}
        aria-pressed={handRaised}
        className={cn(
          "flex size-11 items-center justify-center rounded-full text-white transition-colors",
          handRaised ? "bg-primary hover:bg-primary/90" : "bg-zinc-700 hover:bg-zinc-600"
        )}
      >
        <Hand className="size-5" />
      </button>
      <Button
        type="button"
        size="icon"
        className="size-11 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={handleLeave}
        aria-label="Leave class"
      >
        <PhoneOff className="size-5" />
      </Button>
    </div>
  );
}
