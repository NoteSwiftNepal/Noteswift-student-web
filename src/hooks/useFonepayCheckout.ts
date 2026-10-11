"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  initiateFonepayPayment,
  verifyFonepayPayment,
  type FonepayBankListItem,
  type InitiateFonepayResult,
  type VerifyFonepayResult,
} from "@/api/student/fonepay";
import { useAuthStore } from "@/stores/authStore";
import type { CourseEnrollment } from "@/types/course";

export type FonepayCheckoutStage =
  | "idle"
  | "initiating"
  | "awaiting-payment"
  | "confirming"
  | "success"
  | "failed";

export interface FonepayCheckoutState {
  stage: FonepayCheckoutStage;
  qrString: string | null;
  // Epoch ms after which the QR is treated as expired (see expiresAt in
  // InitiateFonepayResult); null if the backend didn't send one.
  qrExpiresAt: number | null;
  bankList: FonepayBankListItem[];
  enrollment: CourseEnrollment | null;
  errorMessage: string | null;
  // No websocket message has arrived within the grace window — doesn't
  // stop listening (a late message still resolves things correctly), just
  // tells the UI it's reasonable to surface the manual "check status"
  // fallback now instead of waiting indefinitely.
  showManualCheck: boolean;
  // Non-error hint shown next to the QR/bank list, e.g. after a manual
  // check finds the payment hasn't been made yet.
  notice: string | null;
  // Desktop only: the Fonepay WebSocket dropped unexpectedly. Fonepay expires
  // a QR whose merchant socket disconnects, so this QR can't be paid anymore.
  socketLost: boolean;
}

const NO_MESSAGE_GRACE_MS = 45_000;
const VERIFY_RETRY_ATTEMPTS = 5;
const VERIFY_RETRY_DELAY_MS = 2_000;

// ─── Persisted attempt ──────────────────────────────────────────────────────
// Tapping a bank navigates away to the bank app, and mobile browsers often
// freeze or kill the page while it's in the background — an in-memory prn
// would be gone by the time the student comes back, leaving a paid
// transaction nobody ever verifies. The attempt is persisted so the
// checkout page can resume it and verify on return.
//
// Only an attempt that actually reached a bank app is ever resumed — that's
// the only case where the student may already have paid. One that never
// did is just an unused QR, so reopening checkout makes a fresh one instead
// of showing a stale QR (e.g. one issued before a Fonepay environment
// switch or a course price change). The backend sweep fails the abandoned
// transaction on its own.

const STORAGE_PREFIX = "fonepay-attempt:";
// Persistence is switched OFF while Fonepay is being tested: every Pay
// click (dialog closed and reopened) issues a fresh QR, and nothing is
// read from or written to localStorage. Set to true to turn resume back on.
const PERSIST_ATTEMPTS = false;
// Matches the backend's PENDING_EXPIRY_MS. An attempt that never reached a
// bank app is never resumed; this only bounds how long it stays stored for
// payWithBank to mark it as launched.
const UNLAUNCHED_RESUME_WINDOW_MS = 30 * 60 * 1000;
// Once a bank app was opened the student may have paid, so keep it longer
// (the backend sweep also enrolls paid-but-unverified attempts on its own).
const LAUNCHED_RESUME_WINDOW_MS = 24 * 60 * 60 * 1000;

interface StoredAttempt extends Omit<InitiateFonepayResult, "transactionId"> {
  startedAt: number;
  bankLaunched: boolean;
}

function storageKey(userId: string, courseId: string) {
  return `${STORAGE_PREFIX}${userId}:${courseId}`;
}

function readAttempt(userId: string | undefined, courseId: string): StoredAttempt | null {
  if (!PERSIST_ATTEMPTS || !userId) return null;
  try {
    const raw = localStorage.getItem(storageKey(userId, courseId));
    if (!raw) return null;
    const attempt = JSON.parse(raw) as StoredAttempt;
    const window = attempt.bankLaunched ? LAUNCHED_RESUME_WINDOW_MS : UNLAUNCHED_RESUME_WINDOW_MS;
    if (!attempt.prn || Date.now() - attempt.startedAt > window) {
      localStorage.removeItem(storageKey(userId, courseId));
      return null;
    }
    return attempt;
  } catch {
    return null;
  }
}

function writeAttempt(userId: string | undefined, courseId: string, attempt: StoredAttempt) {
  if (!PERSIST_ATTEMPTS || !userId) return;
  try {
    localStorage.setItem(storageKey(userId, courseId), JSON.stringify(attempt));
  } catch {
    // Storage unavailable (private mode etc.) — the flow still works, it
    // just can't be resumed after a reload.
  }
}

export function clearFonepayAttempt(userId: string | undefined, courseId: string) {
  if (!userId) return;
  try {
    localStorage.removeItem(storageKey(userId, courseId));
  } catch {
    // ignore
  }
}

