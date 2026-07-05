"use client";

import { 
  Info, 
  Shield, 
  Terminal, 
  Globe, 
  BookOpen, 
  Sparkles,
  School,
  Heart
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";

function AboutContent() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Brand logo container */}
      <Card className="border border-gray-300 shadow-sm bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-700 text-white rounded-3xl p-6 text-center relative overflow-hidden">
        <div className="absolute left-0 right-0 top-0 bottom-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_40%)]"></div>
        <div className="relative z-10 space-y-4">
          <div className="h-16 w-16 bg-white/20 backdrop-blur border border-white/30 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-md">
            🎒
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight">NoteSwift Education Platform</h2>
            <span className="text-xs text-indigo-200 font-bold bg-white/10 px-3.5 py-0.5 rounded-full inline-block">
              Web Version 1.0.0 (Stable)
            </span>
          </div>
        </div>
      </Card>

      {/* Info details */}
      <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl">
        <CardHeader className="border-b border-gray-200 p-5">
          <CardTitle className="text-sm sm:text-base font-extrabold text-gray-800 flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-500" />
            System Blueprint
          </CardTitle>
          <CardDescription className="text-xs text-gray-500 font-semibold">NoteSwift student web app architecture overview.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Platform Channel</span>
              <span className="text-xs font-bold text-gray-800">HTML5 Web / App Router</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Client Build</span>
              <span className="text-xs font-bold text-gray-800">Production Minified Next.js</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Mock Database Cache</span>
              <span className="text-xs font-bold text-gray-800">Local Storage Sandbox</span>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Target Audience</span>
              <span className="text-xs font-bold text-gray-800">Secondary School Students</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-4.5 w-4.5 text-indigo-500" />
              Terms of Use & privacy policies
            </h4>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              We care about student privacy. All details including class grades, roll numbers, assignment texts, mock quiz answers, and tutor discussion feeds are managed under strict end-to-end security measures. No advertising trackers are placed in the application.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-150 p-4 bg-gray-50/50 flex justify-between items-center text-xs text-gray-400 font-semibold rounded-b-2xl">
          <span className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> in Nepal
          </span>
          <span>© 2026 NoteSwift Inc.</span>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AboutPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <AboutContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
