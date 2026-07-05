"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, User, Mail, ShieldCheck, ArrowRight, Loader2, ArrowLeft, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LoginGuard } from "@/components/auth-guard";
import { useStudentAuth } from "@/context/student-auth-context";
import { USE_MOCK_DATA } from "@/config/app-config";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { loginWithPhone, registerWithPhone, verifyOtp } = useStudentAuth();

  // Authentication UI Steps: "input" | "otp"
  const [authStep, setAuthStep] = useState<"input" | "otp">("input");
  const [activeTab, setActiveTab] = useState<string>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Input states
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState("");

  // Resend OTP timer
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  };

  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsLoading(true);
    try {
      const fullPhoneNumber = `+977-${phone}`;
      const result = await loginWithPhone(fullPhoneNumber);

      if (result.success) {
        toast({
          title: "Verification Code Sent",
          description: `OTP code sent to ${fullPhoneNumber}.${USE_MOCK_DATA ? " (Demo code: 123456)" : ""}`,
        });
        setAuthStep("otp");
        setResendTimer(60);
      } else {
        setError(result.message || "Failed to send verification code.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service & Privacy Policy.");
      return;
    }

    setIsLoading(true);
    try {
      const fullPhoneNumber = `+977-${phone}`;
      const result = await registerWithPhone(fullName, fullPhoneNumber, email, agreeTerms);

      if (result.success) {
        toast({
          title: "Registration Verification",
          description: `OTP code sent to ${fullPhoneNumber}.${USE_MOCK_DATA ? " (Demo code: 123456)" : ""}`,
        });
        setAuthStep("otp");
        setResendTimer(60);
      } else {
        setError(result.message || "Registration failed.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otpCode.length < 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyOtp(otpCode);
      if (result.success) {
        toast({
          title: "Authenticated Successfully",
          description: "Welcome to NoteSwift Student Portal!",
        });
        router.push("/dashboard");
      } else {
        setError(result.message || "Invalid OTP code.");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError("");
    setIsLoading(true);
    try {
      const fullPhoneNumber = `+977-${phone}`;
      const result = activeTab === "signin"
        ? await loginWithPhone(fullPhoneNumber)
        : await registerWithPhone(fullName, fullPhoneNumber, email, agreeTerms);

      if (result.success) {
        toast({
          title: "OTP Resent",
          description: `New OTP sent to ${fullPhoneNumber}.${USE_MOCK_DATA ? " (Demo code: 123456)" : ""}`,
        });
        setResendTimer(60);
        setOtpCode("");
      } else {
        setError(result.message || "Failed to resend OTP.");
      }
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginGuard>
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6">
        <div className="hidden md:block absolute top-0 left-0 w-48 h-48 md:w-72 md:h-72 border-[8px] md:border-[12px] border-blue-200/40 rounded-br-[80px] md:rounded-br-[120px]"></div>
        <div className="hidden md:block absolute bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-tl from-blue-200/30 to-blue-100/10 rounded-tl-[100px] md:rounded-tl-[140px]"></div>

        <div className="relative z-10 w-full max-w-[390px] space-y-6">
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border border-gray-300 bg-white p-1 shadow-sm flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="NoteSwift" 
                className="h-12 w-12 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 tracking-tight font-headline">NoteSwift Student</h1>
              <p className="text-xs text-gray-500 font-bold mt-1 px-4">Access classes, take quizzes, and clear your academic doubts instantly.</p>
            </div>
          </div>

          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-gray-300 rounded-2xl overflow-hidden">
            {authStep === "input" ? (
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setError(""); }} className="w-full">
                <TabsList className="grid grid-cols-2 w-full h-12 bg-gray-50 border-b border-gray-200 rounded-none p-0">
                  <TabsTrigger
                    value="signin"
                    className="h-full rounded-none font-bold text-xs sm:text-sm border-r border-gray-200 data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="h-full rounded-none font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all"
                  >
                    Create Account
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="p-6 sm:p-8 pt-6 focus-visible:outline-none">
                  <CardHeader className="p-0 pb-4 text-center">
                    <CardTitle className="text-lg sm:text-xl font-extrabold text-gray-900">Sign in with Mobile</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-gray-500 font-semibold">
                      Enter your mobile number to receive a secure login OTP.
                    </CardDescription>
                  </CardHeader>

                  <form onSubmit={handleSendLoginOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="loginPhone" className="text-xs sm:text-sm font-bold text-gray-700">Mobile Number</Label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs sm:text-sm font-bold select-none">
                          +977
                        </span>
                        <Input
                          id="loginPhone"
                          type="tel"
                          placeholder="98XXXXXXXX"
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          required
                          className="rounded-l-none rounded-r-xl h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base font-semibold tracking-wide pl-3"
                        />
                      </div>
                    </div>

                    {USE_MOCK_DATA && (
                      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-xs sm:text-sm text-blue-700 space-y-1.5">
                        <p className="font-bold flex items-center gap-1">
                          <span>💡</span> Student Demo Credentials
                        </p>
                        <p className="font-mono bg-white/60 p-2 rounded-lg border border-blue-100 leading-none text-xs font-semibold">
                          Phone: 9841234567
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs sm:text-sm font-bold text-red-600 flex items-center gap-2">
                          <span>⚠️</span> {error}
                        </p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full font-bold text-sm sm:text-base h-12 bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl border border-blue-600 flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send OTP Code
                          <ArrowRight className="h-4.5 w-4.5" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="p-6 sm:p-8 pt-6 focus-visible:outline-none">
                  <CardHeader className="p-0 pb-4 text-center">
                    <CardTitle className="text-lg sm:text-xl font-extrabold text-gray-900">Student Registration</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-gray-500 font-semibold">
                      Create a student account to access premium courses & materials.
                    </CardDescription>
                  </CardHeader>

                  <form onSubmit={handleSendRegisterOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="regName" className="text-xs sm:text-sm font-bold text-gray-700">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="regName"
                          placeholder="e.g. Ram Thapa"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="h-11 pl-9 border-gray-300 focus:border-blue-500 rounded-xl text-sm sm:text-base font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="regPhone" className="text-xs sm:text-sm font-bold text-gray-700">Mobile Number *</Label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs sm:text-sm font-bold select-none">
                          +977
                        </span>
                        <Input
                          id="regPhone"
                          type="tel"
                          placeholder="98XXXXXXXX"
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          required
                          className="rounded-l-none rounded-r-xl h-11 border-gray-300 focus:border-blue-500 text-sm sm:text-base font-semibold pl-3"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="regEmail" className="text-xs sm:text-sm font-bold text-gray-700">Email Address (Optional)</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="regEmail"
                          type="email"
                          placeholder="yourname@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 pl-9 border-gray-300 focus:border-blue-500 rounded-xl text-sm sm:text-base font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-1.5">
                      <Checkbox
                        id="terms"
                        checked={agreeTerms}
                        onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                        className="mt-0.5 border-gray-350 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-600 rounded"
                      />
                      <Label htmlFor="terms" className="text-xs sm:text-sm text-gray-600 font-semibold leading-snug cursor-pointer select-none">
                        I agree to the <span className="text-blue-600 hover:underline">Terms of Service</span> and <span className="text-blue-600 hover:underline">Privacy Policy</span>.
                      </Label>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs sm:text-sm font-bold text-red-655 flex items-center gap-2">
                          <span>⚠️</span> {error}
                        </p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full font-bold text-sm sm:text-base h-12 bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl border border-blue-600 flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          Registering...
                        </>
                      ) : (
                        <>
                          Register & Send OTP
                          <ArrowRight className="h-4.5 w-4.5" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="p-6 sm:p-8 space-y-6">
                <button
                  onClick={() => { setAuthStep("input"); setError(""); }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors font-bold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back / Edit Number
                </button>

                <div className="text-center space-y-1.5">
                  <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">OTP Verification</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold px-4">
                    Enter the 6-digit authentication code sent to <span className="font-extrabold text-gray-850">+977-{phone}</span>.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtpCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otpVal" className="text-xs sm:text-sm font-bold text-gray-700">Enter Verification Code</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="otpVal"
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        required
                        className="h-12 pl-9 text-center text-sm sm:text-base font-extrabold tracking-[0.4em] border-gray-300 focus:border-blue-500 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                    <span className="text-gray-500">Didn't receive code?</span>
                    {resendTimer > 0 ? (
                      <span className="text-gray-450">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  {USE_MOCK_DATA && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3.5 text-xs sm:text-sm text-yellow-700 space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <span>🔑</span> Demo OTP Code
                      </p>
                      <p className="font-semibold text-gray-700 leading-normal">
                        Enter code <span className="font-extrabold font-mono bg-white px-1.5 py-0.5 rounded border border-yellow-300 text-yellow-800">123456</span> to complete authentication bypass.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-xs sm:text-sm font-bold text-red-600 flex items-center gap-2">
                        <span>⚠️</span> {error}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full font-bold text-sm sm:text-base h-12 bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl border border-blue-600 flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        Verifying Code...
                      </>
                    ) : (
                      <>
                        Verify & Login
                        <ArrowRight className="h-4.5 w-4.5" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </Card>

          <div className="text-center">
            <p className="text-xs text-gray-500 font-semibold">
              © {new Date().getFullYear()} NoteSwift. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </LoginGuard>
  );
}
