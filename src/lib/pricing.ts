// Display-only price helpers for course cards and the course page. Same
// rounding as the backend's pricingService (discount rounded to whole
// rupees); the checkout page always shows the backend's own quote instead.
export function hasDiscount(course: { price?: number; discountPercent?: number }): boolean {
  const p = course.discountPercent ?? 0;
  return (course.price ?? 0) > 0 && p > 0 && p < 100;
}

export function discountedPrice(course: { price?: number; discountPercent?: number }): number {
  const price = course.price ?? 0;
  if (!hasDiscount(course)) return price;
  return price - Math.round((price * (course.discountPercent ?? 0)) / 100);
}

export function formatRs(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 })}`;
}
