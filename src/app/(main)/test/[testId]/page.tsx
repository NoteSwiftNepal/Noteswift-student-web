"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { getTestDetails, startTestAttempt, submitTest, type SubmitAnswer } from "@/api/student/test";
import { useTestStore, getElapsedSeconds } from "@/stores/testStore";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoutePlaceholder } from "@/components/route-placeholder";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { McqQuestion } from "@/components/test/mcq-question";
import { SubjectiveQuestion } from "@/components/test/subjective-question";
import { QuestionNavigator } from "@/components/test/question-navigator";

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function TestAttemptPage() {
  const params = useParams<{ testId: string }>();
  const testId = params.testId;
  const router = useRouter();
  const queryClient = useQueryClient();

  const store = useTestStore();
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const hydratedRef = useRef(false);

  const { data: testDetail, isPending, error } = useQuery({
    queryKey: ["test-detail", testId],
    queryFn: async () => {
      const res = await getTestDetails(testId);
      if (res.error) throw new Error(res.message);
      return res.result;
    },
  });

  // Resume an in-progress attempt (GET already returns attemptInfo) without
  // clobbering answers the student has edited this session.
  useEffect(() => {
    if (!testDetail?.attemptInfo || hydratedRef.current || store.testId === testId) return;
    hydratedRef.current = true;
    const remaining = testDetail.duration * 60 - testDetail.attemptInfo.timeSpent;
    useTestStore.setState({
      testId,
      attemptId: testDetail.attemptInfo.attemptId,
      currentQuestionIndex: 0,
      answers: Object.fromEntries(
        testDetail.attemptInfo.answers.map((a) => [a.questionNumber, String(a.answer)])
      ),
      timeRemaining: Math.max(0, remaining),
      startedAt: Date.now() - testDetail.attemptInfo.timeSpent * 1000,
    });
  }, [testDetail, testId, store.testId]);

  const startMutation = useMutation({
    mutationFn: () => startTestAttempt(testId),
    onSuccess: (res) => {
      if (res.error) {
        toast({ title: "Couldn't start test", description: res.message, variant: "destructive" });
        return;
      }
      store.startAttempt(testId, res.result.attemptId, (testDetail?.duration ?? 0) * 60);
    },
    onError: () => toast({ title: "Couldn't start test", description: "Please try again.", variant: "destructive" }),
  });

  const submitMutation = useMutation({
    mutationFn: (answers: SubmitAnswer[]) =>
      submitTest(testId, { answers, timeSpent: getElapsedSeconds() }),
    onSuccess: (res) => {
      if (res.error) {
        toast({ title: "Submission failed", description: res.message, variant: "destructive" });
        return;
      }
      const attemptId = res.result.attemptId;
      store.reset();
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast({ title: "Test submitted", description: res.result.message });
      router.replace(`/test/${testId}/result/${attemptId}`);
    },
    onError: () =>
      toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" }),
  });

  const buildAnswers = (): SubmitAnswer[] =>
    Object.entries(store.answers).map(([questionNumber, answer]) => ({
      questionNumber: Number(questionNumber),
      answer,
    }));

  const handleSubmit = () => {
    setShowSubmitConfirm(false);
    submitMutation.mutate(buildAnswers());
  };

  // Countdown + auto-submit at zero.
  useEffect(() => {
    if (store.testId !== testId || store.timeRemaining <= 0 || submitMutation.isPending) return;
    const interval = setInterval(() => {
      const remaining = useTestStore.getState().timeRemaining;
      if (remaining <= 1) {
        useTestStore.setState({ timeRemaining: 0 });
        clearInterval(interval);
        submitMutation.mutate(buildAnswers());
        return;
      }
      store.tick();
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.testId, testId, submitMutation.isPending]);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !testDetail) {
    return <RoutePlaceholder title="Test not found" />;
  }

  const isActive = store.testId === testId;

  if (!isActive) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{testDetail.title}</h1>
          <p className="text-sm text-muted-foreground">
            {testDetail.courseName} &middot; {testDetail.subjectName}
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-5">
            {testDetail.description && (
              <p className="text-sm text-muted-foreground">{testDetail.description}</p>
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-semibold text-foreground">{testDetail.duration} minutes</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Questions</dt>
                <dd className="font-semibold text-foreground">{testDetail.totalQuestions}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total marks</dt>
                <dd className="font-semibold text-foreground">{testDetail.totalMarks}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-semibold uppercase text-foreground">{testDetail.type}</dd>
              </div>
            </dl>
            {testDetail.instructions && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Instructions</p>
                <p className="mt-1 text-sm text-foreground">{testDetail.instructions}</p>
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? "Starting..." : "Start test"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = testDetail.questions ?? [];
  const currentQuestion = questions[store.currentQuestionIndex];
  const answeredQuestionNumbers = new Set(Object.keys(store.answers).map(Number));
  const timeCritical = store.timeRemaining <= 60;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{testDetail.title}</h1>
          <p className="text-xs text-muted-foreground">
            Question {store.currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <div
          className={
            timeCritical
              ? "flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm font-bold text-destructive"
              : "flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-bold text-foreground"
          }
        >
          <Clock className="size-4" />
          {formatTime(store.timeRemaining)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <Card>
          <CardContent className="p-5">
            {currentQuestion ? (
              testDetail.type === "mcq" ? (
                <McqQuestion
                  question={currentQuestion}
                  selectedLetter={store.answers[currentQuestion.questionNumber]}
                  onSelect={(letter) => store.setAnswer(currentQuestion.questionNumber, letter)}
                />
              ) : (
                <SubjectiveQuestion
                  testId={testId}
                  question={currentQuestion}
                  uploadedUrl={store.answers[currentQuestion.questionNumber]}
                  onUploaded={(url) => store.setAnswer(currentQuestion.questionNumber, url)}
                />
              )
            ) : (
              <p className="text-sm text-muted-foreground">No questions available.</p>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={store.currentQuestionIndex === 0}
                onClick={() => store.goToQuestion(store.currentQuestionIndex - 1)}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              {store.currentQuestionIndex < questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => store.goToQuestion(store.currentQuestionIndex + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => setShowSubmitConfirm(true)} disabled={submitMutation.isPending}>
                  Submit test
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {answeredQuestionNumbers.size} of {questions.length} answered
              </p>
              <QuestionNavigator
                totalQuestions={questions.length}
                currentIndex={store.currentQuestionIndex}
                answeredQuestionNumbers={answeredQuestionNumbers}
                onSelect={store.goToQuestion}
              />
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? "Submitting..." : "Submit test"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit test?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve answered {answeredQuestionNumbers.size} of {questions.length} questions.
              You won&apos;t be able to change your answers after submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep reviewing</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
