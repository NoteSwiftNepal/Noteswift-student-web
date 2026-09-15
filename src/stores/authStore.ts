import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  sendPhoneOtp as apiSendPhoneOtp,
  verifyPhoneOtp as apiVerifyPhoneOtp,
  completeRegistration as apiCompleteRegistration,
  getCurrentStudent as apiGetCurrentStudent,
  type CompleteRegistrationPayload,
} from "@/api/student/auth";
import { API_BASE_URL, refreshAccessToken } from "@/api/axios";
import { getWebSessionId } from "@/lib/webSessionId";
import type { Student } from "@/types/student";

interface AuthState {
  user: Student | null;
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  apiMessage: string;

  setAccessToken: (token: string) => void;
  sendPhoneOtp: (phoneNumber: string) => Promise<boolean>;
  verifyPhoneOtp: (
    phoneNumber: string,
    otpCode: string
  ) => Promise<
    | { isNewUser: true }
    | { isNewUser: false; activeSessionExists: boolean }
    | false
  >;
  completeRegistration: (payload: CompleteRegistrationPayload) => Promise<boolean>;
  updateUser: (user: Student) => void;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      apiMessage: "",

      setAccessToken: (token) => set({ accessToken: token }),

      sendPhoneOtp: async (phoneNumber) => {
        set({ isLoading: true, apiMessage: "" });
        try {
          const response = await apiSendPhoneOtp(phoneNumber);
          set({
            isLoading: false,
            apiMessage: response.message || "OTP sent successfully",
          });
          return !response.error;
        } catch (error: any) {
          set({
            isLoading: false,
            apiMessage:
              error?.response?.data?.message || error?.message || "Failed to send OTP",
          });
          return false;
        }
      },

      verifyPhoneOtp: async (phoneNumber, otpCode) => {
        set({ isLoading: true, apiMessage: "" });
        try {
          const response = await apiVerifyPhoneOtp(phoneNumber, otpCode);

          if (!response.result) {
            set({ isLoading: false, apiMessage: response.message || "Invalid OTP" });
            return false;
          }

          const { result } = response;

          // New user — needs to complete registration.
          if (result.isNewUser) {
            set({ isLoading: false, apiMessage: "Please complete registration" });
            return { isNewUser: true };
          }

          // Existing user — tokens always issued by backend.
          // activeSessionExists is just an informational flag for the UI.
          set({
            user: result.user,
            isLoggedIn: true,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            isLoading: false,
            apiMessage: result.activeSessionExists
              ? "Logged out of previous device"
              : "Login successful",
          });

          return { isNewUser: false, activeSessionExists: !!result.activeSessionExists };
        } catch (error: any) {
          set({
            isLoading: false,
            apiMessage:
              error?.response?.data?.message ||
              error?.message ||
              "OTP verification failed",
          });
          return false;
        }
      },

      completeRegistration: async (payload) => {
        set({ isLoading: true, apiMessage: "" });
        try {
          const response = await apiCompleteRegistration(payload);

          if (!response.error && response.result) {
            set({
              user: response.result.user,
              isLoggedIn: true,
              accessToken: response.result.accessToken,
              refreshToken: response.result.refreshToken,
              isLoading: false,
              apiMessage: "Registration successful",
            });
            return true;
          }

          set({ isLoading: false, apiMessage: response.message || "Registration failed" });
          return false;
        } catch (error: any) {
          set({
            isLoading: false,
            apiMessage:
              error?.response?.data?.message || error?.message || "Something went wrong",
          });
          return false;
        }
      },

      updateUser: (user) => set({ user }),

      logout: async () => {
        // Guard against re-entrant calls triggered by the Axios interceptor's
        // refresh-failure path.
        if (!get().isLoggedIn && !get().accessToken) {
          return;
        }

        // Plain axios (NOT the intercepted `api` instance) so a 401 from this
        // call can't re-trigger the response interceptor and recurse back
        // into logout() — mirrors mobile's stores/authStore.ts.
        const currentToken = get().accessToken;
        if (currentToken) {
          try {
            const { default: axios } = await import("axios");
            await axios.post(
              `${API_BASE_URL}/auth/logout`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${currentToken}`,
                  "x-device-fingerprint": getWebSessionId(),
                },
              }
            );
          } catch {
            // Ignore — clearing local state is what matters.
          }
        }

        set({
          user: null,
          isLoggedIn: false,
          accessToken: null,
          refreshToken: null,
          apiMessage: "",
        });
      },

      restoreSession: async () => {
        // Access token is deliberately NOT persisted (see the token-storage
        // decision in WEB_APP_BLUEPRINT.md §10) — every fresh page load
        // starts with `accessToken: null`, even for an already-logged-in
        // student, so the only thing that can restore a session here is the
        // persisted refresh token.
        const { accessToken, refreshToken } = get();

        if (!accessToken) {
          if (!refreshToken) {
            return;
          }
          try {
            const newAccessToken = await refreshAccessToken(refreshToken);
            set({ accessToken: newAccessToken });
          } catch {
            await get().logout();
            return;
          }
        }

        try {
          const response = await apiGetCurrentStudent();
          if (response.error || !response.result) {
            await get().logout();
            return;
          }
          set({ user: response.result.student, isLoggedIn: true });
        } catch {
          await get().logout();
        }
      },
    }),
    {
      name: "noteswift-web-auth",
      storage: createJSONStorage(() => localStorage),
      // Rehydration is kicked off explicitly on the client (see Providers) so
      // the server-rendered markup never reads localStorage.
      skipHydration: true,
      // accessToken is deliberately excluded — see the token-storage decision
      // in WEB_APP_BLUEPRINT.md §10. Only the longer-lived refreshToken is
      // persisted (unavoidable without backend httpOnly-cookie support); the
      // access token lives in memory only and is re-minted from it via
      // restoreSession() on every fresh load, shrinking what a successful
      // XSS read of localStorage actually exposes to a token that's already
      // expired or about to be.
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
