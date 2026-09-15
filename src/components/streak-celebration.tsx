"use client";

import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { checkAndClaimStreakCelebration } from "@/lib/streakCelebration";
import { takeStreakBaseline } from "@/lib/streakBaseline";
import { getConfettiColors, getFlameColor } from "@/lib/streakTiers";
import { CelebrationConfetti } from "@/components/celebration-confetti";

function CelebrationOverlay({ streakDays, onComplete }: { streakDays: number; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const flameColor = getFlameColor(streakDays);
  const confettiColors = getConfettiColors(streakDays);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/85 animate-in fade-in duration-300">
      <CelebrationConfetti colors={confettiColors} />

      <div
        className="flex size-40 items-center justify-center rounded-full animate-in zoom-in-50 duration-500"
        style={{ backgroundColor: `${flameColor}20` }}
      >
        <Flame className="size-24 animate-in zoom-in-50 duration-700" style={{ color: flameColor }} fill={flameColor} />
      </div>

      <div className="mt-8 animate-in zoom-in-75 fade-in delay-300 duration-500 rounded-full bg-white px-6 py-2.5 shadow-lg">
        <p className="text-3xl font-bold text-gray-900">Day {streakDays}</p>
      </div>

      <div className="mt-10 animate-in fade-in delay-500 duration-500 text-center">
        <p className="text-2xl font-bold text-white drop-shadow">🔥 Streak Power! 🔥</p>
        <p className="mt-2 text-base text-white/90">You&apos;re on fire! Keep it up! 🚀</p>
      </div>
    </div>
  );
}

// Mounted once at the root layout (see providers.tsx) so it fires on
// whatever page the student happens to be on — mobile's own version of
// this only checks from two specific screens (More's StatCard and Profile's
// ProfileHeader), which means a streak increase is only ever noticed if the
// student happens to visit one of those two screens; see
// MOBILE_APP_CODE_ISSUES.md. The check itself runs whenever
// user.currentStreak changes to something higher than the last value this
// session observed, which in practice is once per app load (AuthBootstrap's
// restoreSession() call fetches a fresh user record — if that's a higher
// streak than what was persisted from last time, this fires) — the same
// "next time the app is used" granularity mobile's own foreground-check
// has, not a live server-push.
export function StreakCelebrationProvider() {
  const currentStreak = useAuthStore((s) => s.user?.currentStreak);
  const lastSeenRef = useRef<number | null>(null);
  const [celebratingStreak, setCelebratingStreak] = useState<number | null>(null);

  useEffect(() => {
    if (typeof currentStreak !== "number") return;

    if (lastSeenRef.current === null) {
      // First observation this session — seed from the value AuthBootstrap
      // captured just before restoreSession() ran (the persisted/pre-fetch
      // streak), not from `currentStreak` itself, which by the time this
      // component can mount already reflects the POST-restoreSession fetch.
      // Using currentStreak here would mean this baseline and the first
      // real value are always identical, and a same-app-load streak
      // increase would never be detected.
      const seeded = takeStreakBaseline();
      lastSeenRef.current = seeded ?? currentStreak;
      if (lastSeenRef.current >= currentStreak) return;
    }

    if (currentStreak > lastSeenRef.current) {
      const shouldCelebrate = checkAndClaimStreakCelebration(currentStreak, lastSeenRef.current);
      if (shouldCelebrate) setCelebratingStreak(currentStreak);
    }
    lastSeenRef.current = currentStreak;
  }, [currentStreak]);

  if (celebratingStreak === null) return null;

  return <CelebrationOverlay streakDays={celebratingStreak} onComplete={() => setCelebratingStreak(null)} />;
}
