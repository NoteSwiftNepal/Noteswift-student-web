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
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 py-10">
      {/* Decorative shapes, same as the teacher portal */}
      <div className="absolute left-0 top-0 hidden h-72 w-72 rounded-br-[120px] border-[12px] border-primary/15 md:block" />
      <div className="absolute bottom-0 right-0 hidden h-96 w-96 rounded-tl-[140px] bg-gradient-to-tl from-primary/15 to-primary/5 md:block" />
      <div className="absolute right-32 top-32 hidden h-48 w-48 rounded-full border-[6px] border-primary/10 lg:block" />
      <div className="absolute bottom-40 left-40 hidden h-40 w-40 rotate-12 rounded-2xl bg-primary/10 lg:block" />

      <div className="relative w-full max-w-md px-4 sm:px-6">
        <div className="mb-6 flex flex-col items-center sm:mb-8">
          <Image src="/logo.png" alt="NoteSwift" width={96} height={96} priority className="mb-3 h-20 w-20 rounded-3xl sm:h-24 sm:w-24" />
          <p className="text-2xl font-bold text-foreground sm:text-3xl">Student Portal</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/95 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {step === "phone" && "Sign in to your account"}
            {step === "otp" && "Verify your phone"}
            {step === "registration" && "Complete your profile"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "phone" && "Enter your phone number to get a one-time code."}
            {step === "otp" && "Enter the code we sent to your phone."}
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
    </main>
  );
}
