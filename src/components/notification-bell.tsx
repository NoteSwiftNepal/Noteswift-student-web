"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useUnreadNotificationCount } from "@/hooks/queries/useUnreadNotificationCount";

export function NotificationBell() {
  const { unreadCount } = useUnreadNotificationCount();

  return (
    <Link
      href="/notifications"
      className="relative flex size-10 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-secondary/60 hover:text-foreground"
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
    >
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
