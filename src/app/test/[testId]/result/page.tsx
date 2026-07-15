"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  Award, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  BookOpen,
  HelpCircle,
  BarChart2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { api } from "@/services/api";
import { MockTest, TestAttempt } from "@/data/mockData";
import { LatexPreview } from "@/components/latex-preview";

interface ResultPageProps {
  params: Promise<{ testId: string }>;
}

function TestResultContent({ testId }: { testId: string }) {
  const [test, setTest] = useState<MockTest | null>(null);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      const listRes = await api.getTests();
      if (listRes.success && listRes.data) {
        // Find latest attempt for this test
        const foundAttempt = listRes.attempts?.filter(a => a.testId === testId).pop();
        if (foundAttempt) {
          const detailRes = await api.getTestResults(testId, foundAttempt.id);
          if (detailRes.success && detailRes.test && detailRes.attempt) {
            setTest(detailRes.test);
            setAttempt(detailRes.attempt);
          } else {
            // Fallback to basic list data if detail fetch fails
            const foundTest = listRes.data.find(t => t.id === testId);
            setTest(foundTest || null);
            setAttempt(foundAttempt);
          }
        } else {
          const foundTest = listRes.data.find(t => t.id === testId);
          setTest(foundTest || null);
        }
      }
    };
    loadResult();
  }, [testId]);

  if (!test) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground animate-pulse text-sm">
        Retrieving score sheet...
      </div>
    );
  }

  // If no attempt found, user might have navigated directly without taking test
  if (!attempt) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-6 text-center">
        <div className="text-gray-400">📝</div>
        <h3 className="text-base font-extrabold text-gray-800">No Assessment Found</h3>
        <p className="text-xs text-gray-500 font-semibold leading-relaxed">
          You haven't attempted this mock test yet. Go to the Test Center to take it.
        </p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 px-6">
          <Link href="/test">Go to Test Center</Link>
        </Button>
      </div>
    );
  }

  const formatTimeSpent = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} seconds`;
    return `${mins}m ${secs}s`;
  };

  const scorePercent = Math.round((attempt.score / attempt.totalMarks) * 100);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Back button */}
      <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors font-bold self-start">
        <ArrowLeft className="h-3.5 w-3.5" />
        <Link href="/test">Back to Test Center</Link>
      </button>

      {/* Grade card */}
      <Card className="border border-gray-300 shadow-md bg-white rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <Badge className="bg-white/20 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase border-0 backdrop-blur-sm">
              Assessment Summary
            </Badge>
            <h2 className="text-lg sm:text-2xl font-extrabold leading-tight">{test.title}</h2>
            <p className="text-indigo-100 text-xs sm:text-sm font-medium">
              Completed on {new Date(attempt.attemptedAt).toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
          </div>

          <div className="flex flex-col items-center bg-white/10 rounded-2xl p-5 border border-white/20 shadow-inner text-center shrink-0 w-36 select-none">
            <span className="text-[10px] text-indigo-100 font-extrabold uppercase leading-none mb-1">Score Card</span>
            <span className="text-3xl font-extrabold leading-none">{attempt.score}</span>
            <span className="text-[10px] text-indigo-200 mt-1">out of {attempt.totalMarks} ({scorePercent}%)</span>
          </div>
        </div>

        <CardContent className="p-6 grid gap-4 grid-cols-3 text-center border-t border-gray-150">
          <div className="space-y-0.5 border-r border-gray-200">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase block">Time Taken</span>
            <span className="text-xs sm:text-sm font-extrabold text-gray-800">{formatTimeSpent(attempt.timeSpentSeconds)}</span>
          </div>
          <div className="space-y-0.5 border-r border-gray-200">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase block">Class Average</span>
            <span className="text-xs sm:text-sm font-extrabold text-indigo-600">{test.classAverage}%</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase block">Status</span>
            <span className="text-xs sm:text-sm font-extrabold text-green-600 uppercase">PASS</span>
          </div>
        </CardContent>
      </Card>

      {/* Solutions review */}
      {test.type === "mcq" && test.questions ? (
        <div className="space-y-6">
          <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-indigo-500" />
            Answer Sheet Analysis
          </h3>

          {test.questions.map((q, idx) => {
            const studentAnswer = attempt.answers[q.id];
            const isCorrect = studentAnswer === q.correctOptionId;

            return (
              <Card key={q.id} className="border border-gray-300 shadow-sm bg-white rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex gap-3.5 items-start">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs shrink-0 border border-blue-200">
                    {idx + 1}
                  </span>
                  <div className="space-y-1 pt-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                      <LatexPreview content={q.text} enabled={q.hasLatex || (q as any).usesLatex} inline={true} />
                    </h4>
                  </div>
                  <div className="ml-auto shrink-0 pt-0.5">
                    {isCorrect ? (
                      <Badge className="bg-green-50 hover:bg-green-50 text-green-700 font-extrabold text-[8px] flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        CORRECT
                      </Badge>
                    ) : (
                      <Badge className="bg-red-50 hover:bg-red-50 text-red-700 font-extrabold text-[8px] flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-650" />
                        INCORRECT
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 pl-9">
                  {q.options.map((opt) => {
                    const isOptCorrect = opt.id === q.correctOptionId;
                    const isOptSelected = opt.id === studentAnswer;

                    return (
                      <div 
                        key={opt.id} 
                        className={`flex items-center gap-3 p-3.5 border rounded-2xl transition-all ${
                          isOptCorrect 
                            ? "border-green-500 bg-green-50/20 text-green-800 font-bold" 
                            : isOptSelected
                            ? "border-red-400 bg-red-50/20 text-red-800 font-bold"
                            : "border-gray-250 text-gray-700 font-medium"
                        }`}
                      >
                        <div className="shrink-0">
                          {isOptCorrect ? (
                            <CheckCircle className="h-4.5 w-4.5 text-green-600" />
                          ) : isOptSelected ? (
                            <XCircle className="h-4.5 w-4.5 text-red-600" />
                          ) : (
                            <div className="h-4.5 w-4.5 rounded-full border border-gray-400" />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm">
                          <LatexPreview content={opt.text} enabled={q.hasLatex || (q as any).usesLatex} inline={true} />
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="pl-9 pt-1">
                  <div className="p-4 border border-indigo-100 rounded-2xl bg-indigo-50/50 space-y-1">
                    <span className="text-[10px] text-indigo-700 font-bold flex items-center gap-1 uppercase">
                      <BookOpen className="h-3 w-3 text-indigo-600" />
                      Academic Explanation
                    </span>
                    <div className="text-xs text-gray-600 leading-relaxed font-semibold">
                      <LatexPreview content={q.explanation} enabled={q.hasLatex || (q as any).usesLatex} inline={true} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* PDF ATTEMPT PANEL */
        <Card className="border border-gray-300 bg-white rounded-2xl p-6 space-y-4">
          <h3 className="text-sm sm:text-base font-extrabold text-gray-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Solutions Script Submitted
          </h3>
          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            Your written answers script was successfully uploaded. Our subject tutors are currently grading your paper.
            You will receive a notification and detailed feedback once grades are released.
          </p>
          <div className="p-3 border border-gray-250 rounded-xl bg-gray-50 flex justify-between items-center text-xs font-bold text-gray-700">
            <span>Uploaded Script:</span>
            <span className="font-mono text-gray-500 text-[10px]">{attempt.answers.pdfFile || "submitted_answers.pdf"}</span>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function TestResultPage({ params }: ResultPageProps) {
  const resolvedParams = use(params);
  return (
    <DashboardGuard>
      <StudentLayout>
        <TestResultContent testId={resolvedParams.testId} />
      </StudentLayout>
    </DashboardGuard>
  );
}
