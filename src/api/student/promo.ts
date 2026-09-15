import api from "@/api/axios";

export interface PromoBanner {
  _id: string;
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  badge?: string;
}

// GET /promo-banners/active replies with a bare array — no envelope at all
// (confirmed against mobile's api/student/promo.ts, which defensively
// Array.isArray-checks the raw response for the same reason).
export const getActivePromoBanners = async (): Promise<PromoBanner[]> => {
  const res = await api.get("/promo-banners/active");
  return Array.isArray(res.data) ? res.data : [];
};
