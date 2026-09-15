"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import {
  verifyCurrentPassword,
  changePasswordWithCurrent,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPasswordWithOTP,
} from "@/api/student/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OtpInput } from "@/components/profile/otp-input";

type Step = "current-password" | "new-password" | "forgot-password-verify" | "forgot-password-reset";

function passwordError(pass: string, confirm: string): string | null {
  if (!pass) return "Password is required";
  if (pass.length < 6) return "Password must be at least 6 characters long";
  if (pass.length > 50) return "Password is too long (maximum 50 characters)";
  if (!confirm) return "Please confirm your password";
  if (pass !== confirm) return "Passwords do not match";
  return null;
}

// Ported from PasswordChangeBottomSheet.tsx (fully built on mobile but,
// like EmailChangeBottomSheet, never wired into a reachable screen — see
// MOBILE_APP_CODE_ISSUES.md). Same two entry paths: verify current
// password, or "Forgot Password?" which sends an OTP to the account email
// (authenticated /user/password-change/* flow — the unauthenticated
// /student/auth/password-reset/* flow is out of scope here, it belongs to
// the login page).
export function PasswordChangeCard() {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<Step>("current-password");
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");

  const reset = () => {
    setStep("current-password");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotOtp("");
  };

  const handleVerifyCurrent = async () => {
    if (!currentPassword.trim()) {
      toast({ title: "Enter your current password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await verifyCurrentPassword(currentPassword);
      if (res.error) throw new Error(res.message);
      setStep("new-password");
    } catch (err) {
      toast({ title: "Verification failed", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setLoading(true);
    try {
      const res = await sendForgotPasswordOTP();
      if (res.error) throw new Error(res.message);
      toast({ title: "Code sent", description: `Check your email at ${user?.email}` });
      setStep("forgot-password-verify");
    } catch (err) {
      toast({ title: "Failed to send code", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgotOtp = async () => {
    if (forgotOtp.length !== 4) return;
    setLoading(true);
    try {
      const res = await verifyForgotPasswordOTP(forgotOtp);
      if (res.error) throw new Error(res.message);
      setStep("forgot-password-reset");
    } catch (err) {
      toast({ title: "Verification failed", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const err = passwordError(newPassword, confirmPassword);
    if (err) {
      toast({ title: "Invalid password", description: err, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (step === "new-password") {
        const res = await changePasswordWithCurrent(currentPassword, newPassword);
        if (res.error) throw new Error(res.message);
      } else {
        const res = await resetPasswordWithOTP(forgotOtp, newPassword);
        if (res.error) throw new Error(res.message);
      }
      toast({ title: "Password changed successfully" });
      reset();
    } catch (e) {
      toast({ title: "Failed to change password", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "current-password" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <Button className="w-full" onClick={handleVerifyCurrent} disabled={loading}>
              Verify Password
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleForgot} disabled={loading}>
              Forgot Password?
            </Button>
          </div>
        )}

        {step === "forgot-password-verify" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter the 4-digit code sent to <span className="font-medium text-foreground">{user?.email}</span>
            </p>
            <OtpInput value={forgotOtp} onChange={setForgotOtp} />
            <Button className="w-full" onClick={handleVerifyForgotOtp} disabled={loading || forgotOtp.length !== 4}>
              Verify Code
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleForgot} disabled={loading}>
              Resend Code
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("current-password")} disabled={loading}>
              Back
            </Button>
          </div>
        )}

        {(step === "new-password" || step === "forgot-password-reset") && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button className="w-full" onClick={handleChangePassword} disabled={loading}>
              Change Password
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep(step === "new-password" ? "current-password" : "forgot-password-verify")} disabled={loading}>
              Back
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
