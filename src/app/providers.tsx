"use client";

import type { ReactNode } from "react";
import { QueryClientProvider, queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthBootstrap } from "@/components/auth-bootstrap";
import { StreakCelebrationProvider } from "@/components/streak-celebration";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        {children}
        <StreakCelebrationProvider />
      </AuthBootstrap>
      <Toaster />
    </QueryClientProvider>
  );
}
