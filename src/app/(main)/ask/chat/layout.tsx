"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, MessagesSquare, Plus, WifiOff } from "lucide-react";
import { useCourseTeachers } from "@/hooks/queries/useCourseTeachers";
import { useDirectChatStore } from "@/stores/directChatStore";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { getCourseId } from "@/lib/course";
import { DirectChatSocketProvider, useDirectChatSocketContext } from "@/components/ask/direct-chat-socket-context";
import { TeacherAvatar } from "@/components/ask/teacher-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// The persistent left panel — conversation list + "New conversation" entry
// point. Rendered exactly once in the DOM; responsive visibility (desktop
// collapsible column vs. mobile full-screen list view) is handled entirely
// by the caller's wrapping classes, not by mounting this twice.
function ConversationListPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedCourse, enrolledCourses: courses } = useSelectedCourse();
  const { connectionState, refreshConversations } = useDirectChatSocketContext();
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
  // Defaults to the app-wide selected course but is still independently
  // switchable inside the dialog — messaging a teacher isn't necessarily
  // scoped to only the "currently learning" course.
  const [pickerCourseId, setPickerCourseId] = useState(selectedCourse ? getCourseId(selectedCourse) : "");
  const { courseTeachers } = useCourseTeachers(pickerCourseId || undefined);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border p-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
            onClick={() => router.push("/ask")}
            aria-label="Back to Ask"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <h1 className="truncate text-h3 text-foreground">Teacher Chat</h1>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="shrink-0"
          onClick={() => {
            setPickerCourseId(selectedCourse ? getCourseId(selectedCourse) : "");
            setNewOpen(true);
          }}
          aria-label="New conversation"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {connectionState !== "connected" && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-2 text-caption text-muted-foreground">
          <WifiOff className="size-3.5" />
          {connectionState === "connecting" ? "Connecting..." : "Reconnecting..."}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ) : loadError ? (
          <InlineError message="Couldn't load conversations." onRetry={load} />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <MessagesSquare className="size-8" />
            <p className="text-body-sm">No conversations yet. Start one with a teacher.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => {
              const active = pathname === `/ask/chat/${c.teacherId}/${encodeURIComponent(c.subjectName)}`;
              return (
                <Link
                  key={`${c.teacherId}-${c.subjectName}`}
                  href={`/ask/chat/${c.teacherId}/${encodeURIComponent(c.subjectName)}?courseId=${c.courseId ?? ""}&teacherName=${encodeURIComponent(c.teacherName)}&courseName=${encodeURIComponent(c.courseName)}&teacherPhoto=${encodeURIComponent(c.teacherPhoto ?? "")}`}
                >
                  <Card
                    className={cn(
                      "transition-[transform,box-shadow] duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-2",
                      active && "border-primary"
                    )}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <TeacherAvatar name={c.teacherName} photoUrl={c.teacherPhoto} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("truncate text-body-sm", c.unreadCount > 0 ? "font-bold text-foreground" : "font-semibold text-foreground")}>
                            {c.teacherName}
                          </p>
                          <span className="shrink-0 text-caption text-muted-foreground">{timeAgo(c.lastMessageTime)}</span>
                        </div>
                        <p className="truncate text-caption text-muted-foreground">
                          {c.subjectName} &middot; {c.courseName}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="flex-1 truncate text-caption text-muted-foreground">
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
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a conversation</DialogTitle>
          </DialogHeader>

          {courses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="new-conversation-course">Course</Label>
              <Select value={pickerCourseId} onValueChange={setPickerCourseId}>
                <SelectTrigger id="new-conversation-course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {courseTeachers.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">No subjects available.</p>
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
                  className={cn(
                    "flex items-center gap-3 rounded-md border border-border p-3",
                    s.teacher ? "hover:bg-secondary/60" : "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="flex size-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
                    <MessagesSquare className="size-4" />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-foreground">{s.subjectName}</p>
                    <p className="text-caption text-muted-foreground">
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

function AskChatShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Exactly the list/empty route, no specific thread open — the one case
  // where the panel takes over the full screen below lg (there's nowhere
  // else for "the list" to live at a width too narrow for two panes).
  const isListRoute = pathname === "/ask/chat";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-4rem)] sm:-mx-6 lg:-mx-8">
      {/* Desktop: persistent column, collapsible to fully hidden (not an
          icon rail — there's no meaningful icon-only view for a
          conversation list) via the sidebar's own edge-mounted toggle
          pattern (§6.9). Mobile: full-screen list view only on the exact
          /ask/chat route; hidden once a thread is open, since the thread
          then fills the screen instead. */}
      <aside
        className={cn(
          "relative flex-col border-r border-border bg-card lg:flex lg:shrink-0 transition-[width] duration-base ease-standard",
          isListRoute ? "flex w-full" : "hidden",
          collapsed ? "lg:w-0 lg:overflow-hidden lg:border-r-0" : "lg:w-80"
        )}
      >
        {!collapsed && <ConversationListPanel />}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Show conversations" : "Hide conversations"}
          className="absolute -right-3 top-6 z-10 hidden size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-1 transition-colors duration-fast ease-standard hover:bg-secondary hover:text-foreground lg:flex"
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </aside>

      <div className={cn("min-w-0 flex-1 flex-col", isListRoute ? "hidden lg:flex" : "flex")}>{children}</div>
    </div>
  );
}

export default function AskChatLayout({ children }: { children: ReactNode }) {
  return (
    <DirectChatSocketProvider>
      <AskChatShell>{children}</AskChatShell>
    </DirectChatSocketProvider>
  );
}
