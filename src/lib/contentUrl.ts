// Mirrors mobile's app/Chapter/modules/[moduleId].tsx openPdf exactly — a
// note/dpp/solution item's own stored `url` field is usable directly UNLESS
// it's a raw private-bucket R2 URL (needs a signed URL to actually be
// fetchable) or isn't even a fully-qualified URL at all. Only when this is
// true does the backend's getContentSignedUrl endpoint need to be called —
// and that endpoint can only ever sign the FIRST item of a content type
// (see MOBILE_APP_CODE_ISSUES.md), so it's only safe to call for index 0.
export function needsSignedUrl(url: string): boolean {
  return url.includes("r2.cloudflarestorage.com") || !url.startsWith("http");
}
