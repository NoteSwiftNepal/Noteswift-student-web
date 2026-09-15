// A single in-memory value bridging AuthBootstrap and StreakCelebrationProvider:
// the student's streak as it was BEFORE restoreSession() overwrites `user`
// with a freshly-fetched record. StreakCelebrationProvider only ever mounts
// after AuthBootstrap's ready-gate flips true — by which point restoreSession
// has already run and `user.currentStreak` already reflects the fresh value
// — so without this, the provider would never see the "before" value to
// compare against, only ever the "after" one. Deliberately not zustand
// state: this is write-once-read-once transient data for a single app-load
// sequence, not something any component needs to reactively subscribe to.
let baseline: number | null = null;

export function setStreakBaseline(value: number | undefined | null): void {
  baseline = value ?? 0;
}

export function takeStreakBaseline(): number | null {
  const value = baseline;
  baseline = null;
  return value;
}
