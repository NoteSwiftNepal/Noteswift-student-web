import type { Metadata } from "next";

// See (auth)/login/layout.tsx's header comment — same pattern, needed here
// because dashboard/page.tsx is a client component too.
export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your enrolled courses, today's live classes, and recommended courses, all in one place.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
