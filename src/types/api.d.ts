// Response envelope for every /api/student endpoint (blueprint §5.1).
// Payload lives at `res.data.result`. A few legacy (trial-related) endpoints
// return `{success, data, message}` instead — handle those per-endpoint.
export type ApiResponse<T> =
  | { error: false; status: number; result: T; message: string }
  | { error: true; status: number; result: null; message: string };

// Older course/enrollment/trial/dashboard-adjacent endpoints (courseController,
// trialController, ordersPaymentsController, homepageController — anything
// still using Express's raw res.json() instead of the JsonResponse wrapper
// class) reply with this shape instead of ApiResponse<T>, and use real HTTP
// status codes for failure rather than an embedded 200. Confirmed directly
// against the backend controllers — in practice this is most of the
// course/enrollment/trial surface, not just "trial-related" as the phrasing
// in blueprint §5.1 might suggest.
export type LegacyApiResponse<T> =
  | { success: true; data: T; message: string }
  | { success: false; data?: null; message: string };
