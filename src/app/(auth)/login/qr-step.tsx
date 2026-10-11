"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, RefreshCw } from "lucide-react";
import { createQrLogin, getQrLoginStatus } from "@/api/student/auth";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Must match the prefix the mobile scanner (app/Settings/DesktopMode.tsx) accepts.
const QR_PREFIX = "noteswift-login:";
const POLL_MS = 2000;

type State = "loading" | "ready" | "expired" | "error" | "approved";

export function QrStep({ onLoggedIn }: { onLoggedIn: () => void }) {
  const setSession = useAuthStore((s) => s.setSession);
  const [code, setCode] = useState<string | null>(null);
  const [state, setState] = useState<State>("loading");

  const generate = useCallback(async () => {
    setState("loading");
    try {
      const res = await createQrLogin();
      if (res.error || !res.result) throw new Error(res.message);
      setCode(res.result.code);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    generate();
  }, [generate]);

  // Poll until the phone approves or the code expires. Sequential (next poll
  // only after the previous reply) so a slow "expired" reply can never land
  // after — and override — the "approved" one. A fresh code only on click,
  // so an idle tab doesn't burn the create rate limit.
  useEffect(() => {
    if (state !== "ready" || !code) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const res = await getQrLoginStatus(code);
        if (stopped) return;
        if (res.result?.status === "approved") {
          stopped = true;
          setState("approved");
          setSession(res.result);
          onLoggedIn();
          return;
        }
        if (res.result?.status === "expired") {
          setState("expired");
          return;
        }
      } catch {
        // transient network blip, next tick retries
      }
      if (!stopped) timer = setTimeout(poll, POLL_MS);
    };
    timer = setTimeout(poll, POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [state, code, setSession, onLoggedIn]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative size-[232px] rounded-2xl border border-border bg-white p-3 shadow-sm">
        {state === "loading" || !code ? (
          <Skeleton className="size-full rounded-xl" />
        ) : (
          <QRCodeSVG
            value={QR_PREFIX + code}
            size={206}
            level="H"
            fgColor="#18181b"
            bgColor="#ffffff"
            className={state === "ready" ? "" : "opacity-15 blur-[2px] transition"}
            imageSettings={{ src: "/logo.png", width: 48, height: 48, excavate: true }}
          />
        )}

        {(state === "expired" || state === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-medium text-zinc-700">
              {state === "expired" ? "This code expired" : "Couldn't load a code"}
            </p>
            <Button size="sm" onClick={generate} className="gap-2 active:scale-[0.98]">
              <RefreshCw className="size-4" />
              New code
            </Button>
          </div>
        )}

        {state === "approved" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-zinc-700">Signing you in</p>
          </div>
        )}
      </div>

      <ol className="w-full space-y-2.5 text-sm text-muted-foreground">
        <li className="flex gap-3">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
          Open NoteSwift on your phone
        </li>
        <li className="flex gap-3">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
          <span>
            Go to <span className="font-medium text-foreground">More</span>, then{" "}
            <span className="font-medium text-foreground">Linked Desktop</span>
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
          Point your phone at this code
        </li>
      </ol>
    </div>
  );
}
