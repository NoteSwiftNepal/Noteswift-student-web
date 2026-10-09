import api from "@/api/axios";

// Checkout price breakdown, computed by the backend (services/pricingService.ts).
// Display only: payment initiate recomputes the same quote server-side and
// charges its total, so nothing here can change what's charged.
export interface PriceQuote {
  currency: "NPR";
  listPrice: number;
  courseDiscountPercent: number;
  courseDiscountAmount: number;
  priceAfterCourseDiscount: number;
  discountCode?: string;
  codeDiscountPercent: number;
  codeDiscountAmount: number;
  totalDiscount: number;
  total: number;
  vatRate: number;
  pricesIncludeVat: true;
  taxableAmount: number;
  vatAmount: number;
}

export interface CheckoutQuoteResult {
  course: { _id: string; title: string; thumbnail?: string; program?: string };
  quote: PriceQuote;
  alreadyEnrolled: boolean;
}

// With a code: an invalid one rejects with the backend's reason (e.g. "This
// discount code has expired"), readable as error.response.data.message.
export const getCheckoutQuote = async (courseId: string, code?: string): Promise<CheckoutQuoteResult> => {
  const res = await api.post("/learn/checkout/quote", code ? { courseId, code } : { courseId });
  if (!res.data?.success) throw new Error(res.data?.message || "Could not load the price");
  return res.data.data;
};
