"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Megaphone, CheckCheck, MessageCircleQuestion, School } from "lucide-react";
import { useNotifications } from "@/hooks/queries/useNotifications";
import { useQuestions } from "@/hooks/queries/useQuestions";
import { useUnreadNotificationCount } from "@/hooks/queries/useUnreadNotificationCount";
import { markAllNotificationsRead, markNotificationRead } from "@/api/student/notification";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import { cn } from "@/lib/utils";

type FeedItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: number;
  read: boolean;
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const ICONS: Record<string, typeof Bell> = {
  admin_broadcast: Megaphone,
  question_answer: MessageCircleQuestion,
  enrollment: School,
};

// Merges the paginated admin-broadcast feed (with-read-status) with answered
// questions from the Ask hub — same combined-sections structure as mobile's
// NotificationPage.tsx, ported to a flat list with client-side sections
// since a SectionList has no direct web equivalent here.
export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { notifications, notificationsLoading, error, hasMore, isLoadingMore, loadMore, refetch } = useNotifications();
  const { questions } = useQuestions();
  const { unreadCount } = useUnreadNotificationCount();
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());
  const [allMarkedRead, setAllMarkedRead] = useState(false);

  const broadcastItems: FeedItem[] = useMemo(
    () =>
      notifications.map((n) => ({
        id: n._id,
        title: n.title,
        message: n.message || n.description || "",
        type: n.type,
        timestamp: new Date(n.sentAt || n.createdAt).getTime(),
        read: allMarkedRead || locallyRead.has(n._id) || !!n.read,
      })),
    [notifications, locallyRead, allMarkedRead]
  );

  const questionItems: FeedItem[] = useMemo(
    () =>
      questions
        .filter((q) => q.answersCount > 0)
        .map((q) => ({
          id: q._id,
          title: `New answer to: ${q.title}`,
          message: `Your question received ${q.answersCount} answer${q.answersCount > 1 ? "s" : ""}`,
          type: "question_answer",
          timestamp: new Date(q.updatedAt).getTime(),
          read: allMarkedRead,
        })),
    [questions, allMarkedRead]
  );

  const hasUnread = !allMarkedRead && (broadcastItems.some((i) => !i.read) || unreadCount > 0);

  const handleMarkRead = async (id: string) => {
    setLocallyRead((prev) => new Set(prev).add(id));
    try {
      await markNotificationRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    } catch {
      // Best-effort — the optimistic local state still shows it as read.
    }
  };

  const handleMarkAllRead = async () => {
    setAllMarkedRead(true);
    try {
      await markAllNotificationsRead();
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      refetch();
    } catch (err) {
      toast({ title: "Failed to mark all as read", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    }
  };

  const sections = [
    { title: "Admin Broadcasts", items: broadcastItems },
    { title: "Question Updates", items: questionItems },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Broadcasts and updates on questions you&apos;ve asked.</p>
        </div>
        {hasUnread ? (
          <Button size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        ) : sections.length > 0 ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
            <CheckCheck className="size-4" />
            All caught up
          </span>
        ) : null}
      </div>

      {notificationsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load notifications." onRetry={() => refetch()} />
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Bell className="mb-3 size-10 text-muted-foreground" />
          <p className="text-lg font-bold text-foreground">No notifications yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Your notifications will appear here once you receive admin broadcasts or teacher answers to your questions.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {section.title} ({section.items.length})
              </p>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = ICONS[item.type] ?? Bell;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMarkRead(item.id)}
                      className={cn(
                        "flex w-full items-start gap-3.5 rounded-xl border border-border p-4 text-left transition-colors",
                        item.read ? "bg-secondary/30" : "bg-card"
                      )}
                    >
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", item.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm", item.read ? "font-medium text-muted-foreground" : "font-bold text-foreground")}>{item.title}</p>
                          {!item.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                        </div>
                        <p className={cn("mt-1 line-clamp-2 text-sm", item.read ? "text-muted-foreground" : "text-foreground/80")}>{item.message}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{relativeTime(item.timestamp)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => loadMore()} disabled={isLoadingMore}>
                {isLoadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
