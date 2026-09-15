"use client";

import { Input } from "@/components/ui/input";

// Small 4-digit code input — matches mobile's OTPInput (length=4) for every
// OTP step in this phase (email-change, password-change). Plain text input
// with numeric constraints rather than pulling in a dedicated OTP package
// for a single simple use case.
export function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      placeholder="0000"
      inputMode="numeric"
      maxLength={4}
      className="text-center text-2xl tracking-[0.5em]"
      autoFocus
    />
  );
}
