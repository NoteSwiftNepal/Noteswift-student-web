"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { getTestResults } from "@/api/student/test";
import { LatexText } from "@/components/latex-preview";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RoutePlaceholder } from "@/components/route-placeholder";

export default function TestResultPage() {
  const params = useParams<{ testId: string; attemptId: string }>();

  const { data, isPending } = useQuery({
    queryKey: ["test-results", params.testId, params.attemptId],
    queryFn: async () => {
      const res = await getTestResults(params.testId, params.attemptId);
      return res;
    },
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!data || data.error) {
    // "Results not available yet" (clientError) is a normal, expected state
    // — the teacher hasn't graded a subjective test, or showResultsImmediately
    // is off — not a fetch failure.
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
          <Hourglass className="size-10 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Results not available yet</p>
          <p className="text-sm text-muted-foreground">
            {data?.message ?? "Check back once your test has been graded."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { test, attempt } = data.result;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{test.title}</h1>
        <p className="text-sm text-muted-foreground">Attempt {attempt.attemptNumber}</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-3xl font-bold text-foreground">
              {attempt.totalScore}
              <span className="text-base font-normal text-muted-foreground"> / {test.totalMarks}</span>
            </p>
            <p className="text-sm text-muted-foreground">{Math.round(attempt.percentage)}%</p>
          </div>
          <Badge
            className={
              attempt.passed
                ? "gap-1 bg-green-100 text-green-700 hover:bg-green-100"
                : "gap-1 bg-red-100 text-red-700 hover:bg-red-100"
            }
          >
            {attempt.passed ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
            {attempt.passed ? "Passed" : "Not passed"}
          </Badge>
        </CardContent>
      </Card>

      {attempt.status !== "evaluated" && test.type === "subjective" && (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            This subjective test is graded manually — marks/feedback below will update once your
            teacher finishes grading.
          </CardContent>
        </Card>
      )}

      {attempt.answers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Answer review</h2>
          {attempt.answers.map((answer) => (
            <Card key={answer.questionNumber}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    <span className="text-muted-foreground">Q{answer.questionNumber}. </span>
                    <LatexText content={answer.question} hasLatex={answer.hasLatex} />
                  </p>
                  {answer.isCorrect !== undefined && (
                    <Badge
                      className={
                        answer.isCorrect
                          ? "shrink-0 gap-1 bg-green-100 text-green-700 hover:bg-green-100"
                          : "shrink-0 gap-1 bg-red-100 text-red-700 hover:bg-red-100"
                      }
                    >
                      {answer.isCorrect ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <XCircle className="size-3" />
                      )}
                      {answer.isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  )}
                </div>

                {test.type === "mcq" ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Your answer: </span>
                      {answer.selectedOptionText ? (
                        <LatexText content={answer.selectedOptionText} hasLatex={answer.hasLatex} />
                      ) : (
                        <span className="text-muted-foreground">Not answered</span>
                      )}
                    </p>
                    {!answer.isCorrect && answer.correctOptionText && (
                      <p>
                        <span className="text-muted-foreground">Correct answer: </span>
                        <LatexText content={answer.correctOptionText} hasLatex={answer.hasLatex} />
                      </p>
                    )}
                    {answer.explanation && (
                      <p className="text-muted-foreground">
                        <LatexText content={answer.explanation} hasLatex={answer.hasLatex} />
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {answer.submittedImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={answer.submittedImageUrl}
                        alt={`Submitted answer for question ${answer.questionNumber}`}
                        className="max-h-64 rounded-lg border border-border"
                      />
                    )}
                    <p className="text-muted-foreground">
                      {answer.marksAwarded !== undefined
                        ? `${answer.marksAwarded} / ${answer.maxMarks} marks`
                        : "Not yet graded"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
