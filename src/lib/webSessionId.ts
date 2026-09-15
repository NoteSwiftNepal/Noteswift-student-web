// Persistent per-browser identifier sent as the web platform's device-fingerprint
// equivalent (blueprint §5.3) — web has no stable hardware-derived identity, so a
// stored UUID is the honest equivalent of mobile's lib/deviceFingerprint.ts.
//
// ⚠️ TEMPORARY STAND-IN, NOT A FINISHED DESIGN: the backend has exactly one
// `activeDeviceFingerprint` slot per student today — no separate web slot
// exists yet (blueprint §5.3 calls out the required backend change: a
// second `activeWebSessionId`/`activeWebFingerprint` field, gated by a
// client-platform header). Until that lands, logging into this web app and
// logging into the mobile app as the same student will silently evict
// whichever session logged in first — this file is not the fix, it's just
// what the web app sends into that single, currently-shared slot. Do not
// remove this warning or the one in api/axios.ts without confirming the
// backend change has actually shipped.
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
