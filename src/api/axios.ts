import axios, { type InternalAxiosRequestConfig } from "axios";
import { getWebSessionId } from "@/lib/webSessionId";
import { useAuthStore } from "@/stores/authStore";

// Base URL resolution: explicit env override, else localhost in dev, else prod (blueprint §1, §4).
function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:5000/api/student";
  }

  return "https://api.noteswift.com.np/api/student";
}

export const API_BASE_URL = resolveBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// ─── Request interceptor ───────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  } else {
    delete config.headers.Authorization;
  }

  // Web platform's device-fingerprint equivalent (blueprint §5.3) — this is a
  // stand-in until the backend adds a separate web session slot; today it
  // will collide with the mobile app's single activeDeviceFingerprint slot.
  // Acceptable for local development only, not production, until that
  // backend change lands.
  config.headers["x-device-fingerprint"] = getWebSessionId();

  return config;
});

// ─── Silent refresh (blueprint §5.4) ───────────────────────────────────────
// This backend always answers with HTTP 200 and embeds the real status in
// the body (see JsonResponse in the backend), so a "401" can arrive either
// as an actual HTTP 401 or as `{ status: 401 }` inside a 200 — both must be
// handled (blueprint §5.1/§9).

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error || !token) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });
  failedQueue = [];
}

// Plain axios (NOT the intercepted `api` instance) so a failure here can't
// re-trigger this same response interceptor and recurse. Exported so
// authStore's restoreSession can mint a fresh access token on page load too
// (blueprint §5.4/§10 — see the access-token-is-memory-only decision there):
// since the access token is deliberately not persisted, every fresh page
// load starts with none, and a real access token has to come from here
// before the session can be restored, not just reactively on a 401.
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { "x-device-fingerprint": getWebSessionId() } }
  );

  const newAccessToken: string | undefined = res.data?.result?.accessToken;
  if (!newAccessToken) {
    throw new Error("No access token returned from refresh endpoint");
  }
  return newAccessToken;
}

async function handleTokenRefresh(originalRequest: InternalAxiosRequestConfig & { _retry?: boolean }) {
  // The refresh endpoint itself failing means the session is unrecoverable.
  if (originalRequest.url?.includes("/auth/refresh")) {
    useAuthStore.getState().logout();
    return Promise.reject(new Error("Refresh failed"));
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then((newToken) => {
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;

  const { refreshToken } = useAuthStore.getState();

  if (!refreshToken) {
    isRefreshing = false;
    useAuthStore.getState().logout();
    return Promise.reject(new Error("Missing refresh token"));
  }

  try {
    const newAccessToken = await refreshAccessToken(refreshToken);

    useAuthStore.getState().setAccessToken(newAccessToken);
    processQueue(null, newAccessToken);

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    useAuthStore.getState().logout();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

// ─── Response interceptor ─────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    const originalRequest = response.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (response.data?.status === 401 && !originalRequest._retry) {
      return handleTokenRefresh(originalRequest);
    }
    return response;
  },
  (error) => {
    const originalRequest = error?.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error?.response?.status === 401 && originalRequest && !originalRequest._retry) {
      return handleTokenRefresh(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
