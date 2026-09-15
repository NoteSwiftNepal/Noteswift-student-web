"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  initiateFonepayPayment,
  verifyFonepayPayment,
  type FonepayBankListItem,
} from "@/api/student/fonepay";
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
  bankList: FonepayBankListItem[];
  enrollment: CourseEnrollment | null;
  errorMessage: string | null;
  // No websocket message has arrived within the grace window — doesn't
  // stop listening (a late message still resolves things correctly), just
  // tells the UI it's reasonable to surface the manual "check status"
  // fallback now instead of waiting indefinitely.
  showManualCheck: boolean;
}

const NO_MESSAGE_GRACE_MS = 45_000;
const VERIFY_RETRY_ATTEMPTS = 5;
const VERIFY_RETRY_DELAY_MS = 2_000;

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
 * socket never delivers anything.
 */
export function useFonepayCheckout(courseId: string, onEnrolled?: () => void) {
  const [stage, setStage] = useState<FonepayCheckoutStage>("idle");
  const [qrString, setQrString] = useState<string | null>(null);
  const [bankList, setBankList] = useState<FonepayBankListItem[]>([]);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showManualCheck, setShowManualCheck] = useState(false);

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

  const runVerify = useCallback(async () => {
    const prn = prnRef.current;
    if (!prn || verifyInFlightRef.current) return;
    verifyInFlightRef.current = true;
    setStage("confirming");

    try {
      for (let attempt = 0; attempt < VERIFY_RETRY_ATTEMPTS; attempt++) {
        const result = await verifyFonepayPayment(prn);

        if (result.success) {
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
          return;
        }

        // Any other success:false is a real, confirmed failure/rejection.
        setErrorMessage(result.message || "Payment could not be verified.");
        setStage("failed");
        closeSocket();
        clearGraceTimer();
        return;
      }
    } finally {
      verifyInFlightRef.current = false;
    }
  }, [closeSocket, clearGraceTimer, onEnrolled]);

  const connectSocket = useCallback(
    (websocketId: string) => {
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

        if (inner?.QRVerified) {
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
        wsRef.current = null;
      };
    },
    [clearGraceTimer, runVerify]
  );

  const start = useCallback(async () => {
    setStage("initiating");
    setErrorMessage(null);
    setEnrollment(null);
    setShowManualCheck(false);

    const res = await initiateFonepayPayment(courseId);
    if (!res.success || !res.data) {
      setErrorMessage(res.message || "Could not start payment. Please try again.");
      setStage("failed");
      return;
    }

    prnRef.current = res.data.prn;
    setQrString(res.data.qrString);
    setBankList(res.data.bankList || []);
    setStage("awaiting-payment");

    connectSocket(res.data.websocketId);

    graceTimerRef.current = setTimeout(() => {
      setShowManualCheck(true);
    }, NO_MESSAGE_GRACE_MS);
  }, [courseId, connectSocket]);

  // Mobile: the WebSocket is already connected by this point (opened as
  // soon as `awaiting-payment` was reached in start(), well before any
  // bank can be tapped) — this only needs to fire the deep link itself.
  const payWithBank = useCallback((bank: FonepayBankListItem) => {
    if (!qrString) return;
    const deepLink = `${bank.intentScheme}?qrPayload=${encodeURIComponent(qrString)}`;
    window.location.href = deepLink;
  }, [qrString]);

  const checkStatusManually = useCallback(() => {
    void runVerify();
  }, [runVerify]);

  const reset = useCallback(() => {
    closeSocket();
    clearGraceTimer();
    prnRef.current = null;
    verifyInFlightRef.current = false;
    setStage("idle");
    setQrString(null);
    setBankList([]);
    setEnrollment(null);
    setErrorMessage(null);
    setShowManualCheck(false);
  }, [closeSocket, clearGraceTimer]);

  const state: FonepayCheckoutState = {
    stage, qrString, bankList, enrollment, errorMessage, showManualCheck,
  };

  return { ...state, start, payWithBank, checkStatusManually, reset };
}
