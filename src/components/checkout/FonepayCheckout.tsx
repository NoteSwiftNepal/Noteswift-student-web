"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  QrCode,
  Landmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useFonepayCheckout } from "@/hooks/useFonepayCheckout";
import { FonepayLogo } from "@/components/checkout/FonepayLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { FonepayBankListItem } from "@/api/student/fonepay";

// Ranks banks by how closely their name matches the query — exact match >
// starts-with > substring (earlier position wins) > in-order fuzzy
// subsequence (fewer gaps wins) — so typing narrows the list to the
// closest matches first instead of just filtering in the original order.
// An empty query returns the list untouched (original API order).
function rankBanks(banks: FonepayBankListItem[], query: string): FonepayBankListItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return banks;

  const scored = banks
    .map((bank) => {
      const name = bank.bankName.toLowerCase();
      let score = -1;

      if (name === q) {
        score = 1000;
      } else if (name.startsWith(q)) {
        score = 800 - name.length;
      } else {
        const idx = name.indexOf(q);
        if (idx >= 0) {
          score = 500 - idx;
        } else {
          // In-order character subsequence match (e.g. "nbl" -> "Nabil"),
          // penalized by how spread out the matched characters are.
          let qi = 0;
          let gaps = 0;
          let lastIdx = -1;
          for (let i = 0; i < name.length && qi < q.length; i++) {
            if (name[i] === q[qi]) {
              if (lastIdx >= 0) gaps += i - lastIdx - 1;
              lastIdx = i;
              qi++;
            }
          }
          if (qi === q.length) {
            score = 100 - gaps;
          }
        }
      }

      return { bank, score };
    })
    .filter((entry) => entry.score > -1)
    .sort((a, b) => b.score - a.score);

  return scored.map((entry) => entry.bank);
}

// Fixed (not max-) height, ~6 rows tall — Radix ScrollArea's Viewport uses
// h-full internally, which only resolves against a parent with a definite
// height; max-height alone leaves the parent's computed height as 'auto',
// so overflow content gets clipped by Root's overflow-hidden instead of
// becoming scrollable. A real Fonepay bank list (21 banks) always exceeds
// this, so the empty space a short filtered result leaves is an acceptable
// tradeoff for scrolling actually working.
const BANK_LIST_HEIGHT = 280;

// Phones and tablets: anything narrower than a laptop, or any touch-first
// device (an iPad in landscape is wider than 1024px but still handheld).
// These get a choice between scanning the QR and opening a bank app;
// desktops only ever see the QR.
const HANDHELD_QUERY = "(max-width: 1023px), (pointer: coarse)";

