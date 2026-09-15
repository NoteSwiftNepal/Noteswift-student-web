import api from "@/api/axios";
import type { CourseEnrollment } from "@/types/course";

// ─── Fonepay Checkout Intent (Phase 4) ──────────────────────────────────────
// Thin wrappers around the backend's initiate/verify routes
// (fonepayPaymentController.ts). Neither the signing private key nor any
// Fonepay credential is ever reachable from this file or anywhere else in
// this app — the backend is the only thing that ever talks to Fonepay
// directly, exactly as required.

export interface FonepayBankListItem {
  bankName: string;
  bankCode: string;
  bankIcon: string;
  packageName: string;
  // Already includes the trailing "://payment/" segment (confirmed against
  // a real bank-list response) — build the deep link as
  // `${intentScheme}?qrPayload=${encodeURIComponent(qrString)}`, don't
  // append "://payment/" again.
  intentScheme: string;
}

export interface InitiateFonepayResult {
  transactionId: string;
  // Fonepay's own reference (prn) — this, not transactionId above, is what
  // the verify call takes as its `transactionId` body field (matches the
  // backend's own naming; see fonepayPaymentController.ts's doc comment).
  prn: string;
  qrString: string;
  websocketId: string;
  bankList: FonepayBankListItem[];
}

// Mirrors LegacyApiResponse's {success:true, data} shape for the happy
// path, but success:false here is NOT the same shape as LegacyApiResponse
// (which pins data to null|undefined on failure) — the verify endpoint's
// 202 "still processing" response carries real data
// ({status:"processing"}) alongside success:false, so a dedicated type is
// used instead of forcing this into LegacyApiResponse<T>.
export type VerifyFonepayResult =
  | { success: true; data: { enrollment: CourseEnrollment; alreadyProcessed?: boolean }; message?: string }
  // "processing" = our own enrollment write is still catching up after a
  // confirmed-success claim; "pending" = Fonepay itself hasn't reported a
  // final outcome yet. Both are non-terminal and should be retried the
  // same way — see useFonepayCheckout's runVerify.
  | { success: false; data: { status: "processing" | "pending" }; message: string }
  | { success: false; data?: { status?: string } | null; message: string };

export interface InitiateFonepayResponse {
  success: boolean;
  data?: InitiateFonepayResult;
  message?: string;
  code?: string; // e.g. "FONEPAY_UNAVAILABLE"
}

export const initiateFonepayPayment = async (
  courseId: string
): Promise<InitiateFonepayResponse> => {
  const res = await api.post("/learn/fonepay/initiate", { courseId });
  return res.data;
};

// Idempotent on the backend — safe to call this more than once for the
// same transactionId (a WebSocket-triggered call, a manual "check status"
// tap, and this hook's own bounded retry on a 202 can all call it without
// risking a double enrollment).
export const verifyFonepayPayment = async (
  transactionId: string
): Promise<VerifyFonepayResult> => {
  const res = await api.post("/learn/fonepay/verify", { transactionId });
  return res.data;
};
