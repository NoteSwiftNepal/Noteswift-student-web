import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { StudentAuthProvider } from "@/context/student-auth-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NoteSwift Student Portal",
  description: "Student portal for classes, syllabus details, and mock exams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <StudentAuthProvider>
          {children}
        </StudentAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
