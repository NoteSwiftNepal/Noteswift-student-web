"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, ChevronLeft, Loader2, RefreshCw, TicketPercent, X } from "lucide-react";
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
  // Discount code: applied only once the backend accepts it (the quote with
  // the code succeeds); Fonepay initiate re-validates it again server-side.
  const queryClient = useQueryClient();
  const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const applyCodeMutation = useMutation({
    mutationFn: (code: string) => getCheckoutQuote(courseId, code),
    onSuccess: (data, code) => {
      queryClient.setQueryData(["checkout-quote", courseId, code], data);
      setAppliedCode(code);
      setCodeError(null);
      setCodeInput("");
    },
    onError: (err: any) => {
      setCodeError(err?.response?.data?.message || err?.message || "This code can't be applied.");
    },
  });

  const quoteQuery = useQuery({
    queryKey: ["checkout-quote", courseId, appliedCode],
    queryFn: () => getCheckoutQuote(courseId, appliedCode),
    enabled: !!courseId && !!course && !isEnrolled && (course?.price ?? 0) > 0,
    retry: 1,
  });
  const quote = quoteQuery.data?.quote;

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
              <button
                type="button"
                onClick={() => setCodeOpen((v) => !v)}
                className="flex w-full items-center justify-between text-left"
                aria-expanded={codeOpen || !!appliedCode}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <TicketPercent className="size-4" />
                  Use discount code
                </span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${codeOpen || appliedCode ? "rotate-180" : ""}`} />
              </button>

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
                    aria-label="Remove discount code"
                    onClick={() => {
                      setAppliedCode(undefined);
                      setCodeError(null);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                codeOpen && (
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
                        placeholder="Enter discount code"
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
      />
    </div>
  );
}

// Breakdown in the order the backend computes it: list price, course
// discount, (code discount), total; then the VAT split of that total.
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
        row(`Code ${quote.discountCode ?? ""} (${quote.codeDiscountPercent}%)`, `− ${money(quote.codeDiscountAmount)}`, { accent: true })}
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
