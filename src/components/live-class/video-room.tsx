"use client";

import "@livekit/components-styles";
import { useEffect, useRef, useState } from "react";
import { Track } from "livekit-client";
import { LiveKitRoom, ParticipantTile, RoomAudioRenderer, useTracks } from "@livekit/components-react";
import { Maximize, Minimize, Video as VideoIcon } from "lucide-react";
import { RoomControls } from "./room-controls";
import { ReactionsOverlay } from "./reactions-overlay";
import { Button } from "@/components/ui/button";

// Students are always issued canPublish: false server-side
// (livekitService.ts's generateToken) and VideoRoom below never requests
// audio/video capture on connect, so the local participant never actually
// publishes a Camera track. But useTracks's withPlaceholder option still
// synthesizes a placeholder TrackReference for ANY participant — local
// included — that hasn't published a source marked withPlaceholder: true
// (confirmed against @livekit/components-react's internal placeholder
// logic, not assumed). Left unfiltered, that placeholder for the student's
// own never-published camera was exactly the "pointless second tile" bug.
// Filtering out the local participant is what actually fixes it — removing
// the auto-publish props alone is not enough.
function RoomLayout({
  handRaised,
  onToggleHand,
  onLeave,
}: {
  handRaised: boolean;
  onToggleHand: () => void;
  onLeave: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  ).filter((t) => !t.participant.isLocal);

  // Screen share takes priority over the camera tile when the teacher is
  // presenting — same precedence the previous GridLayout gave it implicitly
  // via sort order.
  const teacherTrack =
    tracks.find((t) => t.source === Track.Source.ScreenShare) ??
    tracks.find((t) => t.source === Track.Source.Camera);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-zinc-950">
      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-zinc-950">
        {teacherTrack ? (
          <ParticipantTile trackRef={teacherTrack} className="h-full" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-500">
            <VideoIcon className="size-10" />
            <p className="text-sm">Waiting for teacher&apos;s video...</p>
          </div>
        )}
        <ReactionsOverlay />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute right-3 top-3 z-20 rounded-full shadow-lg"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
        </Button>
      </div>
      <RoomAudioRenderer />
      <RoomControls handRaised={handRaised} onToggleHand={onToggleHand} onLeave={onLeave} />
    </div>
  );
}

// The video surface is a deliberate dark exception to the app's light theme
// (blueprint §6) — mobile does the same for the same reason: video tiles
// need contrast, and it's scoped to just this component, not the
// surrounding page chrome (see the room page, which keeps its own light
// header/sidebar).
export function VideoRoom({
  serverUrl,
  token,
  handRaised,
  onToggleHand,
  onLeave,
  onDisconnected,
  onError,
}: {
  serverUrl: string;
  token: string;
  handRaised: boolean;
  onToggleHand: () => void;
  onLeave: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}) {
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      audio={false}
      video={false}
      onDisconnected={onDisconnected}
      onError={onError}
      className="h-full"
    >
      <RoomLayout handRaised={handRaised} onToggleHand={onToggleHand} onLeave={onLeave} />
    </LiveKitRoom>
  );
}
