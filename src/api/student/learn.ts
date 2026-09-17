import api from "@/api/axios";
import type { LegacyApiResponse } from "@/types/api";
import type { CourseEnrollment } from "@/types/course";
import type { LiveClass, LiveClassTokenResult } from "@/types/live-class";
import type { ListModuleCommentsResult, ModuleComment, ToggleModuleLikeResult } from "@/types/module-comment";

export const redeemUnlockCode = async (
  code: string,
  courseId: string
): Promise<LegacyApiResponse<{ enrollment: CourseEnrollment }>> => {
  const res = await api.post("/learn/redeem-code", { code, courseId });
  return res.data;
};

// ─── Signed content URLs (Phase 3) ─────────────────────────────────────────
// Video/notes/DPP/solution files live on private R2 storage — these two
// endpoints exchange a stored object reference for a short-lived signed URL
// a <video>/<iframe> can actually load. Shapes confirmed against
// courseContentController.ts's getVideoSignedUrl / getContentSignedUrl.

export interface VideoSignedUrlResult {
  signedUrl: string;
  downloadUrl: string;
  storagePath: string;
  title: string;
  duration?: string;
  videoIndex: number;
  expiresIn: number;
}

export const getVideoSignedUrl = async (
  courseId: string,
  subjectName: string,
  moduleNumber: number,
  courseSubjectId: string,
  videoIndex = 0
): Promise<LegacyApiResponse<VideoSignedUrlResult>> => {
  const res = await api.get(
    `/courses/${courseId}/subject/${encodeURIComponent(subjectName)}/module/${moduleNumber}/video`,
    { params: { courseSubjectId, videoIndex } }
  );
  return res.data;
};

export interface ContentSignedUrlResult {
  signedUrl: string;
  title?: string;
  expiresIn: number;
}

// NOTE: the backend always signs the FIRST notes/dpp entry only (module.notes[0]
// / module.dpp[0]) — a `contentIndex` isn't read despite a module supporting
// multiple DPPs (see SubjectModule.dpps in types/subject-content.d.ts). See
// MOBILE_APP_CODE_ISSUES.md. This wrapper mirrors that limitation rather than
// papering over it — only the first DPP/solution/notes file is ever openable
// through this endpoint today.
export const getContentSignedUrl = async (
  courseId: string,
  subjectName: string,
  moduleNumber: number,
  contentType: "notes" | "dpp" | "solution",
  courseSubjectId: string
): Promise<LegacyApiResponse<ContentSignedUrlResult>> => {
  const res = await api.get(
    `/courses/${courseId}/subject/${encodeURIComponent(subjectName)}/module/${moduleNumber}/content/${contentType}`,
    { params: { courseSubjectId } }
  );
  return res.data;
};

// ─── Live classes (Phase 4) ─────────────────────────────────────────────────

export const getLiveClasses = async (params?: {
  subject?: string;
  courseId?: string;
}): Promise<LegacyApiResponse<{ liveClasses: LiveClass[] }>> => {
  const res = await api.get("/learn/live-classes", { params });
  return res.data;
};

export const getLiveClassToken = async (
  roomId: string
): Promise<LegacyApiResponse<LiveClassTokenResult>> => {
  const res = await api.get(`/learn/live-classes/${roomId}/token`);
  return res.data;
};

// Best-effort — completes the attendance record the token endpoint started.
// Called on room-leave/unmount; a missed call (tab killed, network drop)
// just leaves it unset server-side, same as mobile.
//
// NOTE: unlike every other LegacyApiResponse endpoint in this file, this one
// has no `data` field at all — just `{success, message}` at the top level
// (confirmed against learn.controller.ts's recordStudentLiveClassLeave).
export const leaveLiveClass = async (
  roomId: string
): Promise<{ success: boolean; message: string }> => {
  const res = await api.post(`/learn/live-classes/${roomId}/leave`);
  return res.data;
};

// ─── Module like/comments (video-detail page) ──────────────────────────────
// Shapes confirmed directly against commentController.ts and
// courseContentController.ts's toggleModuleLike — mobile's real per-video
// screen (ChapterDetailCard.tsx) calls the exact same three endpoints.

// toggleModuleLike reads courseSubjectId from the query string even though
// this is a POST (confirmed against the controller — not a mistake to
// "fix" by moving it to the body, the backend genuinely only reads req.query
// here).
export const toggleModuleLike = async (
  courseId: string,
  subjectName: string,
  moduleNumber: number,
  courseSubjectId: string
): Promise<LegacyApiResponse<ToggleModuleLikeResult>> => {
  const res = await api.post(
    `/courses/${courseId}/subject/${encodeURIComponent(subjectName)}/module/${moduleNumber}/like`,
    undefined,
    { params: { courseSubjectId } }
  );
  return res.data;
};

// videoId is the video subdocument's own Mongoose _id (ModuleVideo._id) —
// required by the backend (400 without it), not the array index.
export const getModuleComments = async (
  courseId: string,
  subjectName: string,
  moduleNumber: number,
  videoId: string,
  courseSubjectId: string
): Promise<LegacyApiResponse<ListModuleCommentsResult>> => {
  const res = await api.get(
    `/courses/${courseId}/subject/${encodeURIComponent(subjectName)}/module/${moduleNumber}/comments`,
    { params: { videoId, courseSubjectId } }
  );
  return res.data;
};

export const postModuleComment = async (
  courseId: string,
  subjectName: string,
  moduleNumber: number,
  videoId: string,
  courseSubjectId: string,
  text: string
): Promise<LegacyApiResponse<{ comment: ModuleComment }>> => {
  const res = await api.post(
    `/courses/${courseId}/subject/${encodeURIComponent(subjectName)}/module/${moduleNumber}/comments`,
    { videoId, courseSubjectId, text }
  );
  return res.data;
};
