// Ported verbatim from mobile's lib/streakTiers.ts — single source of truth
// for the 7 streak-tier thresholds, shared by the flame badge and the
// celebration overlay so they always agree on where one tier ends and the
// next begins.
export function getFlameColor(streakDays: number): string {
  if (streakDays >= 300) return "#000000";
  if (streakDays >= 200) return "#1a1a1a";
  if (streakDays >= 100) return "#1565c0";
  if (streakDays >= 50) return "#4a148c";
  if (streakDays >= 10) return "#7b1fa2";
  if (streakDays >= 3) return "#b71c1c";
  return "#ff5722";
}

export function getConfettiColors(streakDays: number): string[] {
  if (streakDays >= 300) return ["#000000", "#1a1a1a", "#FFFFFF"];
  if (streakDays >= 200) return ["#1a1a1a", "#4a4a4a", "#FFFFFF"];
  if (streakDays >= 100) return ["#1565c0", "#42A5F5", "#FFFFFF"];
  if (streakDays >= 50) return ["#4a148c", "#7b1fa2", "#FFFFFF"];
  if (streakDays >= 10) return ["#7b1fa2", "#e91e63", "#FFFFFF"];
  if (streakDays >= 3) return ["#b71c1c", "#d32f2f", "#FFFFFF"];
  return ["#ff5722", "#ff8a65", "#FFFFFF"];
}
