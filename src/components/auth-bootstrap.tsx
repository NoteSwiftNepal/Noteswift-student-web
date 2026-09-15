"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";
import { setStreakBaseline } from "@/lib/streakBaseline";

// Rehydrates the persisted auth store from localStorage and validates the
// session against GET /auth/me before rendering anything — avoids a flash of
// unauthenticated content followed by a redirect once storage is read.
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await useAuthStore.persist.rehydrate();
      // Captured here, before restoreSession() overwrites `user` with a
      // fresh fetch — see streakBaseline.ts for why this has to happen at
      // exactly this point.
      setStreakBaseline(useAuthStore.getState().user?.currentStreak);
      await useAuthStore.getState().restoreSession();
      if (!cancelled) {
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
