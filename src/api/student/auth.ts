import api from "@/api/axios";
import { getWebSessionId } from "@/lib/webSessionId";
import type { ApiResponse } from "@/types/api";
import type { Student } from "@/types/student";

// Wrappers mirror the mobile app's api/student/auth.ts request/response
// shapes exactly (blueprint §5.2) — the backend is shared across both.

export const sendPhoneOtp = async (
  phone_number: string
): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.post(
    "/auth/send-phone-otp",
    { phone_number },
    // Not logged in yet, so the request interceptor's auth header doesn't
    // apply here — attach the web-session id explicitly instead.
    { headers: { "x-device-fingerprint": getWebSessionId() } }
  );
  return res.data;
};

export type VerifyPhoneOtpResult =
  | { isNewUser: true; message: string }
  | {
      isNewUser: false;
      activeSessionExists: boolean;
      user: Student;
      accessToken: string;
      refreshToken: string;
    };

export const verifyPhoneOtp = async (
  phone_number: string,
  otp_code: string
): Promise<ApiResponse<VerifyPhoneOtpResult>> => {
  const res = await api.post(
    "/auth/verify-phone-otp",
    { phone_number, otp_code },
    { headers: { "x-device-fingerprint": getWebSessionId() } }
  );
  return res.data;
};

export interface CompleteRegistrationPayload {
  phone_number: string;
  full_name: string;
  grade: number;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string; // ISO string
  province?: string;
  district?: string;
  institution?: string;
  municipality?: string;
  ward?: number;
  schoolId?: string;
}

export interface CompleteRegistrationResult {
  isNewUser: false;
  user: Student;
  accessToken: string;
  refreshToken: string;
  message: string;
}

export const completeRegistration = async (
  payload: CompleteRegistrationPayload
): Promise<ApiResponse<CompleteRegistrationResult>> => {
  const res = await api.post("/auth/complete-registration", payload, {
    headers: { "x-device-fingerprint": getWebSessionId() },
  });
  return res.data;
};

export const logoutStudent = async (): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.post("/auth/logout");
  return res.data;
};

export const getCurrentStudent = async (): Promise<
  ApiResponse<{ student: Student }>
> => {
  const res = await api.get("/auth/me");
  return res.data;
};
