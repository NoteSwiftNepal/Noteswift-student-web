import type { LucideIcon } from "lucide-react";
import {
  Home,
  BookOpen,
  ClipboardList,
  MessageCircleQuestion,
  MoreHorizontal,
  LayoutGrid,
  GraduationCap,
  LayoutDashboard,
  TrendingUp,
  Download,
  History,
  Bookmark,
  Bell,
  Settings,
  UserRound,
  Users,
  LifeBuoy,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Mobile's four main tabs + More (blueprint §8).
export const primaryNavItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "Test", href: "/test", icon: ClipboardList },
  { label: "Ask", href: "/ask", icon: MessageCircleQuestion },
];

export const moreNavItems: NavItem[] = [
  { label: "Courses", href: "/courses", icon: LayoutGrid },
  { label: "My Batches", href: "/courses/my-batches", icon: GraduationCap },
  { label: "Dashboard", href: "/courses/dashboard", icon: LayoutDashboard },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Downloads", href: "/downloads", icon: Download },
  { label: "History", href: "/history", icon: History },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Parent Link", href: "/parent-link", icon: Users },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

export const moreNavLabel = "More";
export const MoreIcon = MoreHorizontal;
