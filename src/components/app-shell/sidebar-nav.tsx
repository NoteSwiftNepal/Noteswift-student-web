"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { primaryNavItems, moreNavItems, moreNavLabel, MoreIcon } from "./nav-items";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-sm px-3 py-2 text-body-sm transition-colors duration-fast ease-standard",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && label}
    </Link>
  );
}

// Collapse-to-icons toggle + drag-resizable width (useUIStore) — genuine web
// adaptations, no mobile equivalent to port (mobile has no persistent
// sidebar at all).
export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);
  const dragging = useUIStore((s) => s.sidebarDragging);
  const setDragging = useUIStore((s) => s.setSidebarDragging);
  const [moreOpen, setMoreOpen] = useState(
    moreNavItems.some((item) => pathname.startsWith(item.href))
  );

  // Pointer Capture (not a document-level mousemove/mouseup pair) — the
  // handle itself keeps receiving pointermove/pointerup once it captures
  // the pointer in onPointerDown, even once the cursor leaves the handle's
  // own bounds, so there's no global listener to forget to remove. rAF
  // batches the store writes to at most once per frame instead of once per
  // pointermove (which can fire far more often than the screen repaints).
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const latestClientXRef = useRef(0);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (collapsed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    setDragging(true);
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    latestClientXRef.current = e.clientX;
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setSidebarWidth(startWidthRef.current + (latestClientXRef.current - startXRef.current));
      });
    }
  };

  const handleResizePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setDragging(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const railWidth = collapsed ? "64px" : `${sidebarWidth}px`;

  return (
    <aside
      style={{ ["--sidebar-w" as string]: railWidth }}
      className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col lg:w-[var(--sidebar-w)] border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        !dragging && "transition-[width] duration-base ease-standard"
      )}
    >
      <div className={cn("flex items-center gap-2 px-5 py-5", collapsed && "justify-center px-0")}>
        <Image src="/noteswift-logo.png" alt="NoteSwift" width={28} height={28} className="shrink-0" />
        {!collapsed && <span className="truncate text-h4 text-sidebar-foreground">NoteSwift</span>}
      </div>

      <nav className={cn("flex-1 space-y-1 overflow-y-auto px-3", collapsed && "px-2")}>
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname.startsWith(item.href)}
            collapsed={collapsed}
          />
        ))}

        {collapsed ? (
          // No point grouping behind a "More" trigger when there's no label
          // to show for it — just render every item as a plain icon link.
          moreNavItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname.startsWith(item.href)}
              collapsed={collapsed}
            />
          ))
        ) : (
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-body-sm text-sidebar-foreground/70 transition-colors duration-fast ease-standard hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <MoreIcon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{moreNavLabel}</span>
                <ChevronDown className={cn("size-4 transition-transform duration-fast ease-standard", moreOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-3 pt-1">
              {moreNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname.startsWith(item.href)}
                  collapsed={collapsed}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </nav>

      <div className={cn("border-t border-sidebar-border px-3 py-4", collapsed && "px-2")}>
        {user && !collapsed && (
          <p className="truncate px-3 pb-2 text-caption text-sidebar-foreground/60">{user.full_name}</p>
        )}
        <Button
          variant="ghost"
          title={collapsed ? "Log out" : undefined}
          className={cn(
            "w-full gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={handleLogout}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && "Log out"}
        </Button>
      </div>

      {/* Collapse/expand toggle — mounted on the sidebar's own edge (a small
          circular button straddling the border) instead of a full-width
          row inside the sidebar body. */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-6 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-1 transition-colors duration-fast ease-standard hover:bg-secondary hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      {/* Drag-to-resize handle — a separate control from the collapse
          toggle above; only meaningful while expanded (collapsed width is
          fixed at 64px regardless of the last dragged width). */}
      {!collapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerEnd}
          onPointerCancel={handleResizePointerEnd}
          className="absolute -right-0.5 top-0 z-10 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-primary/30 active:bg-primary/40"
        />
      )}
    </aside>
  );
}
