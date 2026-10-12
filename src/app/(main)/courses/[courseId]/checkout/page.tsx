"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgePercent, Check, CheckCircle2, ChevronDown, ChevronLeft, Loader2, RefreshCw, TicketPercent, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCourses } from "@/hooks/queries/useCourses";
import { useEnrollments, useInvalidateCourseAccess } from "@/hooks/queries/useEnrollments";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { useTrackCourseLead } from "@/hooks/useTrackCourseLead";
import { redeemUnlockCode } from "@/api/student/learn";
import { getCheckoutQuote, type PriceQuote } from "@/api/student/checkout";
import { formatRs } from "@/lib/pricing";
import { resolveCourse } from "@/lib/course";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { FonepayCheckout } from "@/components/checkout/FonepayCheckout";
import { FonepayLogo } from "@/components/checkout/FonepayLogo";
import { clearFonepayAttempt, hasResumableFonepayAttempt } from "@/hooks/useFonepayCheckout";

export default function CourseCheckoutPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  useTrackCourseLead(courseId, "checkout");
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const invalidateCourseAccess = useInvalidateCourseAccess(userId);
  const { selectCourse } = useSelectedCourse();

  const { courses, coursesLoading } = useCourses();
  const course = courses.find((c) => c._id === courseId);

  const { enrollments } = useEnrollments(userId);
  const isEnrolled = enrollments.some((e) => (resolveCourse(e.courseId)?._id ?? e.courseId) === courseId);

  // The breakdown shown here is the backend's quote; Fonepay initiate
  // recomputes it and charges the same total.
  // Promo code: applied only once the backend accepts it (the quote with
  // the code succeeds); Fonepay initiate re-validates it again server-side.
  // Course discount (admin-set): NOT in the price until the student opens
  // "Apply discount", reads why it's given and presses Apply (owner's
  // decision, 2026-10-12); the backend only discounts with applyDiscount.
  const queryClient = useQueryClient();
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const applyCodeMutation = useMutation({
    mutationFn: (code: string) => getCheckoutQuote(courseId, code, discountApplied),
    onSuccess: (data, code) => {
      queryClient.setQueryData(["checkout-quote", courseId, code, discountApplied], data);
      setAppliedCode(code);
      setCodeError(null);
      setCodeInput("");
    },
    onError: (err: any) => {
      setCodeError(err?.response?.data?.message || err?.message || "This promo code can't be applied.");
    },
  });

  const quoteQuery = useQuery({
    queryKey: ["checkout-quote", courseId, appliedCode, discountApplied],
    queryFn: () => getCheckoutQuote(courseId, appliedCode, discountApplied),
    enabled: !!courseId && !!course && !isEnrolled && (course?.price ?? 0) > 0,
    retry: 1,
  });
  const quote = quoteQuery.data?.quote;
  // The course discount on offer (from the quote, else the course list).
  const offeredDiscount = quote?.courseDiscountAvailablePercent ?? course?.discountPercent ?? 0;
  const discountReason = quoteQuery.data?.course?.discountReason;
  const listPrice = quote?.listPrice ?? course?.price ?? 0;
  // Same rounding as the backend (whole rupees), for the popup's preview.
  const offeredSaving = Math.round((listPrice * offeredDiscount) / 100);

  const [unlockCode, setUnlockCode] = useState("");
  const [fonepayOpen, setFonepayOpen] = useState(false);

  // Returning from a bank app often reloads this page (mobile browsers drop
  // backgrounded tabs) — reopen the dialog so the stored attempt gets
  // verified instead of silently forgotten. If the student is already
  // enrolled (e.g. the backend sweep enrolled them), the attempt is done.
  useEffect(() => {
    if (!userId) return;
    if (isEnrolled) {
      clearFonepayAttempt(userId, courseId);
    } else if (hasResumableFonepayAttempt(userId, courseId)) {
      setFonepayOpen(true);
    }
  }, [userId, courseId, isEnrolled]);

  const onGrantedAccess = () => {
    invalidateCourseAccess();
    selectCourse(courseId);
    router.push("/learn");
  };

  const redeemMutation = useMutation({
    mutationFn: () => redeemUnlockCode(unlockCode.trim(), courseId),
    onSuccess: (res) => {
      if (!res.success) {
        toast({ title: "Invalid code", description: res.message, variant: "destructive" });
        return;
      }
      setUnlockCode("");
      toast({ title: "Code redeemed!", description: "You are now enrolled in this course." });
      onGrantedAccess();
    },
    onError: (err: any) => {
      toast({
        title: "Failed to redeem code",
        description: err?.response?.data?.message || "Please check your code and try again.",
        variant: "destructive",
      });
    },
  });

  if (coursesLoading) {
    return <Skeleton className="mx-auto h-72 w-full max-w-lg rounded-xl" />;
  }

  if (!course) {
    return <RoutePlaceholder title="Course not found" />;
  }

  if (isEnrolled) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
        <p className="text-sm font-medium text-foreground">
          You&apos;re already enrolled in {course.title}.
        </p>
        <Button onClick={() => router.push("/learn")}>Go to Learn</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
          <p className="text-sm text-muted-foreground">Get access to {course.title}.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: what's being bought, and the unlock-code alternative */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-5">
              <h2 className="text-base font-semibold text-foreground">Purchase summary</h2>
              <div className="flex items-center gap-4">
                {course.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnail} alt="" className="h-20 w-32 shrink-0 rounded-md border object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{course.title}</p>
                  {course.program && <p className="text-xs text-muted-foreground">{course.program}</p>}
                </div>
                <p className="shrink-0 text-lg font-bold text-foreground">
                  {course.price ? formatRs(course.price) : "Free"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              {/* Either a promo code or the course discount, never both
                  (the backend refuses the combination too). Equal halves;
                  while one is in use the other is disabled. */}
              <div className={`grid gap-3 ${offeredDiscount > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-11 justify-center gap-2 ${appliedCode ? "border-green-600/50 text-green-700" : "text-primary"}`}
                  disabled={discountApplied}
                  onClick={() => setCodeOpen((v) => !v)}
                  aria-expanded={codeOpen || !!appliedCode}
                >
                  {appliedCode ? <Check className="size-4" /> : <TicketPercent className="size-4" />}
                  {appliedCode ? "Promo code applied" : "Use promo code"}
                  {!appliedCode && <ChevronDown className={`size-4 transition-transform ${codeOpen ? "rotate-180" : ""}`} />}
                </Button>
                {offeredDiscount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-11 justify-center gap-2 ${discountApplied ? "border-green-600/50 text-green-700" : "text-primary"}`}
                    disabled={!!appliedCode}
                    onClick={() => setDiscountOpen(true)}
                  >
                    {discountApplied ? <Check className="size-4" /> : <BadgePercent className="size-4" />}
                    {discountApplied ? "Discount applied" : "Apply discount"}
                  </Button>
                )}
              </div>
              {offeredDiscount > 0 && (appliedCode || discountApplied) && (
                <p className="text-xs text-muted-foreground">
                  You can use either a promo code or the course discount, not both.{" "}
                  {appliedCode ? "Remove the promo code to apply the discount." : "Remove the discount to use a promo code."}
                </p>
              )}

              {appliedCode && quote?.discountCode ? (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-green-600/50 bg-green-50 p-3 dark:bg-green-950/30">
                  <div className="shrink-0 rounded-md border border-green-600/40 px-3 py-2 text-center">
                    <p className="text-sm font-bold text-green-700">{quote.codeDiscountPercent}%</p>
                    <p className="text-[10px] text-green-700">OFF</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold text-foreground">{quote.discountCode}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="line-through">{formatRs(quote.priceAfterCourseDiscount)}</span>{" "}
                      <span className="font-semibold text-foreground">{formatRs(quote.total)}</span>
                      {" · "}
                      {formatRs(quote.codeDiscountAmount)} off
                    </p>
                  </div>
                  <span className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white">APPLIED</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove promo code"
                    onClick={() => {
                      setAppliedCode(undefined);
                      setCodeError(null);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                codeOpen && !discountApplied && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const code = codeInput.trim().toUpperCase();
                      if (code) applyCodeMutation.mutate(code);
                    }}
                    className="space-y-2"
                  >
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={codeInput}
                        onChange={(e) => {
                          setCodeInput(e.target.value);
                          setCodeError(null);
                        }}
                        className="font-mono uppercase"
                      />
                      <Button type="submit" disabled={applyCodeMutation.isPending || !codeInput.trim()}>
                        {applyCodeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                    {codeError && <p className="text-xs text-destructive">{codeError}</p>}
                  </form>
                )
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="text-sm font-bold text-foreground">Have an unlock code?</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (unlockCode.trim()) redeemMutation.mutate();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Enter code"
                  value={unlockCode}
                  onChange={(e) => setUnlockCode(e.target.value)}
                  className="uppercase"
                />
                <Button type="submit" variant="secondary" disabled={redeemMutation.isPending || !unlockCode.trim()}>
                  Redeem
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: the server's price breakdown, and Pay */}
        <Card className="h-fit lg:sticky lg:top-6">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-base font-semibold text-foreground">Order summary</h2>

            {quoteQuery.isPending ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : quoteQuery.isError || !quote ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-destructive">
                  {(quoteQuery.error as any)?.response?.data?.message || (quoteQuery.error as Error)?.message || "Couldn't load the price."}
                </p>
                <div className="flex justify-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => quoteQuery.refetch()}>
                    <RefreshCw className="size-3.5" />
                    Try again
                  </Button>
                  {appliedCode && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAppliedCode(undefined)}>
                      Remove code
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <OrderSummary title={course.title} quote={quote} />
            )}

            <button
              type="button"
              onClick={() => setFonepayOpen(true)}
              disabled={!quote}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {quoteQuery.isFetching && !quote ? <Loader2 className="size-4 animate-spin" /> : <FonepayLogo variant="mark" height={22} />}
              <span className="text-sm font-semibold text-foreground">
                {quote ? `Pay ${formatRs(quote.total)}` : "Pay"}
              </span>
            </button>
            <p className="text-center text-xs text-muted-foreground">Scan a QR or pay directly from your bank app.</p>
          </CardContent>
        </Card>
      </div>

      <FonepayCheckout
        open={fonepayOpen}
        onOpenChange={setFonepayOpen}
        courseId={courseId}
        courseTitle={quote ? `${course.title} · ${formatRs(quote.total)}` : course.title}
        onEnrolled={onGrantedAccess}
        discountCode={quote?.discountCode}
        applyDiscount={discountApplied}
      />

      {/* The course discount: why it's given, and Apply. Only after Apply is
          it in the order summary and the price. */}
      <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <BadgePercent className="size-5 text-green-700" />
              {offeredDiscount}% off this course
            </DialogTitle>
            <DialogDescription className="sr-only">Why this discount is given, and how much you save.</DialogDescription>
          </DialogHeader>
          {/* Saving on the left, the reason on the right. */}
          <div className="flex items-stretch gap-4">
            <div className="flex w-32 shrink-0 flex-col items-center justify-center rounded-xl border border-green-600/30 bg-green-50 px-3 py-4 text-center dark:bg-green-950/30">
              <span className="text-xl font-bold leading-tight text-green-700">{formatRs(offeredSaving)}</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-green-700">off</span>
              <span className="mt-1 text-[11px] text-muted-foreground line-through">{formatRs(listPrice)}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this discount</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{discountReason || "A special discount on this course."}</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {discountApplied && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDiscountApplied(false);
                  setDiscountOpen(false);
                }}
              >
                Remove discount
              </Button>
            )}
            <Button
              type="button"
              disabled={discountApplied}
              className={discountApplied ? "bg-green-600 text-white hover:bg-green-600 disabled:opacity-100" : ""}
              onClick={() => {
                setDiscountApplied(true);
                setTimeout(() => setDiscountOpen(false), 600);
              }}
            >
              {discountApplied ? (
                <>
                  <Check className="mr-1.5 size-4" /> Applied
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Breakdown in the order the backend computes it: list price, course
// discount (only once applied), (promo code), total; then the VAT split.
// Prices are VAT-inclusive, so taxable + VAT = total.
function OrderSummary({ title, quote }: { title: string; quote: PriceQuote }) {
  const money = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const row = (label: string, value: string, opts: { muted?: boolean; strong?: boolean; accent?: boolean } = {}) => (
    <div className={`flex items-baseline justify-between gap-3 text-sm ${opts.strong ? "font-semibold text-foreground" : ""}`}>
      <span className={opts.muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
      <span className={opts.accent ? "text-green-700" : "text-foreground"}>{value}</span>
    </div>
  );
  return (
    <div className="space-y-3">
      {row(title, money(quote.listPrice))}
      {row("Subtotal", money(quote.listPrice), { muted: true })}
      {quote.courseDiscountAmount > 0 &&
        row(`Discount (${quote.courseDiscountPercent}%)`, `− ${money(quote.courseDiscountAmount)}`, { accent: true })}
      {quote.codeDiscountAmount > 0 &&
        row(`Promo code ${quote.discountCode ?? ""} (${quote.codeDiscountPercent}%)`, `− ${money(quote.codeDiscountAmount)}`, { accent: true })}
      {quote.totalDiscount > 0 && row("Package after discount", money(quote.total))}
      <div className="border-t border-dashed border-border" />
      {row("Taxable amount", money(quote.taxableAmount), { muted: true })}
      {row(`VAT amount (${quote.vatRate}%)`, money(quote.vatAmount), { muted: true })}
      <div className="border-t border-border" />
      {row("Total amount", money(quote.total), { strong: true })}
      <p className="text-xs text-muted-foreground">Prices include VAT.</p>
    </div>
  );
}
