import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDownload, deleteDownload, getDownloads } from "@/api/student/downloads";
import type { CreateDownloadInput } from "@/types/download";

export function useDownloads() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["downloads"],
    queryFn: getDownloads,
  });

  const recordDownload = useMutation({
    mutationFn: (input: CreateDownloadInput) => createDownload(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["downloads"] }),
  });

  const removeDownload = useMutation({
    mutationFn: (id: string) => deleteDownload(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["downloads"] }),
  });

  return {
    downloads: query.data ?? [],
    downloadsLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    recordDownload,
    removeDownload,
  };
}
