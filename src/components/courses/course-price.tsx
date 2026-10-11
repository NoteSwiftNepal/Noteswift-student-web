import { discountedPrice, formatRs, hasDiscount } from "@/lib/pricing";
import { cn } from "@/lib/utils";

// Price with the admin discount applied: "Rs. 3,600  Rs. 4,500  20% off".
export function CoursePrice({
  course,
  className,
}: {
  course: { price?: number; discountPercent?: number };
  className?: string;
}) {
  if (!course.price) return <span className={cn("text-green-700", className)}>Free</span>;
  if (!hasDiscount(course)) return <span className={className}>{formatRs(course.price)}</span>;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span>{formatRs(discountedPrice(course))}</span>
      <span className="text-sm font-normal text-muted-foreground line-through">{formatRs(course.price)}</span>
      <span className="text-xs font-semibold text-green-700">{course.discountPercent}% off</span>
    </span>
  );
}
