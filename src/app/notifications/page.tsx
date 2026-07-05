"use client";

import { useEffect, useState } from "react";
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Trash2, 
  MailOpen,
  Filter,
  CheckCheck,
  ChevronRight,
  Sparkles,
  Inbox
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { api } from "@/services/api";
import { Notification } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function NotificationsContent() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifs = async () => {
    setIsLoading(true);
    const res = await api.getNotifications();
    setIsLoading(false);
    if (res.success && res.data) {
      setNotifications(res.data);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    const res = await api.markNotificationRead(id);
    if (res.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      toast({
        title: "Notification Read",
        description: "Marked notification as read.",
      });
    }
  };

  const handleMarkAllRead = async () => {
    const res = await api.markAllNotificationsRead();
    if (res.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast({
        title: "All Read",
        description: "All notifications marked as read.",
      });
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header card */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-gray-300 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
            <Bell className="h-6 w-6 text-indigo-500" />
            Notification Center
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Stay updated with school broadcasts, class schedules, and question updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button 
            onClick={handleMarkAllRead}
            variant="outline" 
            className="border-indigo-200 text-indigo-650 hover:bg-indigo-50 font-bold rounded-xl h-10 text-xs px-4 flex items-center gap-1.5 bg-white"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Tabs / Filter Pills */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "All Alerts", count: notifications.length },
          { id: "unread", label: "Unread", count: unreadCount },
          { id: "read", label: "Read Log", count: notifications.length - unreadCount }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5",
              filter === tab.id
                ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            )}
          >
            <span>{tab.label}</span>
            <Badge 
              variant="secondary" 
              className={cn(
                "text-[9px] font-extrabold px-1.5 h-4.5 rounded-full shrink-0",
                filter === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              )}
            >
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Notification Lists */}
      {isLoading ? (
        <Card className="border border-gray-300 bg-white p-12 text-center rounded-2xl">
          <div className="animate-spin h-6 w-6 border-b-2 border-indigo-600 mx-auto rounded-full"></div>
          <span className="text-xs text-gray-500 font-semibold block mt-4">Retrieving notifications...</span>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card className="border border-gray-300 bg-white p-12 text-center rounded-2xl max-w-md mx-auto space-y-3 mt-4">
          <div className="h-12 w-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto border border-gray-150">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-extrabold text-gray-800">Clear Inbox</h3>
          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            No notifications found under the selected "{filter}" filter list.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div 
              key={notif.id} 
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
              className={cn(
                "p-4 border rounded-2xl flex items-start gap-4 transition-all relative overflow-hidden group cursor-pointer",
                notif.isRead 
                  ? "bg-white border-gray-250 hover:bg-gray-50/50" 
                  : "bg-blue-50/20 border-blue-200 hover:bg-blue-50/40 shadow-sm"
              )}
            >
              {/* Visual unread Indicator bar */}
              {!notif.isRead && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
              )}

              <div className={cn(
                "h-10 w-10 flex items-center justify-center rounded-xl shrink-0 border",
                notif.isRead 
                  ? "bg-gray-50 text-gray-500 border-gray-200" 
                  : "bg-blue-50 text-blue-700 border-blue-150"
              )}>
                <Bell className="h-5 w-5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <h4 className={cn(
                    "text-xs sm:text-sm leading-snug",
                    notif.isRead ? "font-bold text-gray-700" : "font-extrabold text-gray-800"
                  )}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-gray-450 font-bold shrink-0">{notif.date}</span>
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{notif.content}</p>
              </div>

              {!notif.isRead && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkRead(notif.id);
                  }}
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 shrink-0 self-center hidden group-hover:flex"
                >
                  <MailOpen className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <NotificationsContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
