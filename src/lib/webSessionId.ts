// Persistent per-browser identifier sent as the web platform's device-fingerprint
// equivalent (blueprint §5.3) — web has no stable hardware-derived identity, so a
// stored UUID is the honest equivalent of mobile's lib/deviceFingerprint.ts.
// Paired with x-client-platform: web, the backend binds it to the student's
// web session slot (one web + one mobile session at a time).
const WEB_SESSION_ID_KEY = "noteswift_web_session_id";

export function getWebSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(WEB_SESSION_ID_KEY);
  if (existing) {
    return existing;
  }

  // crypto.randomUUID only exists in a secure context (HTTPS or localhost)
  // — a phone hitting the dev server over plain http://LAN-IP has no
  // crypto.randomUUID at all, so this needs the same fallback the other
  // call sites in this repo already use.
  const generated =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(WEB_SESSION_ID_KEY, generated);
  return generated;
}
