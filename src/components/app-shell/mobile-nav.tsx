"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useAuthStore } from "@/stores/authStore";
import { NotificationBell } from "@/components/notification-bell";
import { UserAvatarLink } from "./user-avatar-link";
import { primaryNavItems, moreNavItems, moreNavLabel, MoreIcon } from "./nav-items";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-foreground/70 hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.replace("/login");
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image src="/noteswift-logo.png" alt="NoteSwift" width={24} height={24} />
        <span className="text-base font-bold">NoteSwift</span>
      </Link>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <UserAvatarLink />
        <Sheet open={open} onOpenChange={setOpen}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <SheetContent side="left" className="w-72 p-0">
          <VisuallyHidden>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden>
          <nav className="flex flex-col gap-1 p-4">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname.startsWith(item.href)}
                onNavigate={() => setOpen(false)}
              />
            ))}

            <p className="mt-3 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MoreIcon className="size-3.5" />
              {moreNavLabel}
            </p>
            {moreNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname.startsWith(item.href)}
                onNavigate={() => setOpen(false)}
              />
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <LogOut className="size-4 shrink-0" />
              Log out
            </button>
          </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
