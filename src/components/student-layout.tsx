"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Video,
  ClipboardList,
  Bookmark,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Loader2,
  HelpCircle,
  Search,
  User,
  ChevronDown,
  History,
  Download,
  CreditCard,
  Zap,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudentAuth } from "@/context/student-auth-context";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { Notification } from "@/data/mockData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const navSections = [
  {
    title: "EXPLORE",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/courses", label: "Browse Courses", icon: BookOpen },
    ],
  },
  {
    title: "LEARN",
    items: [
      { href: "/learn", label: "My Learning", icon: GraduationCap },
      { href: "/live-class", label: "Live Class", icon: Video },
      { href: "/test", label: "Tests & Quizzes", icon: ClipboardList },
      { href: "/bookmarks", label: "Saved Contents", icon: Bookmark },
      { href: "/history", label: "Learning History", icon: History },
      { href: "/downloads", label: "Downloads", icon: Download },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      { href: "/ask", label: "Ask a Doubt", icon: MessageSquare },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "OTHERS",
    items: [
      { href: "/pro-dashboard", label: "Pro / Upgrade", icon: Zap },
      { href: "/settings", label: "Settings & Profile", icon: Settings },
      { href: "/support", label: "Support", icon: HelpCircle },
    ],
  },
];

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { student, logout } = useStudentAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Trigger page transition loading on route change
  useEffect(() => {
    if (pathname !== prevPathname) {
      setIsPageLoading(true);
      setPrevPathname(pathname);
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pathname, prevPathname]);

  // Load notifications
  const loadNotifications = async () => {
    const res = await api.getNotifications();
    if (res.success && res.data) {
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLinkClick = (href: string) => {
    if (pathname !== href) setIsPageLoading(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  const getPageTitle = () => {
    for (const section of navSections) {
      const match = section.items.find(
        (item) =>
          item.href === pathname ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href))
      );
      if (match) return match.label;
    }
    if (pathname.startsWith("/learn/")) return "My Learning";
    if (pathname.startsWith("/test/")) return "Tests & Quizzes";
    return "Student Portal";
  };

  const markAllAsRead = async () => {
    const res = await api.markAllNotificationsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast({ title: "All notifications marked as read." });
    }
  };

  const handleNotifClick = async (id: string) => {
    const res = await api.markNotificationRead(id);
    if (res.success) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const avatarLetters = student?.fullName
    ? student.fullName.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "NS";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f5f6fa]">
        {/* ─── LEFT SIDEBAR ─── */}
        <Sidebar className="h-full border-r border-gray-200 bg-white shadow-sm">
          {/* Logo */}
          <SidebarHeader className="border-b border-gray-100 py-4 px-5">
            <Link
              href="/dashboard"
              onClick={() => handleLinkClick("/dashboard")}
              className="flex items-center gap-2.5"
            >
              <div className="flex items-center justify-center h-9 w-9 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                <img src="/logo.png" alt="NoteSwift" className="h-7 w-7 object-contain" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-black text-[15px] text-gray-900 tracking-tight">NoteSwift</span>
                <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">
                  Your Learning App
                </span>
              </div>
            </Link>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="px-3 py-4 space-y-5 overflow-y-auto scrollbar-hide">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 mb-2">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => handleLinkClick(item.href)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-semibold group",
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                          : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4.5 h-4.5 shrink-0 transition-colors",
                          isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600"
                        )}
                        size={17}
                      />
                      <span className="truncate">{item.label}</span>
                      {/* Notification badge for bell icon */}
                      {item.href === "/notifications" && unreadCount > 0 && (
                        <span className="ml-auto flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white leading-none">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </SidebarContent>

          {/* Footer — student info + logout */}
          <SidebarFooter className="border-t border-gray-100 p-3 space-y-2">
            {student && (
              <Link
                href="/settings"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white shrink-0 shadow-sm">
                  {avatarLetters}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-[13px] truncate text-gray-800 group-hover:text-blue-700">
                    {student.fullName || student.phoneNumber || "Student"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold truncate">
                    {student.rollNo != null ? `Roll ${student.rollNo}` : ""}
                    {student.rollNo != null && student.grade ? " · " : ""}
                    {student.grade ? student.grade.split(" ")[0] : ""}
                  </span>
                </div>
                <Settings size={14} className="text-gray-400 group-hover:text-blue-500 shrink-0" />
              </Link>
            )}

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 disabled:opacity-60"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
              ) : (
                <LogOut className="h-4 w-4 text-gray-400" />
              )}
              <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        {/* ─── MAIN AREA ─── */}
        <SidebarInset className="flex flex-col flex-1 min-h-screen min-w-0">
          {/* ─── TOP BAR ─── */}
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6 shadow-sm">
            <SidebarTrigger className="shrink-0" />

            {/* Search Bar */}
            <div className="relative flex-1 max-w-sm hidden sm:flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Search courses, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-blue-300 transition-all"
              />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm">
                    <Bell size={17} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white border border-white leading-none">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 rounded-2xl border border-gray-200 shadow-xl p-0 bg-white">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h4 className="text-sm font-black text-gray-800">Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-[11px] text-blue-600 font-bold hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n.id)}
                          className={cn(
                            "px-4 py-3 text-[11px] cursor-pointer hover:bg-gray-50 transition-colors",
                            !n.isRead ? "bg-blue-50/60" : ""
                          )}
                        >
                          {!n.isRead && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 mb-0.5 align-middle" />
                          )}
                          <p className="font-bold text-gray-800 inline">{n.title}</p>
                          <p className="text-gray-500 mt-0.5">{n.content}</p>
                          <span className="text-[10px] text-gray-400 font-semibold mt-1 block">{n.date}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-xs font-semibold">
                        No new notifications
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100 text-center">
                    <Link href="/notifications" className="text-xs text-blue-600 font-bold hover:underline">
                      View All Notifications
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Profile Avatar */}
              <Link
                href="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-black shadow-sm hover:shadow-md transition-shadow"
                title={student?.fullName || "Profile"}
              >
                {avatarLetters}
              </Link>
            </div>
          </header>

          {/* ─── PAGE CONTENT ─── */}
          <main className="flex-1 w-full p-4 sm:p-6 overflow-y-auto">
            {isPageLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-14 h-14 rounded-full border-4 border-blue-100 animate-ping opacity-60" />
                  <div className="w-14 h-14 rounded-full border-4 border-t-blue-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute w-3 h-3 bg-blue-500 rounded-full" />
                </div>
                <p className="text-xs text-gray-500 font-semibold animate-pulse">Loading...</p>
              </div>
            ) : (
              children
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
