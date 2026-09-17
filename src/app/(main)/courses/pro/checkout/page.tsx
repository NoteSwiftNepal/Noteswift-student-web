"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, CreditCard, Smartphone, Wallet } from "lucide-react";
import { useCourses } from "@/hooks/queries/useCourses";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RoutePlaceholder } from "@/components/route-placeholder";

const PAYMENT_METHODS = [
  { id: "khalti", name: "Khalti", icon: Smartphone },
  { id: "esewa", name: "eSewa", icon: Wallet },
  { id: "card", name: "Credit/Debit Card", icon: CreditCard },
];

// Mirrors mobile's Home/ProCheckout.tsx: a package review + payment-method
// picker that isn't wired to a real payment gateway — mobile's own
// handleConfirm() just navigates to ProDashboard with the selection as
// params, no backend call. Kept the same scope here rather than inventing a
// real checkout flow the mobile app doesn't have (blueprint's Phase 2
// prompt explicitly asks not to).
function ProCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const { courses, coursesLoading } = useCourses();
  const [paymentMethod, setPaymentMethod] = useState("khalti");
  const [confirming, setConfirming] = useState(false);

  const course = useMemo(
    () => courses.find((c) => c._id === courseId),
    [courses, courseId]
  );

  if (coursesLoading) {
    return <Skeleton className="h-64 w-full max-w-lg rounded-xl" />;
  }

  if (!courseId || !course) {
    return <RoutePlaceholder title="Select a Pro course to check out" />;
  }

  const handleConfirm = () => {
    setConfirming(true);
    toast({
      title: "Checkout is a preview",
      description:
        "Payment isn't wired up yet — this mirrors the mobile app's current checkout, which also doesn't call a real payment gateway.",
    });
    setTimeout(() => {
      router.push("/pro-dashboard");
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
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
          <p className="text-sm text-muted-foreground">Review your Pro package and pay.</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2 p-5">
          <p className="text-sm font-bold text-foreground">{course.title}</p>
          <p className="text-xs text-muted-foreground">{course.program}</p>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold text-foreground">
              {course.price ? `Rs. ${course.price}` : "Free"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 text-sm font-bold text-foreground">Payment method</h2>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="gap-3">
            {PAYMENT_METHODS.map((method) => (
              <Label
                key={method.id}
                htmlFor={method.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-[[data-state=checked]]:border-primary"
              >
                <RadioGroupItem value={method.id} id={method.id} />
                <method.icon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{method.name}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleConfirm} disabled={confirming}>
        {confirming ? "Confirming..." : "Confirm and pay"}
      </Button>
    </div>
  );
}

export default function ProCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <ProCheckoutContent />
    </Suspense>
  );
}
