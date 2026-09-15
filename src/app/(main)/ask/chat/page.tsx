"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, MessagesSquare, WifiOff } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEnrollments } from "@/hooks/queries/useEnrollments";
import { useCourseTeachers } from "@/hooks/queries/useCourseTeachers";
import { useDirectChatSocket } from "@/hooks/useDirectChatSocket";
import { useDirectChatStore } from "@/stores/directChatStore";
import { resolveCourse } from "@/lib/course";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Real-time now: replaces Phase 5's REST-polling with the actual
// student<->teacher direct-chat socket (src/socket/directChatHandler.ts).
// This page mounts its own useDirectChatSocket connection (torn down on
// unmount, same as the thread page's) — it exists specifically so the
// inbox list itself gets live preview/unread updates without polling, on
// top of the initial REST fetch every conversation list needs anyway.
export default function ConversationsPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { enrollments } = useEnrollments(userId);
  const courses = useMemo(
    () => enrollments.map((e) => resolveCourse(e.courseId)).filter((c): c is NonNullable<typeof c> => !!c),
    [enrollments]
  );

  const { connectionState, refreshConversations } = useDirectChatSocket(userId, accessToken);
  const conversations = useDirectChatStore((s) => s.conversations);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(false);
    refreshConversations().then((result) => {
      setLoading(false);
      if (result === null) setLoadError(true);
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const [newOpen, setNewOpen] = useState(false);
  const [pickerCourseId, setPickerCourseId] = useState(courses[0]?._id ?? "");
  const { courseTeachers } = useCourseTeachers(pickerCourseId || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Chat</h1>
          <p className="text-sm text-muted-foreground">Message a teacher directly.</p>
        </div>
        <Button
          onClick={() => {
            setPickerCourseId(courses[0]?._id ?? "");
            setNewOpen(true);
          }}
        >
          <Plus className="size-4" />
          New conversation
        </Button>
      </div>

      {connectionState !== "connected" && (
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
          <WifiOff className="size-3.5" />
          {connectionState === "connecting" ? "Connecting..." : "Reconnecting..."}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : loadError ? (
        <InlineError message="Couldn't load conversations." onRetry={load} />
      ) : conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          <MessagesSquare className="mx-auto mb-3 size-10 text-muted-foreground" />
          No conversations yet. Start one with a teacher.
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <Link key={`${c.teacherId}-${c.subjectName}`} href={`/ask/chat/${c.teacherId}/${encodeURIComponent(c.subjectName)}?courseId=${c.courseId ?? ""}&teacherName=${encodeURIComponent(c.teacherName)}&courseName=${encodeURIComponent(c.courseName)}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {c.teacherName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${c.unreadCount > 0 ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                        {c.teacherName}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.lastMessageTime)}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.subjectName} &middot; {c.courseName}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="flex-1 truncate text-xs text-muted-foreground">
                        {c.lastMessageSenderType === "student" ? "You: " : ""}
                        {c.lastMessage}
                      </p>
                      {c.unreadCount > 0 && (
                        <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                          {c.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a conversation</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {courseTeachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects available.</p>
            ) : (
              courseTeachers.map((s) => (
                <Link
                  key={s.subjectName}
                  href={
                    s.teacher
                      ? `/ask/chat/${s.teacher.id}/${encodeURIComponent(s.subjectName)}?courseId=${pickerCourseId}&teacherName=${encodeURIComponent(s.teacher.name)}&courseName=${encodeURIComponent(courses.find((c) => c._id === pickerCourseId)?.title ?? "")}`
                      : "#"
                  }
                  onClick={(e) => {
                    if (!s.teacher) e.preventDefault();
                    else setNewOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-lg border border-border p-3 ${s.teacher ? "hover:bg-secondary/60" : "cursor-not-allowed opacity-50"}`}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessagesSquare className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.subjectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.teacher ? `Teacher: ${s.teacher.name}` : "No teacher assigned"}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
