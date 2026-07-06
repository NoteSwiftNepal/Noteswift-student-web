"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  Award,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Loader2,
  ChevronDown
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useStudentAuth } from "@/context/student-auth-context";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { Notification } from "@/data/mockData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const navSections = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/courses", label: "My Courses", icon: GraduationCap },
      { href: "/learn", label: "Learning Feed", icon: CalendarDays },
      { href: "/test", label: "Tests & Quizzes", icon: Award },
      { href: "/ask", label: "Ask a Doubt", icon: MessageSquare },
    ]
  },
  {
    title: "Account & More",
    items: [
      { href: "/pro-dashboard", label: "Pro Dashboard", icon: CreditCard },
      { href: "/settings", label: "Settings & Profile", icon: Settings },
    ]
  }
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

  // Trigger page transition loading on route change
  useEffect(() => {
    if (pathname !== prevPathname) {
      setIsPageLoading(true);
      setPrevPathname(pathname);
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 450);
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
    // Poll notifications every 30 seconds for dynamic feel
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLinkClick = (href: string) => {
    if (pathname !== href) {
      setIsPageLoading(true);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const getPageTitle = () => {
    for (const section of navSections) {
      const match = section.items.find(item => item.href === pathname || (item.href !== "/dashboard" && pathname.startsWith(item.href)));
      if (match) return match.label;
    }
    if (pathname.startsWith("/learn/")) return "Learning Feed";
    if (pathname.startsWith("/test/")) return "Test Center";
    return "Student Portal";
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const markAllAsRead = async () => {
    const res = await api.markAllNotificationsRead();
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast({
        title: "Notifications Read",
        description: "All notifications marked as read.",
      });
    }
  };

  const handleNotifClick = async (id: string) => {
    const res = await api.markNotificationRead(id);
    if (res.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background/95">
        {/* SIDEBAR */}
        <Sidebar className="h-full border-r border-gray-300 bg-sidebar/80 backdrop-blur supports-[backdrop-filter]:bg-sidebar/70">
          <SidebarHeader className="border-b border-gray-300 py-4 px-6">
            <Link
              href="/dashboard"
              onClick={() => handleLinkClick("/dashboard")}
              className="flex items-center gap-2.5"
            >
              <div className="flex items-center justify-center h-10 w-10 overflow-hidden rounded-xl">
                <img 
                  src="/logo.png" 
                  alt="NoteSwift Logo" 
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base leading-none text-gray-800 tracking-tight">NoteSwift</span>
                <span className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-wider mt-0.5">Student Portal</span>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-4 py-6 space-y-6">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => handleLinkClick(item.href)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-bold",
                          isActive
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg"
                            : "text-foreground/80 hover:bg-secondary/80 hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-500")} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </SidebarContent>

          {/* SIDEBAR FOOTER */}
          <SidebarFooter className="border-t border-gray-300 p-4 space-y-2">
            {student && (
              <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary/60 border border-gray-200">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-xs font-extrabold text-white shrink-0 shadow-sm">
                  {student.fullName ? student.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'NS'}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-extrabold text-xs sm:text-sm truncate text-gray-800">{student.fullName || student.phoneNumber || "Student"}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 font-bold truncate">
                    {student.rollNo != null ? `Roll ${student.rollNo}` : ""}{student.rollNo != null && student.grade ? " • " : ""}{student.grade ? student.grade.split(" ")[0] : ""}
                  </span>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full justify-start gap-2.5 h-11 px-3 rounded-xl border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 transition-all duration-200 font-bold text-xs sm:text-sm bg-white"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
              ) : (
                <LogOut className="h-4 w-4 text-gray-500 group-hover:text-red-500" />
              )}
              <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* MAIN INSET */}
        <SidebarInset className="flex flex-col flex-1 min-h-screen">
          {/* TOPBAR */}
          <header className="sticky top-0 flex h-16 items-center justify-between border-b border-gray-300 px-4 sm:px-6 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="hidden md:flex flex-col">
                <h1 className="text-lg font-bold text-gray-800 font-headline leading-tight">{getPageTitle()}</h1>
                <span className="text-[11px] text-gray-500 font-bold">{formattedDate}</span>
              </div>
            </div>
 
            {/* Topbar Actions */}
            <div className="flex items-center gap-3">
              {/* NOTIFICATION BELL */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-gray-300 hover:bg-secondary/40 text-gray-600 relative shadow-sm shrink-0 bg-white">
                    <Bell className="h-4.5 w-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white shadow-sm leading-none">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 rounded-xl border border-gray-300 shadow-lg p-0 bg-white">
                  <div className="flex items-center justify-between p-4 border-b border-gray-300">
                    <h4 className="text-xs font-bold text-gray-800">Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-[11px] text-blue-600 font-bold hover:underline">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-300 max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n.id)}
                          className={cn("p-4 text-[11px] transition-colors cursor-pointer hover:bg-secondary/20", !n.isRead ? "bg-blue-50/50" : "")}
                        >
                          <p className="font-semibold text-gray-800">{n.title}</p>
                          <p className="text-gray-600 mt-0.5">{n.content}</p>
                          <span className="text-[10px] text-gray-500 font-bold mt-1 block">{n.date}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-500 font-bold text-xs">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-300 text-center bg-gray-50/50 rounded-b-xl">
                    <Link href="/notifications" className="text-xs text-indigo-650 font-bold hover:underline">
                      View All Alerts
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

          </header>

          {/* MAIN CONTENT CONTAINER */}
          <main className="flex-1 w-full p-4 sm:p-6 md:p-8 overflow-y-auto">
            {isPageLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] h-full py-20 space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-16 h-16 rounded-full border-4 border-blue-100 animate-ping"></div>
                  <div className="w-16 h-16 rounded-full border-4 border-t-blue-500 border-r-indigo-600 border-b-transparent border-l-transparent animate-spin"></div>
                  <div className="absolute w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <div className="space-y-1.5 text-center">
                  <h3 className="text-sm font-bold text-gray-800 tracking-wide">Syncing Student Data</h3>
                  <p className="text-xs text-gray-500 font-semibold animate-pulse">Retrieving records from school cloud...</p>
                </div>
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
