"use client";

import { useCallback, useState } from "react";
import { useDataChannel } from "@livekit/components-react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

// Reactions travel over LiveKit's own data channel (room.localParticipant's
// publishData / RoomEvent.DataReceived), NOT socket.io — confirmed against
// mobile's Reactions.tsx, which uses this exact transport. Chat and raised
// hands are the socket.io side of this feature; reactions are LiveKit's.
const REACTIONS = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "🤔", label: "Think" },
];

interface Bubble {
  id: number;
  emoji: string;
  left: number;
}

export function ReactionsOverlay() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const nextId = useCallback(() => Math.floor(Math.random() * 1e9), []);

  const showBubble = (emoji: string) => {
    const id = nextId();
    setBubbles((prev) => [...prev, { id, emoji, left: 10 + Math.random() * 70 }]);
    setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 3000);
  };

  const { send } = useDataChannel((msg) => {
    try {
      const text = new TextDecoder().decode(msg.payload);
      const decoded = JSON.parse(text);
      if (decoded?.type === "reaction" && typeof decoded.emoji === "string") {
        showBubble(decoded.emoji);
      }
    } catch {
      // Ignore malformed data-channel payloads.
    }
  });

  const sendReaction = (emoji: string) => {
    const payload = new TextEncoder().encode(JSON.stringify({ type: "reaction", emoji, timestamp: Date.now() }));
    send(payload, { reliable: true });
    showBubble(emoji);
    setPickerOpen(false);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {bubbles.map((bubble) => (
        <span
          key={bubble.id}
          className="animate-reaction-float absolute bottom-24 text-4xl"
          style={{ left: `${bubble.left}%` }}
        >
          {bubble.emoji}
        </span>
      ))}

      <div className="pointer-events-auto absolute bottom-4 right-4">
        {pickerOpen && (
          <div className="mb-2 flex items-center gap-1.5 rounded-full bg-zinc-900/90 p-2 shadow-lg">
            {REACTIONS.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => sendReaction(r.emoji)}
                aria-label={r.label}
                className="flex size-9 items-center justify-center rounded-full text-xl transition-colors hover:bg-white/10"
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="rounded-full shadow-lg"
          onClick={() => setPickerOpen((v) => !v)}
        >
          <Smile className="size-5" />
        </Button>
      </div>
    </div>
  );
}
