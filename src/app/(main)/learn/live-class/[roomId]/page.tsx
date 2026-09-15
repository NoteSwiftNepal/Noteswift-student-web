"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { getLiveClassToken, leaveLiveClass } from "@/api/student/learn";
import { useAuthStore } from "@/stores/authStore";
import { useLiveClassSocket } from "@/hooks/useLiveClassSocket";
import { VideoRoom } from "@/components/live-class/video-room";
import { ChatPanel } from "@/components/live-class/chat-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://livekit.noteswift.com.np";

export default function LiveClassRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  // Closed by default on mobile — the panel renders as a full overlay sheet
  // there (see below), not a squeezed flex-row sibling of the video, so
  // starting it open would cover the whole screen on first load. At ≥lg it
  // always renders as a static column regardless of this flag.
  const [chatOpen, setChatOpen] = useState(false);
  const [ended, setEnded] = useState(false);

  const { data: tokenResult, isPending, error } = useQuery({
    queryKey: ["live-class-token", roomId],
    queryFn: async () => {
      const res = await getLiveClassToken(roomId);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    // A LiveKit token is single-use-ish (ties to a join event/attendance
    // record) — never silently refetched in the background.
    staleTime: Infinity,
    retry: false,
  });

  // chatHandler.ts's join-classroom resolves the room via
  // `LiveClass.findOne({ meetingId: classroomId })` — an EXACT match on
  // meetingId only, no _id fallback (unlike the REST token/leave endpoints,
  // which both accept either). The raw [roomId] route param is whatever the
  // live-class list linked with, which is not guaranteed to be the
  // meetingId — the token response's own `roomId` field is
  // (`liveClass.meetingId || roomId`, per learn.controller.ts), so that's
  // the value the socket has to join with, not the route param. Undefined
  // until the token query resolves; useLiveClassSocket's own effect already
  // no-ops until classroomId is truthy, so the socket simply doesn't
  // connect until then, no separate loading gate needed here.
  const {
    connectionState,
    messages,
    raisedHands,
    typingUserIds,
    handRaised,
    classEnded,
    sendMessage,
    editMessage,
    deleteMessage,
    notifyTyping,
    raiseHand,
    lowerHand,
  } = useLiveClassSocket(tokenResult?.roomId, accessToken, user?.id);

  // Completes the attendance record the token endpoint started, on any
  // unmount (in-app navigation away) — browser tab close severs the
  // LiveKit/socket connections on its own; this REST call is the one piece
  // that needs an explicit trigger to survive a route change.
  useEffect(() => {
    return () => {
      leaveLiveClass(roomId).catch(() => {
        // Best-effort — a missed call just leaves leftAt/duration unset
        // server-side (matches mobile's same tradeoff).
      });
    };
  }, [roomId]);

  useEffect(() => {
    if (classEnded) setEnded(true);
  }, [classEnded]);

  const handleLeave = () => {
    router.push("/learn/live-class");
  };

  if (isPending) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <p className="text-sm text-muted-foreground">Connecting to live class...</p>
        </div>
      </div>
    );
  }

  if (error || !tokenResult) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-3">
        <p className="text-sm font-semibold text-foreground">Couldn&apos;t join this class</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Please try again."}
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="size-4" />
          Back
        </Button>
      </div>
    );
  }

  if (ended) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-3">
        <p className="text-lg font-semibold text-foreground">Class ended</p>
        <p className="text-sm text-muted-foreground">{tokenResult.liveClass.title}</p>
        <Button onClick={handleLeave}>Back to live classes</Button>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-4rem)] flex-col sm:-mx-6 lg:-mx-8">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {tokenResult.liveClass.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {tokenResult.liveClass.teacherName} &middot; {tokenResult.liveClass.subjectName}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 lg:hidden"
          onClick={() => setChatOpen((v) => !v)}
        >
          <MessageCircle className="size-4" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <VideoRoom
            serverUrl={LIVEKIT_URL}
            token={tokenResult.token}
            handRaised={handRaised}
            onToggleHand={handRaised ? lowerHand : raiseHand}
            onLeave={handleLeave}
            onDisconnected={handleLeave}
          />
        </div>

        {/* ≥lg: static column beside the video. Below lg it renders as a
            full-screen Sheet overlay instead (see below) — as a flex-row
            sibling here it would squeeze the video down to near-nothing at
            phone widths rather than actually overlaying it. */}
        <div className="hidden w-full max-w-xs flex-col border-l border-border bg-card lg:flex">
          <ChatPanel
            studentId={user?.id}
            messages={messages}
            raisedHands={raisedHands}
            typingUserIds={typingUserIds}
            connectionState={connectionState}
            onSend={sendMessage}
            onEdit={editMessage}
            onDelete={deleteMessage}
            onTyping={notifyTyping}
          />
        </div>
      </div>

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-xs lg:hidden">
          <VisuallyHidden>
            <SheetTitle>Class chat</SheetTitle>
          </VisuallyHidden>
          <ChatPanel
            studentId={user?.id}
            messages={messages}
            raisedHands={raisedHands}
            typingUserIds={typingUserIds}
            connectionState={connectionState}
            onSend={sendMessage}
            onEdit={editMessage}
            onDelete={deleteMessage}
            onTyping={notifyTyping}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
