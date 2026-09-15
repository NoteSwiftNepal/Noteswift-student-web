// Ported from mobile's lib/streakCelebration.ts — same single persisted
// number (not a full duplicate streak-computation system), just enough to
// answer "have we already celebrated this value": a later check with the
// same streak doesn't re-fire, and a streak that increased while the
// celebration check wasn't running still gets celebrated correctly once
// it's next seen, since the comparison is against "last celebrated," not
// "yesterday." localStorage instead of AsyncStorage; synchronous instead of
// async since localStorage doesn't need it.
const LAST_CELEBRATED_KEY = "noteswift_streak_last_celebrated";

export function checkAndClaimStreakCelebration(freshStreak: number, previousKnownStreak: number): boolean {
  try {
    const lastCelebratedStr = localStorage.getItem(LAST_CELEBRATED_KEY);
    const lastCelebrated = lastCelebratedStr ? parseInt(lastCelebratedStr, 10) : 0;

    if (freshStreak > previousKnownStreak && freshStreak > lastCelebrated) {
      localStorage.setItem(LAST_CELEBRATED_KEY, freshStreak.toString());
      return true;
    }
    return false;
  } catch {
    // Best-effort — if the check itself fails (private browsing, storage
    // disabled), don't celebrate rather than risk re-firing every time.
    return false;
  }
}
