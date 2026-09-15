import { useQuery } from "@tanstack/react-query";
import { getActivePromoBanners } from "@/api/student/promo";

export function usePromoBanners() {
  const query = useQuery({
    queryKey: ["promo-banners"],
    queryFn: getActivePromoBanners,
  });

  return {
    banners: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
  };
}
