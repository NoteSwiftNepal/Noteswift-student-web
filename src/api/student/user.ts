import api from "@/api/axios";
import type { ApiResponse } from "@/types/api";
import type { Student } from "@/types/student";
import type { NotificationPreferences, ParentLinkCodeResponse, UpdateUserData } from "@/types/user";

// Every endpoint below is ApiResponse<T> ({error,status,result,message}) —
// confirmed directly against profile.controller.ts, password.controller.ts,
// and notification.controller.ts (all use the JsonResponse wrapper class),
// not assumed from mobile's api/student/user.ts (which makes the same
// assumption, but that's mobile's own reading of the contract, not proof).

export const getFetchCurrentUser = async (): Promise<
  ApiResponse<{ student: Student }>
> => {
  const res = await api.get("/user/me");
  return res.data;
};

export const updateUserProfile = async (
  data: UpdateUserData
): Promise<ApiResponse<{ message: string; student: Student }>> => {
  const res = await api.put("/user/me", data);
  return res.data;
};

// /user/upload-profile-image takes a base64 data URL string in the JSON
// body (profile.controller.ts's uploadProfileImage reads req.body.imageData
// and requires it to start with "data:image/") — a third distinct upload
// mechanism from this app's other two (Phase 3's multipart-through-backend,
// Phase 5's presigned-PUT-to-R2). Neither of those fits this endpoint, so
// neither is reused here.
export const uploadProfileImage = async (
  imageDataUrl: string
): Promise<ApiResponse<{ message: string; student: Student; imageUrl: string }>> => {
  const res = await api.post("/user/upload-profile-image", { imageData: imageDataUrl });
  return res.data;
};

// ==================== EMAIL CHANGE (4 steps) ====================
// Confirmed against notification.controller.ts and EmailChangeBottomSheet.tsx
// (mobile's own component implementing this exact 4-step sequence) — see
// MOBILE_APP_CODE_ISSUES.md for why that component is unreachable on mobile
// despite the backend fully supporting it.

export const sendCurrentEmailVerification = async (): Promise<
  ApiResponse<{ message: string; email: string }>
> => {
  const res = await api.post("/user/email-change/send-current-verification");
  return res.data;
};

export const verifyCurrentEmail = async (
  otpCode: string
): Promise<ApiResponse<{ message: string; verified: boolean }>> => {
  const res = await api.post("/user/email-change/verify-current", { otp_code: otpCode });
  return res.data;
};

export const sendNewEmailVerification = async (
  newEmail: string
): Promise<ApiResponse<{ message: string; newEmail: string }>> => {
  const res = await api.post("/user/email-change/send-new-verification", { newEmail });
  return res.data;
};

export const verifyNewEmailAndUpdate = async (
  newEmail: string,
  otpCode: string
): Promise<ApiResponse<{ message: string; student: Student; oldEmail: string; newEmail: string }>> => {
  const res = await api.post("/user/email-change/verify-and-update", {
    newEmail,
    otp_code: otpCode,
  });
  return res.data;
};

// ==================== PASSWORD CHANGE (authenticated) ====================

export const verifyCurrentPassword = async (
  currentPassword: string
): Promise<ApiResponse<{ message: string; verified: boolean }>> => {
  const res = await api.post("/user/password-change/verify-current", { currentPassword });
  return res.data;
};

export const changePasswordWithCurrent = async (
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.post("/user/password-change/change-with-current", {
    currentPassword,
    newPassword,
  });
  return res.data;
};

export const sendForgotPasswordOTP = async (): Promise<
  ApiResponse<{ message: string; email: string }>
> => {
  const res = await api.post("/user/password-change/send-forgot-otp");
  return res.data;
};

export const verifyForgotPasswordOTP = async (
  otpCode: string
): Promise<ApiResponse<{ message: string; verified: boolean }>> => {
  const res = await api.post("/user/password-change/verify-forgot-otp", { otp_code: otpCode });
  return res.data;
};

export const resetPasswordWithOTP = async (
  otpCode: string,
  newPassword: string
): Promise<ApiResponse<{ message: string }>> => {
  const res = await api.post("/user/password-change/reset-with-otp", {
    otp_code: otpCode,
    newPassword,
  });
  return res.data;
};

// Unauthenticated /student/auth/password-reset/* flow (login-page "forgot
// password") is deliberately out of scope for this phase — it belongs to
// the login screen, not Profile/Settings.

// ==================== NOTIFICATION PREFERENCES ====================

export const getNotificationPreferences = async (): Promise<
  ApiResponse<{ message: string; preferences: NotificationPreferences }>
> => {
  const res = await api.get("/user/notification-preferences");
  return res.data;
};

export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<ApiResponse<{ message: string; preferences: NotificationPreferences }>> => {
  const res = await api.put("/user/notification-preferences", preferences);
  return res.data;
};

// ==================== PARENT LINK ====================

export const generateParentLinkCode = async (): Promise<
  ApiResponse<ParentLinkCodeResponse>
> => {
  const res = await api.post("/user/parent-link/generate-code");
  return res.data;
};
