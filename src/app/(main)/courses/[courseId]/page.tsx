"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Clock, Star } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCourses } from "@/hooks/queries/useCourses";
import { useEnrollments, useTrials, useInvalidateCourseAccess } from "@/hooks/queries/useEnrollments";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { enrollInCourse, startFreeTrial } from "@/api/student/courses";
import { redeemUnlockCode } from "@/api/student/learn";
import { resolveCourse, getCourseId, courseTypeBadgeClasses } from "@/lib/course";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RoutePlaceholder } from "@/components/route-placeholder";

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const invalidateCourseAccess = useInvalidateCourseAccess(userId);

  // The full Course object (price, rating, FAQ, syllabus, learningPoints)
  // comes from the same /courses list this app already caches — mirrors
  // mobile's PackageDetails, which receives the full course object via
  // navigation params rather than re-fetching it. /courses/:id/content
  // returns a differently-shaped, trimmed projection meant for the Learn
  // feature's subject/module browsing (Phase 3), not a marketing/detail
  // view — confirmed against courseContentController.ts; using it here
  // silently dropped price, rating, FAQ, syllabus, and learningPoints.
  const { courses, coursesLoading } = useCourses();
  const course = courses.find((c) => c._id === courseId);
  const isPending = coursesLoading;
  const error = !coursesLoading && !course ? new Error("Course not found") : null;

  const { enrollments } = useEnrollments(userId);
  const { trials } = useTrials(userId);
  // /learn now always operates on whatever course is currently selected
  // (useSelectedCourse, backed by Student.selectedCourseId) rather than
  // taking a courseId in the URL — so gaining access to a course here needs
  // to explicitly make it the selected one before navigating there, or the
  // student would land on whatever course they'd selected previously
  // instead of the one they just unlocked.
  const { selectCourse } = useSelectedCourse();

  const isEnrolled = enrollments.some((e) => (resolveCourse(e.courseId)?._id ?? e.courseId) === courseId);
  const isOnTrial = trials.some((t) => (resolveCourse(t.courseId)?._id ?? t.courseId) === courseId);

  const [unlockCode, setUnlockCode] = useState("");

  const enrollMutation = useMutation({
    mutationFn: () => enrollInCourse(courseId),
    onSuccess: (res) => {
      if (!res.success) {
        toast({ title: "Enrollment failed", description: res.message, variant: "destructive" });
        return;
      }
      invalidateCourseAccess();
      toast({ title: "Enrolled!", description: `You're now enrolled in ${course?.title}.` });
      selectCourse(courseId);
      router.push("/learn");
    },
    onError: (err: any) => {
      toast({
        title: "Enrollment failed",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const trialMutation = useMutation({
    mutationFn: () => startFreeTrial(courseId),
    onSuccess: (res) => {
      if (!res.success) {
        toast({ title: "Couldn't start trial", description: res.message, variant: "destructive" });
        return;
      }
      invalidateCourseAccess();
      toast({ title: "Free trial started!", description: "You now have 3 days to explore this course." });
      selectCourse(courseId);
      router.push("/learn");
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't start trial",
        description: err?.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const redeemMutation = useMutation({
    mutationFn: () => redeemUnlockCode(unlockCode.trim(), courseId),
    onSuccess: (res) => {
      if (!res.success) {
        toast({ title: "Invalid code", description: res.message, variant: "destructive" });
        return;
      }
      invalidateCourseAccess();
      setUnlockCode("");
      toast({ title: "Code redeemed!", description: "You are now enrolled in this course." });
      selectCourse(courseId);
      router.push("/learn");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to redeem code",
        description: err?.response?.data?.message || "Please check your code and try again.",
        variant: "destructive",
      });
    },
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (error || !course) {
    return <RoutePlaceholder title="Course not found" />;
  }

  const isFree = !course.price || course.price === 0;
  const id = getCourseId(course);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-secondary/40">
          {course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="size-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {course.type && (
              <Badge className={cn("capitalize", courseTypeBadgeClasses(course.type))}>
                {course.type}
              </Badge>
            )}
            {course.program && <Badge variant="outline">{course.program}</Badge>}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {course.rating ? (
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {course.rating.toFixed(1)} ({course.enrolledCount ?? 0} enrolled)
              </span>
            ) : null}
            {course.duration && (
              <span className="flex items-center gap-1">
                <Clock className="size-4" />
                {course.duration}
              </span>
            )}
            <span>By {course.offeredBy || "NoteSwift"}</span>
          </div>
        </div>

        {course.learningPoints && course.learningPoints.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 text-sm font-bold text-foreground">What you&apos;ll learn</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {course.learningPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {course.subjects && course.subjects.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 text-sm font-bold text-foreground">Syllabus</h2>
              <Accordion type="single" collapsible>
                {course.subjects.map((subject, i) => (
                  <AccordionItem key={i} value={`subject-${i}`}>
                    <AccordionTrigger>{subject.name}</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1.5">
                        {(subject.modules ?? []).map((mod, j) => (
                          <li key={j} className="text-sm text-muted-foreground">
                            {mod.name}
                            {mod.duration && (
                              <span className="text-xs"> &middot; {mod.duration}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {course.faq && course.faq.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 text-sm font-bold text-foreground">FAQ</h2>
              <Accordion type="single" collapsible>
                {course.faq.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enroll / trial / unlock-code sidebar */}
      <aside className="h-fit space-y-4 lg:sticky lg:top-6">
        <Card>
          <CardContent className="space-y-4 p-5">
            <p className="text-2xl font-bold text-foreground">
              {isFree ? "Free" : `Rs. ${course.price}`}
            </p>

            {isEnrolled ? (
              <Button className="w-full" disabled>
                Already enrolled
              </Button>
            ) : (
              <>
                <Button
                  className="w-full"
                  onClick={() =>
                    isFree ? enrollMutation.mutate() : router.push(`/courses/${courseId}/checkout`)
                  }
                  disabled={enrollMutation.isPending}
                >
                  {enrollMutation.isPending ? "Enrolling..." : "Enroll now"}
                </Button>

                {!isOnTrial && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => trialMutation.mutate()}
                    disabled={trialMutation.isPending}
                  >
                    {trialMutation.isPending ? "Starting trial..." : "Start 3-day free trial"}
                  </Button>
                )}
                {isOnTrial && (
                  <p className="text-center text-xs text-muted-foreground">
                    You&apos;re currently on a free trial of this course.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {!isEnrolled && (
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
        )}
      </aside>
    </div>
  );
}
