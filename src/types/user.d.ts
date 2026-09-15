import type { StudentAddress } from "./student";

// Body shape accepted by PUT /user/me — every field independently optional,
// validated server-side per-field (profile.controller.ts's updateStudent).
export interface UpdateUserData {
  full_name?: string;
  grade?: number;
  email?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  address?: Partial<StudentAddress>;
}

export interface NotificationPreferences {
  push_notifications: boolean;
  email_notifications: boolean;
  lesson_reminders: boolean;
  progress_updates: boolean;
  course_announcements: boolean;
  study_streak_reminders: boolean;
  weekly_progress_report: boolean;
  new_content_alerts: boolean;
}

export interface ParentLinkCodeResponse {
  code: string;
  expiresAt: string;
}
