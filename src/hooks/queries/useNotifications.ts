import { useInfiniteQuery } from "@tanstack/react-query";
import { listNotificationsWithReadStatus } from "@/api/student/notification";

// Cursor-paginated (with-read-status route) — useInfiniteQuery is the
// direct React Query equivalent of mobile's hand-rolled loadMore/hasMore
// state in hooks/queries/useNotifications.ts.
export function useNotifications() {
  const query = useInfiniteQuery({
    queryKey: ["notifications", "list"],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const res = await listNotificationsWithReadStatus({ before: pageParam });
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
  });

  const notifications = query.data?.pages.flatMap((p) => p.notifications) ?? [];

  return {
    notifications,
    notificationsLoading: query.isPending,
    error: query.error,
    hasMore: !!query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => query.fetchNextPage(),
    refetch: query.refetch,
  };
}
