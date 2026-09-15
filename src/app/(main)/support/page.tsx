"use client";

import { useState } from "react";
import { Info, LifeBuoy } from "lucide-react";
import { sendReport } from "@/api/student/support";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const MAX_LENGTH = 2000;
const MIN_LENGTH = 10;

// Ported from Settings/ReportIssue.tsx — the one real, reachable feature
// under mobile's Support/Settings cluster (Support/HelpCenter.tsx itself is
// a genuine "Coming Soon" stub on mobile too, confirmed by reading it, so
// this page doesn't attempt a help-center UI). Deliberately does not port
// the screenshot-attachment step: mobile's own image picker there is
// cosmetic — handleSendReport only ever sends {reportText, userEmail} and
// silently drops the picked image (mobile's own comment admits as much —
// "Image upload would require backend changes... placeholder for future
// implementation") — see MOBILE_APP_CODE_ISSUES.md.
export default function SupportPage() {
  const [reportText, setReportText] = useState("");
  const [sending, setSending] = useState(false);

  const tooShort = reportText.trim().length > 0 && reportText.trim().length < MIN_LENGTH;

  const handleSubmit = async () => {
    const trimmed = reportText.trim();
    if (trimmed.length < MIN_LENGTH) {
      toast({ title: "Tell us a bit more", description: `Please write at least ${MIN_LENGTH} characters.`, variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await sendReport(trimmed);
      if (res.error) throw new Error(res.message);
      toast({ title: "Report sent", description: "Thank you for your feedback — we'll review it soon." });
      setReportText("");
    } catch (err) {
      toast({
        title: "Failed to send report",
        description: err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LifeBuoy className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Report an Issue</h1>
          <p className="text-sm text-muted-foreground">Help us improve NoteSwift.</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm text-foreground/80">
            Your feedback helps us identify and fix issues quickly. Please describe any technical
            problem you&apos;re experiencing in as much detail as you can.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Textarea
          value={reportText}
          onChange={(e) => setReportText(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="Please provide detailed information about the issue you're experiencing..."
          rows={8}
        />
        <div className="flex items-center justify-between text-xs">
          {tooShort ? (
            <span className="text-destructive">At least {MIN_LENGTH} characters.</span>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            {reportText.length}/{MAX_LENGTH}
          </span>
        </div>
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={sending || reportText.trim().length < MIN_LENGTH}>
        {sending ? "Sending..." : "Send Report"}
      </Button>
    </div>
  );
}
