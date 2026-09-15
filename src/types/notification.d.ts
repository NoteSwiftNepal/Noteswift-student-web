export type NotificationType =
  | "homepage"
  | "push"
  | "enrollment"
  | "question_answer"
  | "admin_broadcast"
  | string;

// Mirrors NotificationModel (notificationRoutes.ts) plus the read/readAt
// fields with-read-status attaches per-student.
export interface AppNotification {
  _id: string;
  type: NotificationType;
  title: string;
  message?: string;
  description?: string;
  status: "draft" | "sent" | "scheduled";
  sentAt?: string;
  createdAt: string;
  read?: boolean;
  readAt?: string | null;
}

export interface NotificationsWithReadStatusResult {
  notifications: AppNotification[];
  hasMore: boolean;
  nextCursor: string | null;
}
