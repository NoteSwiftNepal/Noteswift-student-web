"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { USE_MOCK_DATA, API_BASE_URL } from "@/config/app-config";
import { StudentProfile, initialMockDatabase } from "@/data/mockData";
import { api, normalizeStudent } from "@/services/api";

// Auto-intercept fetch requests to perform silent token refreshes in background
if (typeof window !== "undefined" && !(window as any)._fetchPatched) {
  (window as any)._fetchPatched = true;
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    
    // Only intercept backend API calls and avoid intercepting the /refresh call to prevent loop
    if (url && url.includes(API_BASE_URL) && !url.includes("/student/auth/refresh")) {
      let token = localStorage.getItem("studentToken");
      const refreshToken = localStorage.getItem("studentRefreshToken");
      const expiry = localStorage.getItem("studentLoginExpiry");
      const fingerprint = localStorage.getItem("studentDeviceFingerprint");
      
      if (token && refreshToken && expiry) {
        // If 1-month login session has expired
        if (Date.now() > Number(expiry)) {
          localStorage.removeItem("studentToken");
          localStorage.removeItem("studentRefreshToken");
          localStorage.removeItem("studentLoginExpiry");
          localStorage.removeItem("studentProfile");
          token = null;
        } else {
          // Decode token to check expiration. If it expires in less than 60 seconds, refresh it.
          const isExpired = (() => {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              return payload.exp * 1000 < Date.now() + 60 * 1000;
            } catch {
              return true;
            }
          })();
          
          if (isExpired && !USE_MOCK_DATA) {
            try {
              const res = await originalFetch(`${API_BASE_URL}/student/auth/refresh`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(fingerprint ? { "x-device-fingerprint": fingerprint } : {})
                },
                body: JSON.stringify({ refreshToken })
              });
              
              if (res.ok) {
                const data = await res.json();
                const newToken = data?.result?.accessToken;
                if (newToken) {
                  localStorage.setItem("studentToken", newToken);
                  token = newToken;
                  
                  // Update authorization header in the ongoing request configuration
                  if (init) {
                    if (!init.headers) {
                      init.headers = {};
                    }
                    if (init.headers instanceof Headers) {
                      init.headers.set("Authorization", `Bearer ${newToken}`);
                    } else if (Array.isArray(init.headers)) {
                      const idx = init.headers.findIndex(h => h[0].toLowerCase() === 'authorization');
                      if (idx !== -1) {
                        init.headers[idx] = ['Authorization', `Bearer ${newToken}`];
                      } else {
                        init.headers.push(['Authorization', `Bearer ${newToken}`]);
                      }
                    } else {
                      (init.headers as any)["Authorization"] = `Bearer ${newToken}`;
                    }
                  }
                }
              }
            } catch (err) {
              console.error("Failed to auto-refresh access token:", err);
            }
          }
        }
      }
    }
    return originalFetch.apply(this, [input, init]);
  };
}

interface StudentAuthContextType {
  student: StudentProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  loginWithPhone: (phoneNumber: string) => Promise<{ success: boolean; otp?: string; message?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; message?: string }>;
  registerWithPhone: (fullName: string, phoneNumber: string, email?: string, acceptTerms?: boolean) => Promise<{ success: boolean; otp?: string; message?: string }>;
  logout: () => void;
  updateProfile: (profileData: Partial<StudentProfile>) => Promise<{ success: boolean }>;
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verification temporary states
  const [pendingPhone, setPendingPhone] = useState<string>("");
  const [pendingRegData, setPendingRegData] = useState<{ fullName: string; email?: string } | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string>("");

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("studentToken");
      const expiry = localStorage.getItem("studentLoginExpiry");
      if (!token) {
        setStudent(null);
        return;
      }

      // Check if 1-month login session has expired
      if (expiry && Date.now() > Number(expiry)) {
        logout();
        return;
      }

      // Check cache first — render immediately from cache
      const cachedProfile = localStorage.getItem("studentProfile");
      if (cachedProfile && cachedProfile !== "undefined" && cachedProfile !== "null") {
        try {
          setStudent(JSON.parse(cachedProfile));
        } catch (e) {
          setStudent(null);
        }
      } else {
        if (USE_MOCK_DATA) {
          setStudent(initialMockDatabase.student);
          localStorage.setItem("studentProfile", JSON.stringify(initialMockDatabase.student));
        }
      }

