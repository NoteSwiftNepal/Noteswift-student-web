"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useStudentAuth } from "@/context/student-auth-context";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
}

/**
 * AuthGuard - Protects routes that require a logged-in student
 */
export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo,
  fallback,
}: AuthGuardProps) {
  const { isAuthenticated, loading } = useStudentAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !isAuthenticated) {
      router.replace(redirectTo || "/login");
      return;
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router]);

  if (loading) {
    return fallback || <LoadingScreen />;
  }

  const shouldRender = !requireAuth || isAuthenticated;

  return shouldRender ? <>{children}</> : fallback || null;
}

/**
 * LoginGuard - Redirects logged-in students away from the login page to the dashboard
 */
export function LoginGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useStudentAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    router.replace("/dashboard");
  }, [isAuthenticated, loading, router]);

  if (loading) return <LoadingScreen />;

  return <>{!isAuthenticated ? children : null}</>;
}

/**
 * DashboardGuard - Requires login, redirects to /login if not authenticated
 */
export function DashboardGuard({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireAuth redirectTo="/login">
      {children}
    </AuthGuard>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading NoteSwift Student...</p>
      </div>
    </div>
  );
}
