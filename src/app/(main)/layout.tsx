"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppShell } from "@/components/app-shell/app-shell";

// An unauthenticated visitor hitting any (main) route is sent to /login.
// Kept simple per Phase 1 scope — no silent fingerprint re-login or
// mid-session logout race handling (blueprint's Phase 1 prompt).
export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