      // Background refresh — only log out on explicit 401 (token invalid/expired)
      if (!USE_MOCK_DATA) {
        try {
          const res = await api.getProfile();
          if (res.success && res.data) {
            setStudent(res.data);
            localStorage.setItem("studentProfile", JSON.stringify(res.data));
          } else if (res.status === 401) {
            // Only logout on true 401 Unauthorized — token expired or invalid
            logout();
          }
          // On other failures (500, network, etc.) — keep the cached session alive
        } catch (profileErr) {
          // Network error — keep the cached session, do NOT logout
          console.warn("Profile refresh failed (network?), keeping cached session:", profileErr);
        }
      }
    } catch (err) {
      console.error("Student auth status check failed:", err);
      // Don't auto-logout on unexpected errors — let user stay logged in
    } finally {
      setLoading(false);
    }
  };

  const loginWithPhone = async (phoneNumber: string): Promise<{ success: boolean; otp?: string; message?: string }> => {
    try {
      setLoading(true);
      setError(null);
      const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);

      if (!USE_MOCK_DATA) {
        const response = await fetch(`${API_BASE_URL}/student/auth/send-phone-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: cleanPhone }),
        });
        const data = await response.json();
        if (!response.ok || data.error === true) {
          return { success: false, message: data.message || "Failed to send OTP" };
        }
        setPendingPhone(cleanPhone);
        setPendingRegData(null);
        return { success: true };
      }

      // Mock pathway
      await new Promise(resolve => setTimeout(resolve, 800));
      const otp = "123456";
      setGeneratedOtp(otp);
      setPendingPhone(cleanPhone);
      setPendingRegData(null);
      return { success: true, otp };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to send OTP" };
    } finally {
      setLoading(false);
    }
  };

  const registerWithPhone = async (fullName: string, phoneNumber: string, email?: string, acceptTerms?: boolean): Promise<{ success: boolean; otp?: string; message?: string }> => {
    try {
      setLoading(true);
      setError(null);
      if (!acceptTerms) {
        return { success: false, message: "You must accept the Terms and Conditions" };
      }
      const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);

      if (!USE_MOCK_DATA) {
        const response = await fetch(`${API_BASE_URL}/student/auth/send-phone-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: cleanPhone, purpose: "register", full_name: fullName, email }),
        });
        const data = await response.json();
        if (!response.ok || data.error === true) {
          return { success: false, message: data.message || "Failed to send OTP" };
        }
        setPendingPhone(cleanPhone);
        setPendingRegData({ fullName, email });
        return { success: true };
      }

      // Mock pathway
      await new Promise(resolve => setTimeout(resolve, 800));
      const otp = "123456";
      setGeneratedOtp(otp);
      setPendingPhone(cleanPhone);
      setPendingRegData({ fullName, email });
      return { success: true, otp };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to register" };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (otp: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (!USE_MOCK_DATA) {
        // Generate a stable browser fingerprint based on device characteristics.
        // Falls back to a persisted random ID so it survives page refreshes.
        let deviceFingerprint = typeof window !== "undefined" ? localStorage.getItem("studentDeviceFingerprint") : null;
        if (!deviceFingerprint) {
          // Build a deterministic fingerprint from browser/device traits
          const traits = [
            navigator.userAgent,
            navigator.language,
            screen.width,
            screen.height,
            screen.colorDepth,
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          ].join("|");
          // Simple hash
          let hash = 0;
          for (let i = 0; i < traits.length; i++) {
            hash = (Math.imul(31, hash) + traits.charCodeAt(i)) | 0;
          }
          deviceFingerprint = `web-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
          if (typeof window !== "undefined") {
            localStorage.setItem("studentDeviceFingerprint", deviceFingerprint);
          }
        }

        const response = await fetch(`${API_BASE_URL}/student/auth/verify-phone-otp`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-device-fingerprint": deviceFingerprint
          },
          body: JSON.stringify({
            phone_number: pendingPhone,
            otp_code: otp,
          }),
        });
        const data = await response.json();
        if (!response.ok || data.error === true) {
          return { success: false, message: data.message || "Verification failed" };
        }

        let resultData = data.result || {};
        // If it's a new user, complete registration
        if (resultData.isNewUser && pendingRegData) {
          const regRes = await fetch(`${API_BASE_URL}/student/auth/complete-registration`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "x-device-fingerprint": deviceFingerprint
            },
            body: JSON.stringify({
              phone_number: pendingPhone,
              full_name: pendingRegData.fullName,
              email: pendingRegData.email,
              stream: "SEE",
            }),
          });
          const regData = await regRes.json();
          if (!regRes.ok || regData.error === true) {
            return { success: false, message: regData.message || "Registration completion failed" };
          }
          resultData = regData.result || {};
        }

        const token = resultData.accessToken || resultData.token;
        const refreshToken = resultData.refreshToken;
        const rawUser = resultData.user || resultData.student;
        const normalized = normalizeStudent(rawUser);

        if (!token) {
          return { success: false, message: "Token not returned from server" };
        }

        // Set one month login expiry (30 days)
        const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000;

        localStorage.setItem("studentToken", token);
        if (refreshToken) {
          localStorage.setItem("studentRefreshToken", refreshToken);
        }
        localStorage.setItem("studentLoginExpiry", expiryTime.toString());
        localStorage.setItem("studentPhone", pendingPhone);
        localStorage.setItem("studentProfile", JSON.stringify(normalized));
        setStudent(normalized);
        return { success: true };
      }

      // Mock verify
      await new Promise(resolve => setTimeout(resolve, 800));
      if (otp !== generatedOtp && otp !== "123456") {
        return { success: false, message: "Invalid OTP code. Enter 123456 for demo." };
      }

      localStorage.setItem("studentToken", "mock-student-jwt-token-12345");
      localStorage.setItem("studentRefreshToken", "mock-student-refresh-token-12345");
      localStorage.setItem("studentLoginExpiry", (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
      localStorage.setItem("studentPhone", pendingPhone);

      if (pendingRegData) {
        const newStudent: StudentProfile = {
          id: `s-${Date.now()}`,
          fullName: pendingRegData.fullName,
          email: pendingRegData.email || "",
          phoneNumber: pendingPhone,
          avatarEmoji: "🎓",
          rollNo: Math.floor(Math.random() * 40) + 1,
          grade: "Grade 10 (Section A)",
          schoolName: "NoteSwift Academy",
          stream: "SEE",
          gpa: 3.5,
          attendancePercent: 100,
          weeklyStudyHours: 0,
          streakCount: 1,
        };
        localStorage.setItem("studentProfile", JSON.stringify(newStudent));
        setStudent(newStudent);
      } else {
        const isDemo = pendingPhone === "9841234567";
        if (isDemo) {
          localStorage.setItem("studentProfile", JSON.stringify(initialMockDatabase.student));
          setStudent(initialMockDatabase.student);
        } else {
          const guestStudent: StudentProfile = {
            id: `s-${Date.now()}`,
            fullName: "Guest Student",
            email: "",
            phoneNumber: pendingPhone,
            avatarEmoji: "🎒",
            rollNo: 24,
            grade: "Grade 10 (Section B)",
            schoolName: "NoteSwift Academy",
            stream: "SEE",
            gpa: 3.2,
            attendancePercent: 90,
            weeklyStudyHours: 4.5,
            streakCount: 1,
          };
          localStorage.setItem("studentProfile", JSON.stringify(guestStudent));
          setStudent(guestStudent);
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || "Verification failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentRefreshToken");
    localStorage.removeItem("studentLoginExpiry");
    localStorage.removeItem("studentPhone");
    localStorage.removeItem("studentProfile");
    localStorage.removeItem("noteswift_student_mock_db"); // Clear mock database too on complete logout for reset
    setStudent(null);
    setError(null);
    router.push("/login");
  };

  const updateProfile = async (profileData: Partial<StudentProfile>): Promise<{ success: boolean }> => {
    const res = await api.updateProfile(profileData);
    if (res.success && res.data) {
      setStudent(res.data);
      localStorage.setItem("studentProfile", JSON.stringify(res.data));
      return { success: true };
    }
    return { success: false };
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Synchronize streak count matching mobile app algorithm and keys
  useEffect(() => {
    if (!student || !student.id) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastAppOpenStr = localStorage.getItem("profile_last_app_open_date");
      const streakStr = localStorage.getItem("profile_login_streak");
      let lastAppOpen = lastAppOpenStr ? new Date(lastAppOpenStr) : null;
      if (lastAppOpen) lastAppOpen.setHours(0, 0, 0, 0);
      let streak = streakStr ? parseInt(streakStr, 10) : 0;

      if (!lastAppOpen) {
        streak = 1;
      } else {
        const diffDays = Math.floor((today.getTime() - lastAppOpen.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          // unchanged
        } else if (diffDays === 1) {
          streak += 1;
        } else if (diffDays > 1) {
          streak = 1;
        }
      }
      if (streak < 1) streak = 1;

      localStorage.setItem("profile_last_app_open_date", today.toISOString());
      localStorage.setItem("profile_login_streak", streak.toString());

      // If the calculated streak is different from current student.streakCount, update student state
      if (student.streakCount !== streak) {
        setStudent(prev => prev ? { ...prev, streakCount: streak } : null);
      }
    } catch (e) {
      console.error("Failed to update streak count:", e);
    }
  }, [student?.id]);

  const isAuthenticated = !!student;

  return (
    <StudentAuthContext.Provider
      value={{
        student,
        loading,
        error,
        isAuthenticated,
        loginWithPhone,
        verifyOtp,
        registerWithPhone,
        logout,
        updateProfile,
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);
  if (context === undefined) {
    throw new Error("useStudentAuth must be used within a StudentAuthProvider");
  }
  return context;
}
