"use client";

import { useState } from "react";
import { 
  Bug, 
  Info, 
  ChevronRight, 
  ArrowLeft, 
  Upload, 
  Send, 
  Activity, 
  AlertTriangle,
  X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { api } from "@/services/api";
import { useStudentAuth } from "@/context/student-auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

function ReportIssueContent() {
  const { student } = useStudentAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [reportText, setReportText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) {
      toast({
        title: "Input Description",
        description: "Please enter a description of the technical issue.",
        variant: "destructive",
      });
      return;
    }

    if (reportText.trim().length < 10) {
      toast({
        title: "Report Too Short",
        description: "Please provide at least 10 characters to help us debug.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    const res = await api.sendReportIssue(reportText, student?.email || "anonymous@student.com");
    setIsSending(false);

    if (res.success) {
      toast({
        title: "Report Received",
        description: "Thank you! Our engineering team has logged this issue.",
      });
      setReportText("");
      setSelectedImage(null);
      // Go back to settings or dashboard
      router.push("/settings");
    } else {
      toast({
        title: "Failed to Send",
        description: res.message || "Could not log the technical report.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header title */}
      <div className="flex items-center gap-3 border-b border-gray-300 pb-4">
        {currentStep === 2 && (
          <Button 
            onClick={() => setCurrentStep(1)} 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 border border-gray-250 rounded-xl bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 text-gray-650" />
          </Button>
        )}
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
            <Bug className="h-6 w-6 text-red-500" />
            Report Technical Issues
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Let us know if you find glitches in lecture feeds, timer schedules, or test attempts.
          </p>
        </div>
      </div>

      {currentStep === 1 ? (
        <div className="space-y-6">
          {/* Info banner */}
          <Card className="border border-blue-200 bg-blue-50/30 p-5 rounded-2xl flex gap-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl h-fit border border-blue-150">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-extrabold text-gray-800 leading-snug">Help us improve NoteSwift</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                By submitting a technical report, diagnostic parameters about your browser type (Chrome/Safari), role identity, and logged page loads will be shared with our development team.
              </p>
            </div>
          </Card>

          <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-gray-800 leading-snug">
              Include diagnostic logs and details?
            </h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Including diagnostics helps us pin down resource leaks or UI alignment bugs much faster. We will link this report with your active student session metadata.
            </p>

            <div className="border-t border-gray-150 pt-4 flex flex-col sm:flex-row gap-3 justify-end">
              <Button 
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-5 border border-blue-700 flex items-center justify-center gap-1.5"
              >
                Include details & continue
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleNextStep}
                variant="outline" 
                className="border-gray-300 text-gray-700 font-bold rounded-xl h-11 px-5 bg-white hover:bg-gray-50"
              >
                Continue with basic info
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl">
          <CardHeader className="border-b border-gray-250 bg-gray-50/50 p-5">
            <CardTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Describe Glitch Details
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 font-semibold">
              Explain precisely what went wrong and how to reproduce it.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSendReport} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="issue" className="text-xs font-bold text-gray-655">Issue Description *</Label>
                <Textarea
                  id="issue"
                  required
                  placeholder="Describe step-by-step what was on screen, what button was clicked, and what error or glitch occurred..."
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  rows={6}
                  className="border-gray-250 rounded-xl focus:border-blue-500 text-xs sm:text-sm font-medium"
                />
                <span className="text-[10px] text-gray-400 font-bold text-right block">
                  {reportText.length} / 2000 characters
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-655">Attach Screenshot (Optional)</Label>
                {selectedImage ? (
                  <div className="relative border border-gray-250 rounded-2xl overflow-hidden p-2 bg-gray-50">
                    <img 
                      src={selectedImage} 
                      alt="uploaded preview" 
                      className="max-h-48 object-contain mx-auto rounded-xl"
                    />
                    <Button 
                      onClick={() => setSelectedImage(null)}
                      variant="destructive"
                      size="icon"
                      className="absolute top-4 right-4 h-8 w-8 rounded-full border border-red-700 bg-red-600 hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-250 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer transition-colors relative">
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <span className="text-xs font-bold text-gray-700 block">Drag & Drop screenshot or browse file</span>
                    <span className="text-[10px] text-gray-500 block mt-1">Accepts PNG, JPG, JPEG up to 10MB</span>
                    <Input
                      type="file"
                      onChange={(e) => setSelectedImage(e.target.files?.[0]?.name ? URL.createObjectURL(e.target.files[0]) : null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-gray-150 pt-4 flex gap-3 justify-end">
                <Button 
                  type="submit" 
                  disabled={isSending}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-5 border border-blue-700 flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSending ? "Sending logs..." : "Send Report"}</span>
                </Button>
                <Button 
                  type="button" 
                  onClick={() => router.push("/settings")}
                  variant="outline" 
                  className="border-gray-300 text-gray-750 font-bold rounded-xl h-11 px-5 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ReportIssuePage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <ReportIssueContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
