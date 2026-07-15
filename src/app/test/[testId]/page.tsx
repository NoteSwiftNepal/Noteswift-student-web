"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  AlertCircle, 
  CheckSquare, 
  ArrowLeft, 
  HelpCircle,
  FileText,
  Download,
  Upload
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { api } from "@/services/api";
import { MockTest } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { LatexPreview } from "@/components/latex-preview";

interface TestPageProps {
  params: Promise<{ testId: string }>;
}

function ActiveTestContent({ testId }: { testId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [test, setTest] = useState<MockTest | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  
  // PDF upload stub
  const [pdfUploadName, setPdfUploadName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadTest = async () => {
      const res = await api.getTests();
      if (res.success && res.data) {
        const found = res.data.find(t => t.id === testId);
        if (found) {
          setTest(found);
          setTimeLeft(found.durationMinutes * 60);
        }
      }
    };
    loadTest();
  }, [testId]);

  // Tick timer
  useEffect(() => {
    if (timeLeft <= 0 || !test) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(); // Auto-submit when time expires!
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, test]);

  const handleSelectOption = (qId: string, optId: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optId
    }));
  };

  const handleSubmitTest = async () => {
    if (!test) return;
    setIsSubmitting(true);
    
    // In PDF mode, mock answers
    const finalAnswers = test.type === "pdf" ? { pdfFile: pdfUploadName || "submitted_paper.pdf" } : answers;

    const res = await api.submitTestAttempt(test.id, finalAnswers, timeSpent);
    setIsSubmitting(false);

    if (res.success) {
      toast({
        title: "Test Submitted",
        description: "Your responses have been graded and recorded.",
      });
      router.push(`/test/${test.id}/result`);
    } else {
      toast({
        title: "Submission Failed",
        description: res.message || "Failed to submit responses.",
        variant: "destructive",
      });
    }
  };

  if (!test) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground animate-pulse text-sm">
        Retrieving assessment blueprint...
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const pctProgress = test.questions 
    ? Math.round((Object.keys(answers).length / test.questions.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Test Banner with Timer */}
      <Card className="border border-gray-300 shadow-md bg-white sticky top-16 z-10 rounded-2xl">
        <CardContent className="p-4 sm:p-5 flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-blue-600 font-extrabold uppercase">{test.subject} Mock Exam</span>
            <h2 className="text-base sm:text-lg font-extrabold text-gray-850 leading-tight">{test.title}</h2>
          </div>

          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-2xl shrink-0 select-none">
            <Clock className="h-5 w-5 text-red-500 animate-pulse" />
            <div className="text-right">
              <span className="text-[8px] font-extrabold text-red-500 uppercase block leading-none">Time Remaining</span>
              <span className="text-base font-mono font-extrabold leading-none">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </CardContent>
        {test.type === "mcq" && test.questions && (
          <div className="px-5 pb-3">
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold mb-1">
              <span>Exam Progress</span>
              <span>{Object.keys(answers).length} / {test.questions.length} Answered</span>
            </div>
            <Progress value={pctProgress} className="h-1.5 bg-gray-100 [&>div]:bg-green-500 rounded-full" />
          </div>
        )}
      </Card>

      {/* Test Body */}
      {test.type === "mcq" && test.questions ? (
        <div className="space-y-6">
          {test.questions.map((q, idx) => (
            <Card key={q.id} className="border border-gray-300 shadow-sm bg-white rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex gap-3.5 items-start">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs shrink-0 border border-blue-200">
                  {idx + 1}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed pt-0.5">
                  <LatexPreview content={q.text} enabled={q.hasLatex || (q as any).usesLatex} inline={true} />
                </h4>
              </div>

              <RadioGroup 
                onValueChange={(val) => handleSelectOption(q.id, val)}
                value={answers[q.id] || ""}
                className="grid gap-3.5 pl-9"
              >
                {q.options.map((opt) => (
                  <div 
                    key={opt.id} 
                    className={`flex items-center gap-3 p-3.5 border rounded-2xl transition-all cursor-pointer hover:bg-gray-55/30 ${
                      answers[q.id] === opt.id 
                        ? "border-blue-500 bg-blue-50/20 text-blue-800 font-bold" 
                        : "border-gray-250 text-gray-700 font-medium"
                    }`}
                    onClick={() => handleSelectOption(q.id, opt.id)}
                  >
                    <RadioGroupItem value={opt.id} id={opt.id} className="border-gray-400 text-blue-600 focus:ring-blue-500 shrink-0" />
                    <Label htmlFor={opt.id} className="text-xs sm:text-sm cursor-pointer w-full leading-normal">
                      <LatexPreview content={opt.text} enabled={q.hasLatex || (q as any).usesLatex} inline={true} />
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </Card>
          ))}
        </div>
      ) : (
        /* PDF TEST PANEL */
        <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl p-6 space-y-6">
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-4 items-center">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-indigo-600 font-extrabold uppercase block">Question Paper Download</span>
              <h4 className="text-xs sm:text-sm font-bold text-gray-800">SEE_Mathematics_Set1.pdf (2.4 MB)</h4>
              <p className="text-[10px] text-gray-500 font-semibold leading-normal mt-0.5">
                Download the PDF, write answers on blank sheets, scan them as a single PDF and upload.
              </p>
            </div>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold ml-auto shrink-0 gap-1 text-xs px-3">
              <a href={test.pdfUrl} download>
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-650">Upload Written Answer Sheets</Label>
            <div className="border-2 border-dashed border-gray-250 hover:border-blue-400 rounded-2xl p-8 text-center cursor-pointer transition-colors relative">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <span className="text-xs sm:text-sm font-bold text-gray-700 block">Drag & Drop Scan PDF or Click to browse</span>
              <span className="text-[10px] text-gray-500 block mt-1">Submit single PDF file up to 25MB</span>
              <Input
                type="file"
                onChange={(e) => setPdfUploadName(e.target.files?.[0]?.name || "")}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            {pdfUploadName && (
              <p className="text-xs text-green-600 font-bold mt-1.5 flex items-center gap-1">
                <span>✓</span> File ready: {pdfUploadName}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Footer Submit Bar */}
      <div className="flex gap-3 justify-end items-center py-4">
        <Button 
          variant="outline" 
          onClick={() => {
            if (confirm("Are you sure you want to cancel? Your current progress will be lost.")) {
              router.push("/test");
            }
          }}
          className="border-gray-300 rounded-xl font-bold text-xs h-11 px-5 bg-white"
        >
          Cancel Exam
        </Button>
        <Button 
          onClick={handleSubmitTest}
          disabled={isSubmitting || (test.type === "pdf" && !pdfUploadName)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl h-11 px-6 border border-green-700 flex items-center gap-1.5"
        >
          <CheckSquare className="h-4 w-4" />
          <span>{isSubmitting ? "Submitting..." : "Submit Exam Solutions"}</span>
        </Button>
      </div>
    </div>
  );
}

export default function ActiveTestPage({ params }: TestPageProps) {
  const resolvedParams = use(params);
  return (
    <DashboardGuard>
      <StudentLayout>
        <ActiveTestContent testId={resolvedParams.testId} />
      </StudentLayout>
    </DashboardGuard>
  );
}
