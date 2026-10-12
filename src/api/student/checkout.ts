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
  // The course's own discount on offer, and whether the student applied it
  // ("Apply discount"); courseDiscountPercent/Amount are 0 until applied.
  courseDiscountAvailablePercent?: number;
  courseDiscountApplied?: boolean;
}

export interface CheckoutQuoteResult {
  course: {
    _id: string;
    title: string;
    thumbnail?: string;
    program?: string;
    discountPercent?: number;
    discountReason?: string | null; // shown in the "Apply discount" popup
  };
  quote: PriceQuote;
  alreadyEnrolled: boolean;
}

// code = a promo code: an invalid one rejects with the backend's reason
// (e.g. "This promo code has expired"), readable as
// error.response.data.message. applyDiscount: the student applied the
// course's own discount (it isn't in the price otherwise).
export const getCheckoutQuote = async (courseId: string, code?: string, applyDiscount?: boolean): Promise<CheckoutQuoteResult> => {
  const res = await api.post("/learn/checkout/quote", {
    courseId,
    ...(code ? { code } : {}),
    ...(applyDiscount ? { applyDiscount: true } : {}),
  });
  if (!res.data?.success) throw new Error(res.data?.message || "Could not load the price");
  return res.data.data;
};
