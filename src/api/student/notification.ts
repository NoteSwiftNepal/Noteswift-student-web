import api from "@/api/axios";
import type { LegacyApiResponse } from "@/types/api";
import type { AppNotification, NotificationsWithReadStatusResult } from "@/types/notification";

// All endpoints below reply with LegacyApiResponse ({success,data,message})
// — confirmed against notificationRoutes.ts. mark-read and mark-all-read
// are the `{success,message}`-with-no-`data`-field variant on the single
// mark-read call; mark-all-read is the exception, adding `data:{count}`.

export const getUnreadNotificationCount = async (): Promise<
  LegacyApiResponse<{ unreadCount: number; totalNotifications: number; readCount: number }>
> => {
  const res = await api.get("/notifications/unread/count");
  return res.data;
};

export const getActiveHomepageNotification = async (): Promise<
  LegacyApiResponse<AppNotification | null>
> => {
  const res = await api.get("/notifications/active/homepage");
  return res.data;
};

export const listNotificationsWithReadStatus = async (
  options: { type?: string; before?: string; limit?: number } = {}
): Promise<LegacyApiResponse<NotificationsWithReadStatusResult>> => {
  const res = await api.get("/notifications/with-read-status", { params: options });
  return res.data;
};

export const markNotificationRead = async (
  notificationId: string
): Promise<{ success: boolean; message: string }> => {
  const res = await api.post(`/notifications/read/${notificationId}`);
  return res.data;
};

export const markAllNotificationsRead = async (): Promise<
  LegacyApiResponse<{ count: number }>
> => {
  const res = await api.post("/notifications/read-all");
  return res.data;
};
