"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCourses } from "@/hooks/queries/useCourses";
import { useEnrollments, useInvalidateCourseAccess } from "@/hooks/queries/useEnrollments";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { redeemUnlockCode } from "@/api/student/learn";
import { resolveCourse } from "@/lib/course";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoutePlaceholder } from "@/components/route-placeholder";
import { FonepayCheckout } from "@/components/checkout/FonepayCheckout";
import { FonepayLogo } from "@/components/checkout/FonepayLogo";

export default function CourseCheckoutPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const invalidateCourseAccess = useInvalidateCourseAccess(userId);
  const { selectCourse } = useSelectedCourse();

  const { courses, coursesLoading } = useCourses();
  const course = courses.find((c) => c._id === courseId);

  const { enrollments } = useEnrollments(userId);
  const isEnrolled = enrollments.some((e) => (resolveCourse(e.courseId)?._id ?? e.courseId) === courseId);

  const [unlockCode, setUnlockCode] = useState("");
  const [fonepayOpen, setFonepayOpen] = useState(false);

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
          <p className="text-sm text-muted-foreground">Get access to {course.title}.</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2 p-5">
          <p className="text-sm font-bold text-foreground">{course.title}</p>
          {course.program && <p className="text-xs text-muted-foreground">{course.program}</p>}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold text-foreground">
              {course.price ? `Rs. ${course.price}` : "Free"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="text-xs text-muted-foreground">
            Scan a QR or pay directly from your bank app.
          </p>
          <button
            type="button"
            onClick={() => setFonepayOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary"
          >
            <FonepayLogo variant="mark" height={22} />
            <span className="ml-auto text-xs font-medium text-muted-foreground">Select</span>
          </button>
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

      <FonepayCheckout
        open={fonepayOpen}
        onOpenChange={setFonepayOpen}
        courseId={courseId}
        courseTitle={course.title}
        onEnrolled={onGrantedAccess}
      />
    </div>
  );
}
