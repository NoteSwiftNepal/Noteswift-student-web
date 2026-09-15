import { useQuery } from "@tanstack/react-query";
import { getHistory } from "@/api/student/history";

export function useHistory() {
  const query = useQuery({
    queryKey: ["history"],
    queryFn: getHistory,
  });

  return {
    history: query.data ?? [],
    historyLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
