"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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

interface FonepayCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  onEnrolled?: () => void;
}

/**
 * Fonepay Checkout Intent modal: mobile taps a bank -> deep link to that
 * bank's app; desktop scans a QR with any Fonepay-enabled bank app. Either
 * way, a WebSocket connected right after initiate (see useFonepayCheckout)
 * signals when to re-check status — the actual outcome always comes from
 * the backend's own verify call, never the socket message itself.
 */
export function FonepayCheckout({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  onEnrolled,
}: FonepayCheckoutProps) {
  const isMobile = useIsMobile();
  const [bankSearch, setBankSearch] = useState("");
  const {
    stage,
    qrString,
    bankList,
    errorMessage,
    showManualCheck,
    start,
    payWithBank,
    checkStatusManually,
    reset,
  } = useFonepayCheckout(courseId, onEnrolled);

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
    }
    onOpenChange(next);
  };

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
            {isMobile ? (
              <div className="w-full space-y-3">
                <div className="flex flex-col items-center gap-2">
                  <FonepayLogo variant="lockup" height={26} />
                  <p className="text-sm font-medium text-foreground">Select Payment Method</p>
                </div>
                <Input
                  placeholder="Search..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                />
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
                          variant="outline"
                          className="w-full justify-start gap-3"
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
            ) : (
              // Layout matches Fonepay's own "Desktop Preview" guideline page:
              // logo center-aligned above the QR, "Use your Mobile Banking or
              // Wallets App to scan" heading, QR, red Check Status button,
              // then the how-to-pay steps.
              <div className="flex w-full flex-col items-center gap-3">
                <FonepayLogo variant="lockup" height={28} />
                <p className="text-sm font-medium text-foreground">
                  Use your Mobile Banking or Wallets App to scan
                </p>
                {qrString && (
                  <div className="rounded-lg border bg-white p-4">
                    <QRCodeSVG value={qrString} size={220} />
                  </div>
                )}
                <Button
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
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Waiting for payment...
            </div>

            {isMobile && showManualCheck && (
              <Button
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
              <Button onClick={() => void start()}>Try again</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
