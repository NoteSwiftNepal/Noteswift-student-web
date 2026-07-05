/**
 * Global application configuration for NoteSwift Student Web.
 * Toggle NEXT_PUBLIC_USE_MOCK_DATA environment variable or change the default boolean here:
 * - true: Use local preseeded mock data and mock databases (demo mode)
 * - false: Fetch from real backend APIs
 */
export const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === undefined
    ? true
    : process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.")) {
      return "http://localhost:5000/api";
    }
  } else if (process.env.NODE_ENV === "development") {
    return "http://localhost:5000/api";
  }

  return "https://api.noteswift.com.np/api";
};

export const API_BASE_URL = getApiBaseUrl();
