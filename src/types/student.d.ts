// Student profile shape returned by the backend (sensitive fields — password,
// refreshToken, deviceFingerprint bookkeeping — stripped, mirroring mobile's
// TStudentWithNoSensitive).
export interface StudentAddress {
  province?: string;
  district?: string;
  institution?: string;
  municipality?: string;
  ward?: number;
}

export interface Student {
  id: string;
  _id: string;
  full_name: string;
  grade?: number;
  email?: string;
  phone_number: string;
  address?: StudentAddress;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  avatarEmoji?: string;
  profileImage?: string;
  currentStreak?: number;
  longestStreak?: number;
  hasPassword?: boolean;
  parentLinked?: boolean;
  parentName?: string | null;
  parentNames?: string[];
  selectedCourseId?: string | null;
  schoolId?: string | null;
  schoolLockedByCode?: boolean;
}
