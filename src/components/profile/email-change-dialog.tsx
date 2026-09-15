"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import {
  sendCurrentEmailVerification,
  verifyCurrentEmail,
  sendNewEmailVerification,
  verifyNewEmailAndUpdate,
} from "@/api/student/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OtpInput } from "@/components/profile/otp-input";

type Step = "send-current-verification" | "verify-current" | "enter-new-email" | "verify-new-email";

// Exact 4-step sequence ported from EmailChangeBottomSheet.tsx (231 lines,
// read in full) — confirmed matching CODEBASE_MAP.md's description. Note:
// that component is fully built on mobile but never wired into any
// reachable screen (see MOBILE_APP_CODE_ISSUES.md) despite the backend
// endpoints being live and correct; this dialog makes the same, already-
// working flow actually reachable, from the Profile page.
export function EmailChangeDialog() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("send-current-verification");
  const [loading, setLoading] = useState(false);
  const [currentOtp, setCurrentOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newOtp, setNewOtp] = useState("");

  const reset = () => {
    setStep("send-current-verification");
    setCurrentOtp("");
    setNewEmail("");
    setNewOtp("");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
    else handleSendCurrent();
  };

  const handleSendCurrent = async () => {
    setLoading(true);
    try {
      const res = await sendCurrentEmailVerification();
      if (res.error) throw new Error(res.message);
      toast({ title: "Code sent", description: `Check your inbox at ${user?.email}` });
      setStep("verify-current");
    } catch (err) {
      toast({ title: "Failed to send code", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCurrent = async () => {
    if (currentOtp.length !== 4) return;
    setLoading(true);
    try {
      const res = await verifyCurrentEmail(currentOtp);
      if (res.error) throw new Error(res.message);
      setStep("enter-new-email");
    } catch (err) {
      toast({ title: "Verification failed", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNew = async () => {
    const trimmed = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Invalid email", description: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    if (trimmed.toLowerCase() === user?.email?.toLowerCase()) {
      toast({ title: "Same email", description: "New email must be different from current email.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await sendNewEmailVerification(trimmed);
      if (res.error) throw new Error(res.message);
      toast({ title: "Code sent", description: `Check your inbox at ${trimmed}` });
      setStep("verify-new-email");
    } catch (err) {
      toast({ title: "Failed to send code", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNew = async () => {
    if (newOtp.length !== 4) return;
    setLoading(true);
    try {
      const res = await verifyNewEmailAndUpdate(newEmail.trim(), newOtp);
      if (res.error || !res.result) throw new Error(res.message || "Update failed");
      updateUser(res.result.student);
      toast({ title: "Email updated", description: `Your email is now ${res.result.newEmail}` });
      setOpen(false);
      reset();
    } catch (err) {
      toast({ title: "Verification failed", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
        </DialogHeader>

        {step === "send-current-verification" && (
          <p className="text-sm text-muted-foreground">Sending a verification code to your current email...</p>
        )}

        {step === "verify-current" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 4-digit code sent to <span className="font-medium text-foreground">{user?.email}</span>
            </p>
            <OtpInput value={currentOtp} onChange={setCurrentOtp} />
            <Button className="w-full" onClick={handleVerifyCurrent} disabled={loading || currentOtp.length !== 4}>
              Verify Code
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleSendCurrent} disabled={loading}>
              Resend Code
            </Button>
          </div>
        )}

        {step === "enter-new-email" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email Address</Label>
              <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <Button className="w-full" onClick={handleSendNew} disabled={loading || !newEmail.trim()}>
              Send Verification Code
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("verify-current")} disabled={loading}>
              Back
            </Button>
          </div>
        )}

        {step === "verify-new-email" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 4-digit code sent to <span className="font-medium text-foreground">{newEmail}</span>
            </p>
            <OtpInput value={newOtp} onChange={setNewOtp} />
            <Button className="w-full" onClick={handleVerifyNew} disabled={loading || newOtp.length !== 4}>
              Verify &amp; Update Email
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleSendNew} disabled={loading}>
              Resend Code
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("enter-new-email")} disabled={loading}>
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
