"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PhoneStep } from "./phone-step";
import { OtpStep } from "./otp-step";
import { RegistrationStep } from "./registration-step";

type Step = "phone" | "otp" | "registration";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/noteswift-logo.png" alt="NoteSwift" width={48} height={48} />
          <h1 className="mt-3 text-xl font-bold text-foreground">
            {step === "phone" && "Welcome to NoteSwift"}
            {step === "otp" && "Verify your phone"}
            {step === "registration" && "Complete your profile"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "phone" && "The smarter way to learn."}
            {step === "otp" && "One-time login code"}
            {step === "registration" && "Just a few more details."}
          </p>
        </div>

        {step === "phone" && (
          <PhoneStep
            onOtpSent={(phone) => {
              setPhoneNumber(phone);
              setStep("otp");
            }}
          />
        )}

        {step === "otp" && (
          <OtpStep
            phoneNumber={phoneNumber}
            onChangeNumber={() => setStep("phone")}
            onVerified={(outcome) => {
              if (outcome === "newUser") {
                setStep("registration");
              } else {
                router.replace("/dashboard");
              }
            }}
          />
        )}

        {step === "registration" && (
          <RegistrationStep
            phoneNumber={phoneNumber}
            onRegistered={() => router.replace("/dashboard")}
          />
        )}
      </div>
    </div>
  );
}