function useIsHandheld() {
  // Read synchronously on the client: this decides whether the payment
  // opens a Fonepay socket, so it must be right before the first QR.
  const [handheld, setHandheld] = useState(
    () => typeof window !== "undefined" && window.matchMedia(HANDHELD_QUERY).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(HANDHELD_QUERY);
    const update = () => setHandheld(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return handheld;
}

type PayMethod = "qr" | "bank";

// Seconds left until expiresAt, ticking once a second; null without one.
function useSecondsLeft(expiresAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (expiresAt === null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return expiresAt === null ? null : Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

function formatCountdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

interface FonepayCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  onEnrolled?: () => void;
  // Promo code applied at checkout; the backend re-validates it and prices the QR.
  discountCode?: string;
  // The student applied the course's own discount at checkout.
  applyDiscount?: boolean;
}

/**
 * Fonepay Checkout Intent modal. Desktop shows the QR to scan with any
 * Fonepay-enabled bank app. Phones and tablets first choose between that QR
 * and "pay via bank app" (tap a bank -> deep link into it), with a Back
 * button to switch between the two. Either way, a WebSocket connected right after initiate (see useFonepayCheckout)
 * signals when to re-check status — the actual outcome always comes from
 * the backend's own verify call, never the socket message itself.
 */
export function FonepayCheckout({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  onEnrolled,
  discountCode,
  applyDiscount,
}: FonepayCheckoutProps) {
  const isHandheld = useIsHandheld();
  // null = handheld user hasn't picked yet (shows the chooser).
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [bankSearch, setBankSearch] = useState("");
  const {
    stage,
    qrString,
    qrExpiresAt,
    bankList,
    errorMessage,
    showManualCheck,
    notice,
    start,
    payWithBank,
    checkStatusManually,
    refreshQr,
    reset,
    socketLost,
  } = useFonepayCheckout(courseId, onEnrolled, { liveUpdates: !isHandheld, discountCode, applyDiscount });

  const secondsLeft = useSecondsLeft(qrExpiresAt);
  // Past our display window, or dead on Fonepay's side after its socket
  // dropped (desktop only) — either way this QR can't be paid.
  const qrExpired = secondsLeft === 0 || socketLost;

  const filteredBankList = useMemo(() => rankBanks(bankList, bankSearch), [bankList, bankSearch]);

  // The dialog's `open` prop is driven externally (the checkout page calls
  // setFonepayOpen(true) directly), so Radix's own onOpenChange — which
  // only fires for its own close interactions (ESC, overlay click, the X
  // button) — never sees that opening transition. Watching `open` directly
  // is what actually catches it.
  useEffect(() => {
    if (open && stage === "idle") {
      void start();
    }
  }, [open, stage, start]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      setBankSearch("");
      setMethod(null);
    }
    onOpenChange(next);
  };

  const backButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 gap-1 self-start text-muted-foreground"
      onClick={() => setMethod(null)}
    >
      <ChevronLeft className="size-4" />
      Back
    </Button>
  );

  // Shown under the QR and the bank list: a live countdown for the current
  // QR, then an expired notice with a button that fetches a new one (keeps
  // the chosen method; a new transaction and reference are created).
  const expiryLine =
    qrExpired ? (
      <div className="flex w-full flex-col items-center gap-2">
        <p className="text-sm font-medium text-destructive">
          {socketLost ? "This QR is no longer valid" : "This QR has expired"}
        </p>
        <Button type="button" variant="outline" className="gap-2" onClick={refreshQr}>
          <RefreshCw className="size-3.5" />
          Get a new QR
        </Button>
      </div>
    ) : secondsLeft === null ? null : (
      <p className="text-xs text-muted-foreground" aria-live="polite">
        QR expires in{" "}
        <span className={`font-mono font-semibold ${secondsLeft <= 30 ? "text-destructive" : "text-foreground"}`}>
          {formatCountdown(secondsLeft)}
        </span>
      </p>
    );

  // Layout matches Fonepay's own "Desktop Preview" guideline page: logo
  // center-aligned above the QR, "Use your Mobile Banking or Wallets App to
  // scan" heading, QR, red Check Status button, then the how-to-pay steps.
  const qrView = (
    <div className="flex w-full flex-col items-center gap-3">
      <FonepayLogo variant="lockup" height={28} />
      <p className="text-sm font-medium text-foreground">
        Use your Mobile Banking or Wallets App to scan
      </p>
      {qrString && (
        <div className={`rounded-lg border bg-white p-4 ${qrExpired ? "opacity-30" : ""}`}>
          <QRCodeSVG value={qrString} size={220} />
        </div>
      )}
      {expiryLine}
      <Button
        type="button"
        onClick={checkStatusManually}
        className="w-full gap-2"
        style={{ backgroundColor: "#ce2027", color: "#ffffff" }}
      >
        <RefreshCw className="size-3.5" />
        Check Status
      </Button>
      <ol className="w-full list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
        <li>Open your mobile banking app or digital wallet.</li>
        <li>Log in, or simply tap the scan button (login not always required).</li>
        <li>Scan the QR code.</li>
        <li>Verify the payment details.</li>
        <li>Tap Confirm to complete your payment.</li>
      </ol>
    </div>
  );

  const bankView = (
    <div className="w-full space-y-3">
      <div className="flex flex-col items-center gap-2">
        <FonepayLogo variant="lockup" height={26} />
        <p className="text-sm font-medium text-foreground">Select your bank or wallet</p>
      </div>
      <Input
        placeholder="Search..."
        value={bankSearch}
        onChange={(e) => setBankSearch(e.target.value)}
      />
      <div className="flex justify-center">{expiryLine}</div>
      <ScrollArea style={{ height: BANK_LIST_HEIGHT }} className="rounded-lg border">
        <div className="space-y-1 p-1.5">
          {filteredBankList.length === 0 ? (
            <p className="p-3 text-center text-xs text-muted-foreground">
              No matching bank or wallet found.
            </p>
          ) : (
            filteredBankList.map((bank) => (
              <Button
                key={bank.bankCode}
                type="button"
                variant="outline"
                className="w-full justify-start gap-3"
                disabled={qrExpired}
                onClick={() => payWithBank(bank)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bank.bankIcon} alt="" className="size-6 shrink-0 rounded" />
                {bank.bankName}
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const methodOption = (value: PayMethod, Icon: typeof QrCode, title: string, subtitle: string) => (
    <button
      type="button"
      onClick={() => setMethod(value)}
      className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary"
    >
      <Icon className="size-6 shrink-0 text-primary" />
      <span className="flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );

  const chooserView = (
    <div className="w-full space-y-3">
      <div className="flex flex-col items-center gap-2">
        <FonepayLogo variant="lockup" height={26} />
        <p className="text-sm font-medium text-foreground">How would you like to pay?</p>
      </div>
      {methodOption("bank", Landmark, "Pay via bank app", "Open your mobile banking or wallet app directly")}
      {methodOption("qr", QrCode, "Scan QR code", "Show a QR to scan with your banking app")}
    </div>
  );

  let paymentView = qrView;
  if (isHandheld) {
    paymentView =
      method === null ? chooserView : (
        <div className="flex w-full flex-col gap-2">
          {backButton}
          {method === "qr" ? qrView : bankView}
        </div>
      );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FonepayLogo variant="mark" height={24} />
          </DialogTitle>
          <DialogDescription>{courseTitle}</DialogDescription>
        </DialogHeader>

        {(stage === "idle" || stage === "initiating") && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Setting up your payment...</p>
          </div>
        )}

        {stage === "awaiting-payment" && (
          <div className="flex flex-col items-center gap-4 py-4">
            {paymentView}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Waiting for payment...
            </div>

            {notice && (
              <p className="text-center text-xs text-muted-foreground">{notice}</p>
            )}

            {/* QRs are single-use: once one has been opened in a bank app and
                abandoned, the bank app calls it expired. */}
            <button
              type="button"
              onClick={refreshQr}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              QR expired? Generate new one
            </button>

            {/* The QR view has its own Check Status button; elsewhere on a
                handheld it appears once the no-message grace period passes. */}
            {isHandheld && method !== "qr" && showManualCheck && (
              <Button
                type="button"
                size="sm"
                onClick={checkStatusManually}
                className="gap-2"
                style={{ backgroundColor: "#ce2027", color: "#ffffff" }}
              >
                <RefreshCw className="size-3.5" />
                Check Status
              </Button>
            )}
          </div>
        )}

        {stage === "confirming" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Confirming your payment...</p>
          </div>
        )}

        {stage === "success" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="size-10 text-emerald-500" />
            <p className="text-sm font-medium text-foreground">Payment successful!</p>
            <p className="text-center text-xs text-muted-foreground">
              You're now enrolled in {courseTitle}.
            </p>
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          </div>
        )}

        {stage === "failed" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <XCircle className="size-10 text-destructive" />
            <p className="text-sm font-medium text-foreground">Payment failed</p>
            <p className="text-center text-xs text-muted-foreground">
              {errorMessage || "Something went wrong. Please try again."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setMethod(null);
                  void start({ fresh: true });
                }}
              >
                Try again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
