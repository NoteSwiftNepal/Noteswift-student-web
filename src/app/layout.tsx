import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const SITE_NAME = "NoteSwift Student Portal";
const SITE_DESCRIPTION = "Student portal for classes, syllabus details, and mock exams.";

export const metadata: Metadata = {
  // No confirmed production domain for this web app yet (only the API's,
  // api.noteswift.com.np) — falls back to localhost in dev; set
  // NEXT_PUBLIC_SITE_URL once the real one is known so OG/Twitter image
  // URLs resolve to something real instead of a warning-triggering default.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: SITE_NAME,
    // Leaf routes with their own metadata (e.g. dashboard/layout.tsx,
    // (auth)/login/layout.tsx) set `title: "Dashboard"` and this renders it
    // as "Dashboard | NoteSwift Student Portal".
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/noteswift-logo.png",
    apple: "/noteswift-logo.png",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    images: ["/noteswift-logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/noteswift-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
