"use client";

import type { ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "@/components/notification-bell";
import { UserAvatarLink } from "./user-avatar-link";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

// Responsive shell: fixed sidebar at ≥1024px (lg), collapsible drawer below
// (blueprint §6, §8). No auth guarding yet — wraps every (main) route.
//
// SidebarNav is `lg:fixed` (pinned via `lg:left-0`) and rendered as a sibling
// here, outside the offset wrapper below — a fixed element with `left`
// unset falls back to its *static* position, which a padded/offset ancestor
// would shift away from the true viewport edge. Keeping it a sibling avoids
// that entirely, on top of the explicit `lg:left-0` on the element itself.
//
// This is now a client component (it wasn't before the sidebar got a
// collapse toggle) so the content offset can react to the same
// useUIStore.sidebarCollapsed flag SidebarNav renders its own width from —
// otherwise collapsing the sidebar would leave a stale gap/overlap.
export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen">
      <SidebarNav />
      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <MobileNav />
        <div className="hidden items-center justify-end gap-2 border-b border-border px-8 py-3 lg:flex">
          <NotificationBell />
          <UserAvatarLink />
        </div>
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
