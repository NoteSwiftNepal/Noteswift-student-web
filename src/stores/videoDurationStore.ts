import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Caches the REAL duration (seconds) a <video> element itself reports once
// a lecture has actually been opened and its metadata loads — mirrors
// mobile's RecordedVideo.tsx (onDurationUpdate, driven by the real
// durationMillis) preferring genuine media metadata over the backend's own
// unreliable stored duration string (see formatDuration.ts and
// MOBILE_APP_CODE_ISSUES.md). Keyed by the video's own stable `url` field
// (not the short-lived signed URL it's actually fetched through).
// Persisted so a lecture opened once stays corrected on the list even after
// a reload — the same way mobile's display "self-heals" over repeat views.
interface VideoDurationState {
  durationsBySeconds: Record<string, number>;
  setDuration: (url: string, seconds: number) => void;
}

export const useVideoDurationStore = create<VideoDurationState>()(
  persist(
    (set) => ({
      durationsBySeconds: {},
      setDuration: (url, seconds) =>
        set((s) => ({ durationsBySeconds: { ...s.durationsBySeconds, [url]: seconds } })),
    }),
    {
      name: "noteswift-web-video-durations",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
