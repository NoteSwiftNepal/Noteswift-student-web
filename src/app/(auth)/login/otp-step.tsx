"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const otpSchema = z.object({
  otp_code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type OtpFormValues = z.infer<typeof otpSchema>;

const RESEND_SECONDS = 60;

export function OtpStep({
  phoneNumber,
  onVerified,
  onChangeNumber,
}: {
  phoneNumber: string;
  onVerified: (outcome: "newUser" | "loggedIn") => void;
  onChangeNumber: () => void;
}) {
  const verifyPhoneOtp = useAuthStore((state) => state.verifyPhoneOtp);
  const sendPhoneOtp = useAuthStore((state) => state.sendPhoneOtp);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp_code: "" },
  });

  const onSubmit = async ({ otp_code }: OtpFormValues) => {
    const result = await verifyPhoneOtp(phoneNumber, otp_code);

    if (!result) {
      toast({
        title: "Invalid OTP",
        description: useAuthStore.getState().apiMessage || "Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (result.isNewUser) {
      toast({ title: "OTP verified", description: "Let's finish setting up your account." });
      onVerified("newUser");
      return;
    }

    toast({
      title: result.activeSessionExists ? "Device switched" : "Login successful",
      description: result.activeSessionExists
        ? "You've been signed out of your other device."
        : "Welcome back!",
    });
    onVerified("loggedIn");
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    const success = await sendPhoneOtp(phoneNumber);
    if (success) {
      toast({ title: "OTP resent", description: "Check your phone for the new code." });
      setResendIn(RESEND_SECONDS);
    } else {
      toast({
        title: "Failed to resend",
        description: useAuthStore.getState().apiMessage || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to +977 {phoneNumber}
        </p>

        <FormField
          control={form.control}
          name="otp_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification code</FormLabel>
              <FormControl>
                <Input
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="text-center text-lg tracking-[0.5em]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onChangeNumber}
            className="text-muted-foreground hover:text-foreground"
          >
            Change phone number
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendIn > 0}
            className="font-medium text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
          >
            {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
          </button>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Continue"}
        </Button>
      </form>
    </Form>
  );
}
