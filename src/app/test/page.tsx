"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Award, 
  Clock, 
  FileText, 
  HelpCircle, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { api } from "@/services/api";
import { MockTest, TestAttempt } from "@/data/mockData";

function TestCenterContent() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);

  const loadTestData = async () => {
    const res = await api.getTests();
    if (res.success && res.data) {
      setTests(res.data);
      setAttempts(res.attempts || []);
    }
  };

  useEffect(() => {
    loadTestData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Test Stats Header */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-gray-300 shadow-sm bg-white p-4 flex gap-4 items-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Exams Attempted</span>
            <span className="text-xl font-extrabold text-gray-800">{attempts.length} / {tests.length}</span>
          </div>
        </Card>

        <Card className="border border-gray-300 shadow-sm bg-white p-4 flex gap-4 items-center">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Average Score</span>
            <span className="text-xl font-extrabold text-green-600">
              {attempts.length > 0 
                ? `${Math.round((attempts.reduce((sum, a) => sum + (a.score / a.totalMarks), 0) / attempts.length) * 100)}%`
                : "N/A"
              }
            </span>
          </div>
        </Card>

        <Card className="border border-gray-300 shadow-sm bg-white p-4 flex gap-4 items-center">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Remaining Mock Tests</span>
            <span className="text-xl font-extrabold text-indigo-600">
              {tests.filter(t => !attempts.some(a => a.testId === t.id)).length}
            </span>
          </div>
        </Card>
      </div>

      {/* Tests Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {tests.map((test) => {
          const attempt = attempts.find((a) => a.testId === test.id);
          
          return (
            <Card key={test.id} className="border border-gray-300 shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50 p-5 flex flex-row justify-between items-start flex-wrap gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase border-0">
                      {test.subject}
                    </Badge>
                    <Badge variant="outline" className="text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase border-gray-300 text-gray-500">
                      {test.type.toUpperCase()}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm sm:text-base font-extrabold text-gray-850 leading-snug">{test.title}</CardTitle>
                </div>

                {attempt && (
                  <div className="text-right shrink-0">
                    <span className="text-[8px] text-gray-400 font-extrabold uppercase block">Your Score</span>
                    <span className="text-sm font-extrabold text-green-600">{attempt.score} / {attempt.totalMarks}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Duration: {test.durationMinutes} mins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                    <span>Questions: {test.questions?.length || "PDF Paper"}</span>
                  </div>
                </div>

                <div className="border-t border-gray-150 pt-3 flex justify-between text-[11px] text-gray-450 font-bold">
                  <span>Class Average Score:</span>
                  <span>{test.classAverage}%</span>
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-0">
                {attempt ? (
                  <Button asChild variant="outline" className="w-full border-gray-300 text-gray-700 font-bold text-xs rounded-xl h-10 hover:bg-gray-50 flex items-center justify-center gap-1.5">
                    <Link href={`/test/${test.id}/result`}>
                      <RotateCcw className="h-4 w-4 text-gray-500" />
                      Review Test Analysis
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 border border-blue-700 flex items-center justify-center gap-1.5">
                    <Link href={`/test/${test.id}`}>
                      <span>Start Assessment</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function TestCenterPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <TestCenterContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
