import { useQuery } from "@tanstack/react-query";
import { getUnreadNotificationCount } from "@/api/student/notification";

export function useUnreadNotificationCount() {
  const query = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await getUnreadNotificationCount();
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch unread count");
      }
      return response.data.unreadCount;
    },
    refetchInterval: 60_000,
  });

  return { unreadCount: query.data ?? 0 };
}
