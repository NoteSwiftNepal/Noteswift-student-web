"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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

// Collapse-to-icons toggle (useUIStore) — a genuine web adaptation, no
// mobile equivalent to port (mobile has no persistent sidebar at all).
export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [moreOpen, setMoreOpen] = useState(
    moreNavItems.some((item) => pathname.startsWith(item.href))
  );

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <aside
      className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "lg:w-16" : "lg:w-64"
      )}
    >
      <div className={cn("flex items-center gap-2 px-5 py-5", collapsed && "justify-center px-0")}>
        <Image src="/noteswift-logo.png" alt="NoteSwift" width={28} height={28} className="shrink-0" />
        {!collapsed && <span className="truncate text-lg font-bold">NoteSwift</span>}
      </div>

      <div className={cn("px-3 pb-2", collapsed && "flex justify-center px-0")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
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
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <MoreIcon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{moreNavLabel}</span>
                <ChevronDown className={cn("size-4 transition-transform", moreOpen && "rotate-180")} />
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
          <p className="truncate px-3 pb-2 text-xs text-sidebar-foreground/60">{user.full_name}</p>
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
    </aside>
  );
}
