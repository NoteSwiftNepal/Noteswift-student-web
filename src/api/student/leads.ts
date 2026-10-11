import api from "@/api/axios";

// Tells the backend a logged-in student opened a paid course's page or its
// checkout, so admins can follow up (Leads page). Fire-and-forget: the
// backend ignores free courses and courses the student already owns, and a
// failure here must never affect the page.
export const trackCourseLead = (courseId: string, event: "view" | "checkout") => {
  api.post("/learn/leads/track", { courseId, event, source: "web" }).catch(() => {});
};
