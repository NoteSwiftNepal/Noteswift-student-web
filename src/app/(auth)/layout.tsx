"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { postLoginPath } from "@/lib/loginRedirect";

// An authenticated visitor hitting /login is sent straight to /dashboard, or
// to the page in ?next= (see lib/loginRedirect.ts).
export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace(postLoginPath());
    }
  }, [isLoggedIn, router]);

  if (isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}
