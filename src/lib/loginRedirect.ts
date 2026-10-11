// "Come back here after login": a logged-out visitor is sent to
// /login?next=<the page they asked for>, and after logging in or registering
// they land on that page instead of /dashboard. Used, for example, by the
// marketing site's "Enroll now" buttons, which link straight to a course's
// checkout page.
//
// Only paths inside this app are honoured — never another site — so the
// parameter can't be used to send people elsewhere after login.
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw === "/login" || raw.startsWith("/login?") || raw.startsWith("/login/")) return null;
  return raw;
}

// Where to go after a successful login/registration on this page load.
export function postLoginPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  return safeNextPath(new URLSearchParams(window.location.search).get("next")) ?? "/dashboard";
}

// The login URL that brings the visitor back to the current page.
export function loginPathForCurrentPage(): string {
  if (typeof window === "undefined") return "/login";
  const here = window.location.pathname + window.location.search;
  const next = safeNextPath(here);
  return next && next !== "/" && next !== "/dashboard" ? `/login?next=${encodeURIComponent(next)}` : "/login";
}
