// The backend's video.duration is genuinely unreliable free text (confirmed
// directly against courseContentController.ts, logged to
// MOBILE_APP_CODE_ISSUES.md): for a live-class recording it's
// LiveClass.recordingDuration — a plain integer, in seconds — stringified
// with no unit or separator at all (e.g. "3600"); for a manually-uploaded
// video it's whatever a teacher's upload client happened to send, in no
// validated format whatsoever (Course.model.ts's ICourseModuleVideo.duration
// is a bare optional String). Only the purely-numeric case is safe to
// reformat — that covers every recording (the confirmed, deterministic bug)
// and any manual upload that also happens to already be raw seconds;
// anything else (already containing a colon, "min", etc.) is trusted as
// already human-readable rather than guessed at and mis-parsed.
export function formatSecondsToClock(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatDuration(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return trimmed;
  return formatSecondsToClock(parseInt(trimmed, 10));
}
