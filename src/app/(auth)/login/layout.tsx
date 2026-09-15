import type { Metadata } from "next";

// The route's own page.tsx is a client component (interactive OTP flow),
// which can't export `metadata` — this sibling server-component layout is
// the standard Next.js way to attach per-route metadata to a client page
// without converting it. Nests inside (auth)/layout.tsx (also client, for
// the logged-in redirect) without conflict.
export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to NoteSwift with your phone number to access your classes, tests, and more.",
  openGraph: {
    title: "Log in to NoteSwift",
    description: "Log in with your phone number to access your classes, tests, and more.",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
