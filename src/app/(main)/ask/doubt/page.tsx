"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, GraduationCap, ImagePlus, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEnrollments } from "@/hooks/queries/useEnrollments";
import { useCourseTeachers } from "@/hooks/queries/useCourseTeachers";
import { resolveCourse } from "@/lib/course";
import { createQuestion } from "@/api/student/questions";
import { uploadImageAndGetAttachment } from "@/lib/uploadImage";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import type { QuestionAttachment } from "@/types/question";

function AskDoubtContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { enrollments } = useEnrollments(userId);
  const courses = useMemo(
    () => enrollments.map((e) => resolveCourse(e.courseId)).filter((c): c is NonNullable<typeof c> => !!c),
    [enrollments]
  );

  const prefillCourseId = searchParams.get("courseId") ?? "";
  const prefillSubject = searchParams.get("subjectName") ?? "";
  const prefillModuleNumber = searchParams.get("moduleNumber");
  const prefillModuleName = searchParams.get("moduleName") ?? "";

  const [courseId, setCourseId] = useState(prefillCourseId || courses[0]?._id || "");
  const [subjectName, setSubjectName] = useState(prefillSubject);
  const [title, setTitle] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachment, setAttachment] = useState<QuestionAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const selectedCourse = courses.find((c) => c._id === courseId);
  const subjects = selectedCourse?.subjects ?? [];
  const { courseTeachers } = useCourseTeachers(courseId || undefined);
  const assignedTeacher = courseTeachers.find((s) => s.subjectName === subjectName)?.teacher ?? null;

  const submitMutation = useMutation({
    mutationFn: () =>
      createQuestion({
        title: title.trim(),
        questionText: questionText.trim(),
        courseId,
        subjectName,
        moduleNumber: prefillModuleNumber ? Number(prefillModuleNumber) : undefined,
        moduleName: prefillModuleName || undefined,
        isAnonymous,
        isPublic: true,
        attachments: attachment ? [attachment] : undefined,
      }),
    onSuccess: (res) => {
      if (res.error) {
        toast({ title: "Couldn't submit", description: res.message, variant: "destructive" });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Doubt submitted", description: "Teachers will respond soon." });
      router.push("/ask/questions");
    },
    onError: () => toast({ title: "Couldn't submit", description: "Please try again.", variant: "destructive" }),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadImageAndGetAttachment(file);
      setAttachment(uploaded);
    } catch {
      toast({ title: "Upload failed", description: "Please try a different image.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!title.trim() || !questionText.trim() || !courseId || !subjectName) {
      toast({ title: "Missing details", description: "Fill in title, description, course and subject.", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  const titleError = submitAttempted && !title.trim();
  const questionTextError = submitAttempted && !questionText.trim();
  const courseError = submitAttempted && !courseId;
  const subjectError = submitAttempted && !subjectName;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back button shares a row with the heading (matches the pattern
          established on every other Ask sub-page) rather than floating
          alone above it. */}
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
        <div className="min-w-0">
          <h1 className="text-h1 text-foreground">Ask a Doubt</h1>
          <p className="text-body text-muted-foreground">Post a question — the assigned teacher gets notified.</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No enrolled courses yet"
          description="Enroll in a course to ask your teachers a question."
          action={{ label: "Browse courses", onClick: () => router.push("/courses") }}
        />
      ) : (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Select value={courseId} onValueChange={(v) => { setCourseId(v); setSubjectName(""); }}>
                    <SelectTrigger id="course" className={cn(courseError && "border-destructive")}>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {courseError && <p className="text-caption text-destructive">Select a course.</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={subjectName} onValueChange={setSubjectName} disabled={!courseId}>
                    <SelectTrigger id="subject" className={cn(subjectError && "border-destructive")}>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.name} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {subjectError && <p className="text-caption text-destructive">Select a subject.</p>}
                </div>
              </div>

              {subjectName && (
                <p className="text-caption text-muted-foreground">
                  {assignedTeacher ? `Will be sent to ${assignedTeacher.name}` : "No teacher assigned to this subject yet."}
                </p>
              )}

              {prefillModuleName && (
                <p className="text-caption text-muted-foreground">
                  About chapter: <span className="font-medium text-foreground">{prefillModuleName}</span>
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short summary of your doubt"
                  className={cn(titleError && "border-destructive focus-visible:ring-destructive")}
                />
                {titleError && <p className="text-caption text-destructive">A title is required.</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionText">Description</Label>
                <Textarea
                  id="questionText"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Describe your doubt in detail..."
                  rows={5}
                  className={cn(questionTextError && "border-destructive focus-visible:ring-destructive")}
                />
                {questionTextError && <p className="text-caption text-destructive">A description is required.</p>}
              </div>

              <div className="space-y-2">
                <Label>Attach an image (optional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {attachment ? (
                  <div className="flex items-center gap-3 rounded-md border border-border p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={attachment.url} alt={attachment.name} className="size-16 rounded-sm object-cover" />
                    <span className="flex-1 truncate text-caption text-muted-foreground">{attachment.name}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setAttachment(null)} aria-label="Remove attachment">
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <ImagePlus className="size-4" />
                    {uploading ? "Uploading..." : "Add image"}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(v) => setIsAnonymous(!!v)} />
                <Label htmlFor="anonymous" className="text-body font-normal">
                  Post anonymously
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={submitMutation.isPending || uploading}>
                {submitMutation.isPending ? "Submitting..." : "Submit doubt"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AskDoubtPage() {
  return (
    <Suspense fallback={null}>
      <AskDoubtContent />
    </Suspense>
  );
}