// The stored attempt, but only if a bank app was opened for it (see the
// section comment above); an unlaunched one is discarded on the spot.
function readResumableAttempt(userId: string | undefined, courseId: string): StoredAttempt | null {
  const attempt = readAttempt(userId, courseId);
  if (attempt && !attempt.bankLaunched) {
    clearFonepayAttempt(userId, courseId);
    return null;
  }
  return attempt;
}

/** True when there's an unfinished attempt the checkout page should reopen. */
export function hasResumableFonepayAttempt(userId: string | undefined, courseId: string) {
  return readResumableAttempt(userId, courseId) !== null;
}

// axios rejects every non-2xx, but this backend's Fonepay routes use real
// status codes (400/403/404/500/503) with a JSON body — pull the body back
// out so callers can handle it like any other response.
function errorBody(err: any): { status?: number; data?: any } {
  return { status: err?.response?.status, data: err?.response?.data };
}

// Android browsers lowercase a URL's scheme ("fonepayApp://" becomes
// "fonepayapp://") while Android matches intent-filter schemes
// case-sensitively — so the Fonepay App, the one entry in the bank list
// with a mixed-case scheme, never opened even when installed. Chrome's
// intent:// syntax carries the scheme in the fragment, untouched, and is
// also supported by Samsung Internet/Firefox. No package= on purpose:
// several bank-list "packageName" values are activity names, not packages.
// iOS matches schemes case-insensitively, so the plain link works there.
function buildBankDeepLink(intentScheme: string, qrString: string) {
  const plain = `${intentScheme}?qrPayload=${encodeURIComponent(qrString)}`;
  if (!/Android/i.test(navigator.userAgent)) return plain;
  const sep = plain.indexOf("://");
  if (sep < 0) return plain;
  const scheme = plain.slice(0, sep);
  const rest = plain.slice(sep + 3);
  return `intent://${rest}#Intent;scheme=${scheme};end`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Orchestrates one Fonepay Checkout Intent attempt for a course: initiate ->
 * (QR shown on desktop / bank list shown on mobile) -> WebSocket listens for
 * a payment result -> verify (the ONLY thing that can ever confirm success
 * — the WebSocket message is a signal to re-check, never proof, matching
 * the same invariant the backend itself enforces). A manual "check status"
 * path (checkStatusManually) calls the exact same verify function and goes
 * through the exact same outcome handling, so it's safe to use if the
 * socket never delivers anything. The attempt is persisted (see above) and
 * re-verified whenever the page becomes visible again after a bank app was
 * opened.
 */
/**
 * liveUpdates: open Fonepay's WebSocket for instant payment notifications.
 * Pass false on phones/tablets. Confirmed live 2026-09-30: when the
 * merchant-side socket disconnects, Fonepay expires the QR ("QR has
 * expired" in the bank app). A phone browser suspends the page, dropping
 * the socket, the moment the student switches to their bank app — to pay
 * via the deep link or to scan a screenshot — so with a socket open the QR
 * was always dead by the time the bank app read it. Without one, the page
 * checks the payment when the student comes back, plus Check Status.
 */
export function useFonepayCheckout(
  courseId: string,
  onEnrolled?: () => void,
  opts?: { liveUpdates?: boolean; discountCode?: string }
) {
  const liveUpdatesRef = useRef(opts?.liveUpdates ?? true);
  liveUpdatesRef.current = opts?.liveUpdates ?? true;
  const discountCode = opts?.discountCode;
  const userId = useAuthStore((s) => s.user?.id);
  const [stage, setStage] = useState<FonepayCheckoutStage>("idle");
  const [qrString, setQrString] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<number | null>(null);
  const [bankList, setBankList] = useState<FonepayBankListItem[]>([]);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showManualCheck, setShowManualCheck] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [socketLost, setSocketLost] = useState(false);

  // Refs, not state — these drive imperative cleanup/dedup logic and don't
  // need to trigger re-renders themselves.
  const prnRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against the socket delivering a second payment-result message
  // (e.g. a retransmit) while a verify call for the first one is already
  // in flight — the backend's own verify is idempotent regardless, but
  // there's no reason to fire it twice concurrently from one client.
  const verifyInFlightRef = useRef(false);
  // Only auto-verify on return to the page once a bank app was actually
  // opened — checking an unscanned QR's status early gains nothing.
  const bankLaunchedRef = useRef(false);
  const stageRef = useRef<FonepayCheckoutStage>("idle");
  stageRef.current = stage;

  const closeSocket = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const clearGraceTimer = useCallback(() => {
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      closeSocket();
      clearGraceTimer();
    };
  }, [closeSocket, clearGraceTimer]);

  // manual: the student tapped Check Status. A "not paid yet" answer then
  // goes straight back to the QR with a notice instead of spinning through
  // retries — those are only worth it when something says a payment just
  // happened (socket message, returning from the bank app).
  const runVerify = useCallback(async (opts?: { manual?: boolean }) => {
    const prn = prnRef.current;
    if (!prn || verifyInFlightRef.current) return;
    verifyInFlightRef.current = true;
    setNotice(null);
    setStage("confirming");

    try {
      for (let attempt = 0; attempt < VERIFY_RETRY_ATTEMPTS; attempt++) {
        let result: VerifyFonepayResult;
        try {
          result = await verifyFonepayPayment(prn);
        } catch (err) {
          const { status, data } = errorBody(err);
          // 400/403/404 are the backend's definitive "no" — anything else
          // (network error, 5xx such as "couldn't reach Fonepay") says
          // nothing about the payment itself, so it's retried like a 202.
          result =
            status && status >= 400 && status < 500 && status !== 401 && data
              ? data
              : { success: false, data: { status: "pending" }, message: "Could not reach the server." };
        }

        if (result.success) {
          clearFonepayAttempt(userId, courseId);
          setEnrollment(result.data.enrollment);
          setStage("success");
          closeSocket();
          clearGraceTimer();
          onEnrolled?.();
          return;
        }

        // 202 "still not final" — either our own enrollment write is still
        // catching up after a confirmed claim ("processing"), or Fonepay
        // itself hasn't reported a final outcome yet ("pending"). Neither
        // is success or failure yet, so both retry the same way rather
        // than surfacing either state to the user prematurely.
        if (result.data?.status === "processing" || result.data?.status === "pending") {
          if (opts?.manual && result.data.status === "pending") {
            setStage("awaiting-payment");
            setNotice("We haven't received your payment yet. Complete it in your banking app, then check again.");
            return;
          }
          if (attempt < VERIFY_RETRY_ATTEMPTS - 1) {
            await sleep(VERIFY_RETRY_DELAY_MS);
            continue;
          }
          // Exhausted retries — still not confirmed either way. Don't
          // declare failure; fall back to "awaiting", with the manual
          // check surfaced so the user (or a later click) can try again
          // once enrollment actually finishes server-side.
          setStage("awaiting-payment");
          setShowManualCheck(true);
          setNotice("We couldn't confirm your payment yet. If you've paid, check again in a moment.");
          return;
        }

        // Any other success:false is a real, confirmed failure/rejection.
        clearFonepayAttempt(userId, courseId);
        setErrorMessage(result.message || "Payment could not be verified.");
        setStage("failed");
        closeSocket();
        clearGraceTimer();
        return;
      }
    } finally {
      verifyInFlightRef.current = false;
    }
  }, [userId, courseId, closeSocket, clearGraceTimer, onEnrolled]);

  const connectSocket = useCallback(
    (websocketId: string) => {
      closeSocket();
      let ws: WebSocket;
      try {
        ws = new WebSocket(websocketId);
      } catch {
        // A malformed/unreachable URL shouldn't crash the flow — the
        // manual check fallback still works without the socket at all.
        setShowManualCheck(true);
        return;
      }
      wsRef.current = ws;

      ws.onmessage = (event) => {
        let outer: any;
        try {
          outer = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!outer?.transactionStatus) return;

        // transactionStatus arrives as a JSON STRING nested inside the
        // outer message, not a nested object — needs its own parse.
        let inner: any;
        try {
          inner = JSON.parse(outer.transactionStatus);
        } catch {
          return;
        }

        // Live messages spell it "qrVerified"; the API doc says "QRVerified".
        if (inner?.qrVerified || inner?.QRVerified) {
          // Scan confirmed — payment isn't complete yet, just a UI signal
          // that something is happening. No verify call yet.
          return;
        }

        if (typeof inner?.paymentSuccess === "boolean") {
          // Whether this claims success OR failure, the socket is never
          // trusted alone — runVerify's own fresh server-to-server check
          // is what actually decides the outcome either way.
          clearGraceTimer();
          void runVerify();
        }
      };

      ws.onerror = () => {
        setShowManualCheck(true);
      };

      ws.onclose = () => {
        // wsRef still pointing at this socket means we didn't close it
        // ourselves (closeSocket clears the ref first): it dropped. The QR
        // is now expired on Fonepay's side, so check once in case it was
        // paid just before, then offer a new QR.
        if (wsRef.current !== ws) return;
        wsRef.current = null;
        if (stageRef.current === "awaiting-payment" || stageRef.current === "confirming") {
          setSocketLost(true);
          void runVerify({ manual: true });
        }
      };
    },
    [closeSocket, clearGraceTimer, runVerify]
  );

  // Resumes an attempt that reached a bank app, otherwise starts a new one
  // — pass fresh: true to discard any stored attempt, e.g. "Try again"
  // after a failure.
  const start = useCallback(
    async (opts?: { fresh?: boolean }) => {
      closeSocket();
      clearGraceTimer();
      setErrorMessage(null);
      setEnrollment(null);
      setShowManualCheck(false);
      setNotice(null);
      setSocketLost(false);

      if (opts?.fresh) clearFonepayAttempt(userId, courseId);
      const stored = readResumableAttempt(userId, courseId);

      let attempt: StoredAttempt;
      if (stored) {
        attempt = stored;
      } else {
        setStage("initiating");
        let res;
        try {
          res = await initiateFonepayPayment(courseId, discountCode);
        } catch (err) {
          res = errorBody(err).data ?? { success: false };
        }
        if (!res.success || !res.data) {
          setErrorMessage(res.message || "Could not start payment. Please try again.");
          setStage("failed");
          return;
        }
        const { transactionId: _unused, ...rest } = res.data;
        attempt = { ...rest, startedAt: Date.now(), bankLaunched: false };
        writeAttempt(userId, courseId, attempt);
      }

      prnRef.current = attempt.prn;
      bankLaunchedRef.current = attempt.bankLaunched;
      setQrString(attempt.qrString);
      setQrExpiresAt(attempt.expiresAt ? Date.parse(attempt.expiresAt) : null);
      setBankList(attempt.bankList || []);
      setStage("awaiting-payment");

      if (liveUpdatesRef.current) {
        connectSocket(attempt.websocketId);
      } else {
        // No socket to tell us about the payment, so Check Status is the
        // way to ask; show it straight away instead of after the grace period.
        setShowManualCheck(true);
      }

      if (attempt.bankLaunched) {
        // Resuming after the bank app — the socket message may well have
        // been missed while this page was gone, so check right away.
        setShowManualCheck(true);
        void runVerify();
        return;
      }

      graceTimerRef.current = setTimeout(() => {
        setShowManualCheck(true);
      }, NO_MESSAGE_GRACE_MS);
    },
    [userId, courseId, discountCode, closeSocket, clearGraceTimer, connectSocket, runVerify]
  );

  // Coming back from the bank app: the socket was likely suspended (or
  // dropped) while the page was hidden, so don't wait for it — re-check
  // straight away. pageshow covers a back/forward-cache restore.
  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      if (!prnRef.current) return;
      if (stageRef.current !== "awaiting-payment") return;
      if (bankLaunchedRef.current) {
        // Opened a bank app: the payment may still be settling, so retry.
        setShowManualCheck(true);
        void runVerify();
      } else if (!liveUpdatesRef.current) {
        // No socket (phone/tablet), e.g. back from scanning a screenshot of
        // the QR in a bank app: check once.
        void runVerify({ manual: true });
      }
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("pageshow", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("pageshow", onReturn);
    };
  }, [runVerify]);

  // Mobile: the WebSocket is already connected by this point (opened as
  // soon as `awaiting-payment` was reached in start(), well before any
  // bank can be tapped) — this only needs to fire the deep link itself.
  const payWithBank = useCallback(
    (bank: FonepayBankListItem) => {
      if (!qrString) return;
      bankLaunchedRef.current = true;
      const stored = readAttempt(userId, courseId);
      if (stored) writeAttempt(userId, courseId, { ...stored, bankLaunched: true, startedAt: Date.now() });
      window.location.href = buildBankDeepLink(bank.intentScheme, qrString);
    },
    [qrString, userId, courseId]
  );

  // Drops the current QR and asks the backend for a new one (new
  // transaction and reference), e.g. after it expired or a bank app
  // rejected it. The chosen payment method is the component's, so it stays.
  const refreshQr = useCallback(() => {
    void start({ fresh: true });
  }, [start]);

  const checkStatusManually = useCallback(() => {
    void runVerify({ manual: true });
  }, [runVerify]);

  // Clears in-memory state only — a stored attempt that reached a bank app
  // survives closing the dialog, so a student who paid and then closed it
  // still gets verified when they reopen checkout.
  const reset = useCallback(() => {
    closeSocket();
    clearGraceTimer();
    prnRef.current = null;
    bankLaunchedRef.current = false;
    verifyInFlightRef.current = false;
    setStage("idle");
    setQrString(null);
    setQrExpiresAt(null);
    setBankList([]);
    setEnrollment(null);
    setErrorMessage(null);
    setShowManualCheck(false);
    setNotice(null);
    setSocketLost(false);
  }, [closeSocket, clearGraceTimer]);

  const state: FonepayCheckoutState = {
    stage, qrString, qrExpiresAt, bankList, enrollment, errorMessage, showManualCheck, notice, socketLost,
  };

  return { ...state, start, refreshQr, payWithBank, checkStatusManually, reset };
}
