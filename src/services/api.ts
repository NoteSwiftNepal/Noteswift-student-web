import { USE_MOCK_DATA, API_BASE_URL } from "@/config/app-config";
import { initialMockDatabase, MockDatabase, Course, CourseEnrollment, TrialEnrollment, Assignment, MockTest, TestAttempt, DoubtQuestion, TeacherChatThread, AIChatHistory, Notification, Invoice, StudentProfile, SubjectContent } from "@/data/mockData";

// Safe local storage mock database helper
const getMockDB = (): MockDatabase => {
  if (typeof window === "undefined") return initialMockDatabase;
  const data = localStorage.getItem("noteswift_student_mock_db");
  if (!data) {
    localStorage.setItem("noteswift_student_mock_db", JSON.stringify(initialMockDatabase));
    return initialMockDatabase;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initialMockDatabase;
  }
};

const saveMockDB = (db: MockDatabase) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("noteswift_student_mock_db", JSON.stringify(db));
  }
};

// Common header generator for real requests
const getHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("studentToken") : null;
  const fingerprint = typeof window !== "undefined" ? localStorage.getItem("studentDeviceFingerprint") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fingerprint ? { "x-device-fingerprint": fingerprint } : {}),
  };
};

// Safely extract an array from API response data — prevents .filter/.find/.map crashes
const safeArray = (...candidates: any[]): any[] => {
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
};

export function normalizeStudent(data: any): StudentProfile {
  if (!data) return {} as StudentProfile;
  return {
    id: data._id || data.id || "",
    email: data.email || "",
    fullName: data.full_name || data.fullName || "Student",
    phoneNumber: data.phone_number || data.phoneNumber || "",
    avatarEmoji: data.avatarEmoji || "🎓",
    rollNo: data.rollNo || data.roll_no || 1,
    grade: typeof data.grade === "number" ? `Grade ${data.grade}` : (data.grade || "Grade 10"),
    schoolName: data.address?.institution || data.schoolName || "",
    stream: data.stream || "SEE",
    gpa: data.gpa || 4.0,
    attendancePercent: data.attendancePercent || data.attendance_percent || 100,
    weeklyStudyHours: data.weeklyStudyHours || data.weekly_study_hours || 0,
    streakCount: data.streakCount || data.streak_count || 1,
    address: {
      province: data.address?.province || "",
      district: data.address?.district || "",
      institution: data.address?.institution || "",
    },
    linkingCode: data.linkingCode || data.parentLinkCode || "",
    parentLinked: typeof data.parentLinked === "boolean" ? data.parentLinked : false,
    parentName: data.parentName || null,
    parentNames: data.parentNames || [],
  };
}

export const api = {
  // --- Profile & Stats ---
  async getProfile(): Promise<{ success: boolean; data?: StudentProfile; message?: string; status?: number }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      return { success: true, data: db.student };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/user/me`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) {
        // Pass the HTTP status code back so auth context can differentiate 401 vs other errors
        return { success: false, message: data.message || `HTTP ${res.status}`, status: res.status };
      }
      const normalized = normalizeStudent(data.result || data.data || data.student);
      return { success: !data.error, data: normalized, message: data.message, status: res.status };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to fetch profile" };
    }
  },

  async updateProfile(profile: Partial<StudentProfile>): Promise<{ success: boolean; data?: StudentProfile; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      db.student = { ...db.student, ...profile };
      saveMockDB(db);
      return { success: true, data: db.student };
    }
    try {
      const payload: any = {};
      if (profile.fullName !== undefined) payload.full_name = profile.fullName;
      if (profile.email !== undefined) payload.email = profile.email;
      
      if (profile.grade !== undefined) {
        const gradeNum = parseInt(profile.grade.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(gradeNum)) {
          payload.grade = gradeNum;
        }
      }
      
      if (profile.address || profile.schoolName) {
        payload.address = {
          province: profile.address?.province || "",
          district: profile.address?.district || "",
          institution: profile.address?.institution || profile.schoolName || "",
        };
      }

      const res = await fetch(`${API_BASE_URL}/student/user/me`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const normalized = data.result || data.data ? normalizeStudent(data.result || data.data) : undefined;
      return { success: res.ok && !data.error, data: normalized, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to update profile" };
    }
  },

  async generateParentLinkCode(): Promise<{ success: boolean; code?: string; expiresAt?: string; message?: string }> {
    if (USE_MOCK_DATA) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      return {
        success: true,
        code: `NSP-${part1}-${part2}`,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/user/parent-link/generate-code`, {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      return {
        success: res.ok && !data.error,
        code: data.result?.code || data.code,
        expiresAt: data.result?.expiresAt || data.expiresAt,
        message: data.message
      };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to generate parent code" };
    }
  },

  async updateNotificationPreferences(prefs: any): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK_DATA) {
      return { success: true };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/user/notification-preferences`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ notification_preferences: prefs }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to update preferences" };
    }
  },

  async changePasswordWithCurrent(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK_DATA) {
      return { success: true };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/user/password-change/change-with-current`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to change password" };
    }
  },

  async getDashboard(): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const pendingAssignments = db.assignments.filter(a => a.submissionStatus === "pending").length;
      return {
        success: true,
        data: {
          student: db.student,
          timetable: db.timetable,
          recentActivity: [
            { time: "09:30 AM", title: "Attended Mathematics Class", subtext: "Completed Algebraic Equations" },
            { time: "11:15 AM", title: "Submitted Chemistry Assignment", subtext: "Uploaded lab report PDF" },
          ],
          stats: {
            attendance: db.student.attendancePercent,
            studyHours: db.student.weeklyStudyHours,
            assignmentsDue: pendingAssignments,
          },
        },
      };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/dashboard`, { headers: getHeaders() });
      const data = await res.json();
      return { success: res.ok && !data.error, data: data.result || data.data || data, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to load dashboard data" };
    }
  },

  // --- Courses & Enrollment ---
  async getCourses(): Promise<{ success: boolean; data?: Course[]; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      return { success: true, data: db.courses };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/courses`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) return { success: false, data: [], message: data.message };
      const courses = safeArray(data.result?.courses, data.data?.courses, data.data);
      return { success: true, data: courses, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to load courses" };
    }
  },

  async enrollInCourse(courseId: string): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const exists = db.enrollments.some(e => {
        const id = typeof e.courseId === "object" ? e.courseId.id : e.courseId;
        return id === courseId;
      });
      if (!exists) {
        const newEnrollment: CourseEnrollment = {
          id: `enr-${Date.now()}`,
          _id: `enr-${Date.now()}`,
          courseId: courseId,
          studentId: db.student.id,
          enrolledAt: new Date().toISOString(),
          progress: 0,
          isActive: true,
          lastAccessedAt: new Date().toISOString(),
          completedLessons: [],
        };
        db.enrollments.push(newEnrollment);
        saveMockDB(db);
      }
      return { success: true, message: "Enrolled successfully!" };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/courses/enroll`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Enrollment failed" };
    }
  },

  async startTrial(courseId: string): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const exists = db.trials.some(t => {
        const id = typeof t.courseId === "object" ? t.courseId.id : t.courseId;
        return id === courseId;
      });
      if (!exists) {
        const newTrial: TrialEnrollment = {
          id: `trl-${Date.now()}`,
          _id: `trl-${Date.now()}`,
          courseId: courseId,
          studentId: db.student.id,
          trialStartedAt: new Date().toISOString(),
          trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days trial
          isActive: true,
          progress: 0,
        };
        db.trials.push(newTrial);
        saveMockDB(db);
      }
      return { success: true, message: "Free trial started!" };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/courses/trial/start`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to start trial" };
    }
  },

  async convertTrialToEnrollment(courseId: string): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      db.trials = db.trials.filter(t => {
        const id = typeof t.courseId === "object" ? t.courseId.id : t.courseId;
        return id !== courseId;
      });
      // Add enrollment
      const hasEnr = db.enrollments.some(e => {
        const id = typeof e.courseId === "object" ? e.courseId.id : e.courseId;
        return id === courseId;
      });
      if (!hasEnr) {
        db.enrollments.push({
          id: `enr-${Date.now()}`,
          _id: `enr-${Date.now()}`,
          courseId: courseId,
          studentId: db.student.id,
          enrolledAt: new Date().toISOString(),
          progress: 10,
          isActive: true,
          lastAccessedAt: new Date().toISOString(),
          completedLessons: [],
        });
      }
      saveMockDB(db);
      return { success: true, message: "Trial converted to full enrollment!" };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/courses/trial/convert`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to convert trial" };
    }
  },

  async redeemUnlockCode(code: string, courseId: string): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      db.trials = db.trials.filter(t => {
        const id = typeof t.courseId === "object" ? t.courseId.id : t.courseId;
        return id !== courseId;
      });
      const hasEnr = db.enrollments.some(e => {
        const id = typeof e.courseId === "object" ? e.courseId.id : e.courseId;
        return id === courseId;
      });
      if (!hasEnr) {
        db.enrollments.push({
          id: `enr-${Date.now()}`,
          _id: `enr-${Date.now()}`,
          courseId: courseId,
          studentId: db.student.id,
          enrolledAt: new Date().toISOString(),
          progress: 0,
          isActive: true,
          lastAccessedAt: new Date().toISOString(),
          completedLessons: [],
        });
      }
      saveMockDB(db);
      return { success: true, message: "Code redeemed successfully!" };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/learn/redeem-code`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ code, courseId }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to redeem code" };
    }
  },

  async getSubjectContent(courseId: string, subjectName: string): Promise<{ success: boolean; data?: SubjectContent; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const content = db.subjectContents[subjectName] || { name: subjectName, chapters: [] };
      return { success: true, data: content };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/courses/${courseId}/subject/${encodeURIComponent(subjectName)}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, data: data.result || data.data, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to fetch subject contents" };
    }
  },

  async toggleLessonCompleted(subjectName: string, chapterId: string, lessonId: string): Promise<{ success: boolean; progress?: number }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const content = db.subjectContents[subjectName];
      if (content) {
        const chapter = content.chapters.find(c => c.id === chapterId);
        if (chapter) {
          const lesson = chapter.lessons.find(l => l.id === lessonId);
          if (lesson) {
            lesson.isCompleted = !lesson.isCompleted;
            
            // Recompute course progress if needed (simulated)
            const mathEnrollment = db.enrollments.find(e => e.courseId === "course-math-10" || (typeof e.courseId === "object" && e.courseId.id === "course-math-10"));
            if (mathEnrollment && subjectName === "Mathematics") {
              if (lesson.isCompleted) {
                if (!mathEnrollment.completedLessons.includes(lessonId)) {
                  mathEnrollment.completedLessons.push(lessonId);
                }
              } else {
                mathEnrollment.completedLessons = mathEnrollment.completedLessons.filter(id => id !== lessonId);
              }
              // Calculate simple percentage progress
              const totalLessons = content.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
              const completed = mathEnrollment.completedLessons.length;
              mathEnrollment.progress = Math.round((completed / totalLessons) * 100);
            }
            saveMockDB(db);
            return { success: true, progress: mathEnrollment?.progress };
          }
        }
      }
      return { success: false };
    }
    // Real API integration would map to: POST /courses/progress/:courseId
    return { success: true };
  },

  // --- Assignments ---
  async getAssignments(): Promise<{ success: boolean; data?: Assignment[]; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      return { success: true, data: db.assignments };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/assignments`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) return { success: false, data: [], message: data.message };
      return { success: true, data: safeArray(data.result, data.data), message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to load assignments" };
    }
  },

  async submitAssignment(assignmentId: string, textAnswer?: string, fileName?: string): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const assignment = db.assignments.find(a => a.id === assignmentId);
      if (assignment) {
        assignment.submissionStatus = "submitted";
        assignment.submittedAt = new Date().toISOString();
        if (textAnswer) assignment.textAnswer = textAnswer;
        if (fileName) assignment.attachmentUrl = `/uploads/${fileName}`;
        saveMockDB(db);
        return { success: true, message: "Assignment submitted successfully!" };
      }
      return { success: false, message: "Assignment not found" };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ textAnswer, attachmentUrl: fileName ? `/uploads/${fileName}` : undefined }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to submit assignment" };
    }
  },

  // --- Tests & Quizzes ---
  async getTests(): Promise<{ success: boolean; data?: MockTest[]; attempts?: TestAttempt[]; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      return { success: true, data: db.tests, attempts: db.testAttempts };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/tests`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) return { success: false, data: [], attempts: [], message: data.message };
      return {
        success: true,
        data: safeArray(data.result?.tests, data.data),
        attempts: safeArray(data.result?.attempts),
        message: data.message,
      };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to load tests" };
    }
  },

  async submitTestAttempt(testId: string, answers: { [key: string]: string }, timeSpentSeconds: number): Promise<{ success: boolean; data?: TestAttempt; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const test = db.tests.find(t => t.id === testId);
      if (!test) return { success: false, message: "Test not found" };

      // Calculate score
      let score = 0;
      const questions = test.questions;
      if (questions) {
        questions.forEach(q => {
          if (answers[q.id] === q.correctOptionId) {
            score += test.totalMarks / questions.length;
          }
        });
      }

      const newAttempt: TestAttempt = {
        id: `att-${Date.now()}`,
        testId,
        studentId: db.student.id,
        attemptedAt: new Date().toISOString(),
        score: Math.round(score * 10) / 10,
        totalMarks: test.totalMarks,
        answers,
        completed: true,
        timeSpentSeconds,
      };

      db.testAttempts.push(newAttempt);
      saveMockDB(db);
      return { success: true, data: newAttempt };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/tests/${testId}/submit`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ answers, timeSpentSeconds }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, data: data.result || data.data, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to submit test" };
    }
  },

  // --- Doubts & Community ---
  async getDoubts(): Promise<{ success: boolean; data?: DoubtQuestion[]; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      return { success: true, data: db.doubts };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/questions`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) return { success: false, data: [], message: data.message };
      return { success: true, data: safeArray(data.result, data.data), message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to load questions" };
    }
  },

  async askDoubt(title: string, text: string, subject: string, tags: string[]): Promise<{ success: boolean; data?: DoubtQuestion; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const newDoubt: DoubtQuestion = {
        id: `dbt-${Date.now()}`,
        title,
        text,
        subject,
        status: "pending",
        studentId: db.student.id,
        studentName: db.student.fullName,
        studentAvatar: db.student.avatarEmoji,
        tags,
        upvotes: 0,
        answers: [],
        createdAt: new Date().toISOString(),
      };
      db.doubts.unshift(newDoubt);
      saveMockDB(db);
      return { success: true, data: newDoubt };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/questions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ title, text, subjectName: subject, tags }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, data: data.result || data.data, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to post doubt" };
    }
  },

  async upvoteQuestion(questionId: string): Promise<{ success: boolean; upvotes?: number }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const question = db.doubts.find(d => d.id === questionId);
      if (question) {
        if (question.voted === "up") {
          question.upvotes -= 1;
          question.voted = undefined;
        } else {
          question.upvotes += 1;
          question.voted = "up";
        }
        saveMockDB(db);
        return { success: true, upvotes: question.upvotes };
      }
      return { success: false };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/questions/${questionId}/vote`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ type: "up" }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, upvotes: data.result?.upvotes };
    } catch (err) {
      return { success: false };
    }
  },

  async replyToDoubt(questionId: string, text: string): Promise<{ success: boolean; data?: any; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const question = db.doubts.find(d => d.id === questionId);
      if (question) {
        const newReply = {
          id: `ans-${Date.now()}`,
          authorName: db.student.fullName,
          authorRole: "student" as const,
          text,
          createdAt: new Date().toISOString(),
          isAccepted: false,
        };
        question.answers.push(newReply);
        saveMockDB(db);
        return { success: true, data: newReply };
      }
      return { success: false, message: "Question not found" };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/questions/${questionId}/reply`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, data: data.result || data.data, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to post reply" };
    }
  },

  // --- Teacher Chat Threads ---
  async getChats(): Promise<{ success: boolean; data?: TeacherChatThread[]; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      return { success: true, data: db.chats };
    }
    // Mock integration: chats are usually loaded via: GET /messages/student/chat/:teacherId/:subjectName
    return { success: true, data: [] };
  },

  async sendTeacherMessage(chatId: string, text: string): Promise<{ success: boolean; message?: any }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const chat = db.chats.find(c => c.id === chatId);
      if (chat) {
        const newMessage = {
          id: `msg-${Date.now()}`,
          sender: "student" as const,
          text,
          timestamp: new Date().toISOString(),
        };
        chat.messages.push(newMessage);
        
        // Simulate quick automatic response from teacher for dynamic feel!
        setTimeout(() => {
          const dbAsync = getMockDB();
          const chatAsync = dbAsync.chats.find(c => c.id === chatId);
          if (chatAsync) {
            chatAsync.messages.push({
              id: `msg-auto-${Date.now()}`,
              sender: "teacher",
              text: `Thanks for your message! I've received your query about ${chat.subject} and will get back to you shortly.`,
              timestamp: new Date().toISOString(),
            });
            saveMockDB(dbAsync);
          }
        }, 1500);

        saveMockDB(db);
        return { success: true, message: newMessage };
      }
      return { success: false };
    }
    try {
      const db = getMockDB();
      const chat = db.chats.find(c => c.id === chatId);
      const res = await fetch(`${API_BASE_URL}/student/messages/teacher`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ teacherId: chat?.teacherId, text, subjectName: chat?.subject }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, message: data.result || data.data };
    } catch (err) {
      return { success: false };
    }
  },

  // --- AI Chat History ---
  async getAIChatHistory(): Promise<{ success: boolean; data?: AIChatHistory[]; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      return { success: true, data: db.aiHistory };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/ai/history`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) return { success: false, data: [], message: data.message };
      return { success: true, data: safeArray(data.result, data.data), message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to load AI chats" };
    }
  },

  async sendChatMessageToAI(chatId: string, content: string): Promise<{ success: boolean; userMessage?: any; modelResponse?: any }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const chat = db.aiHistory.find(c => c.id === chatId);
      if (chat) {
        const userMsg = { id: `aim-u-${Date.now()}`, role: "user" as const, content, timestamp: new Date().toISOString() };
        chat.messages.push(userMsg);
        
        // Generate simulated dynamic AI tutor responses!
        let aiText = "I'm your NoteSwift AI Study Assistant. How can I help you with your studies today?";
        const lcontent = content.toLowerCase();
        if (lcontent.includes("formula") || lcontent.includes("trig")) {
          aiText = "Here are the primary trigonometric identities:\n- sin²θ + cos²θ = 1\n- 1 + tan²θ = sec²θ\n- 1 + cot²θ = cosec²θ\nDo you want me to show you a sample problem using these?";
        } else if (lcontent.includes("gravity") || lcontent.includes("acceleration")) {
          aiText = "Acceleration due to gravity (g) on Earth is approx 9.8 m/s². The formula is g = GM / R², where G is the gravitational constant, M is the mass of the planet, and R is the radius. Would you like to compute g for the moon?";
        } else if (lcontent.includes("hello") || lcontent.includes("hi")) {
          aiText = "Hello! I am your NoteSwift AI Tutor. You can ask me any question about Mathematics, Science, English, or Social Studies. How can I help you today?";
        }
        
        const modelMsg = { id: `aim-m-${Date.now()}`, role: "model" as const, content: aiText, timestamp: new Date().toISOString() };
        chat.messages.push(modelMsg);
        saveMockDB(db);
        return { success: true, userMessage: userMsg, modelResponse: modelMsg };
      }
      return { success: false };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/ai/chat`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ message: content, chatId }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, modelResponse: { content: data.result?.response || data.data?.response } };
    } catch (err) {
      return { success: false };
    }
  },

  async createNewAIChat(title: string): Promise<{ success: boolean; data?: AIChatHistory }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const newChat: AIChatHistory = {
        id: `chat-ai-${Date.now()}`,
        title,
        createdAt: new Date().toISOString(),
        messages: [],
      };
      db.aiHistory.unshift(newChat);
      saveMockDB(db);
      return { success: true, data: newChat };
    }
    // Mock for real backend saving
    return { success: true };
  },

  async deleteAIChat(chatId: string): Promise<{ success: boolean }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      db.aiHistory = db.aiHistory.filter(h => h.id !== chatId);
      saveMockDB(db);
      return { success: true };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/ai/history/${chatId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return { success: res.ok };
    } catch (err) {
      return { success: false };
    }
  },

  // --- Notifications ---
  async getNotifications(): Promise<{ success: boolean; data?: Notification[]; unreadCount: number }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const unreadCount = db.notifications.filter(n => !n.isRead).length;
      return { success: true, data: db.notifications, unreadCount };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/notifications/with-read-status`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) return { success: false, data: [], unreadCount: 0 };
      const list = safeArray(data.result, data.data);
      const unreadCount = list.filter((n: any) => !n.isRead).length;
      return { success: true, data: list, unreadCount };
    } catch (err) {
      return { success: false, unreadCount: 0 };
    }
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const notif = db.notifications.find(n => n.id === id);
      if (notif) {
        notif.isRead = true;
        saveMockDB(db);
      }
      return { success: true };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/notifications/read/${id}`, {
        method: "POST",
        headers: getHeaders(),
      });
      return { success: res.ok };
    } catch (err) {
      return { success: false };
    }
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      db.notifications.forEach(n => (n.isRead = true));
      saveMockDB(db);
      return { success: true };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/notifications/read-all`, {
        method: "POST",
        headers: getHeaders(),
      });
      return { success: res.ok };
    } catch (err) {
      return { success: false };
    }
  },

  // --- Invoices & Packages ---
  async getInvoices(): Promise<{ success: boolean; data?: Invoice[]; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      return { success: true, data: db.invoices };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/orders-payments/transactions`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) return { success: false, data: [], message: data.message };
      return { success: true, data: safeArray(data.result, data.data), message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to load invoices" };
    }
  },

  async payInvoice(id: string): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK_DATA) {
      const db = getMockDB();
      const invoice = db.invoices.find(inv => inv.id === id);
      if (invoice) {
        invoice.status = "paid";
        invoice.datePaid = new Date().toISOString().split("T")[0];
        saveMockDB(db);
        return { success: true, message: "Payment verified successfully!" };
      }
      return { success: false, message: "Invoice not found" };
    }
    // Real endpoint wiring would occur here
    return { success: true };
  },

  async sendReportIssue(reportText: string, email?: string): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK_DATA) {
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: "Thank you! Your technical report has been received." };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/report-issue`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ description: reportText, email }),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to send report" };
    }
  },

  // --- Study History & Activity Log ---
  async getHistory(): Promise<{ success: boolean; data?: any[]; message?: string }> {
    if (USE_MOCK_DATA) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("noteswift_student_history");
        if (stored) return { success: true, data: JSON.parse(stored) };
      }
      return { success: true, data: [] };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/history`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) return { success: false, data: [], message: data.message };
      return { success: true, data: safeArray(data.result, data.data), message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to load history logs" };
    }
  },

  // --- Downloads Center ---
  async getDownloads(): Promise<{ success: boolean; data?: any[]; message?: string }> {
    if (USE_MOCK_DATA) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("noteswift_student_downloads");
        if (stored) return { success: true, data: JSON.parse(stored) };
      }
      return { success: true, data: [] };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/downloads`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) return { success: false, data: [], message: data.message };
      return { success: true, data: safeArray(data.result, data.data), message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to load downloads" };
    }
  },

  async addDownload(file: { fileName: string; size: string; subject: string }): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK_DATA) {
      return { success: true };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/downloads`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(file),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to add download record" };
    }
  },

  async deleteDownload(id: string): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK_DATA) {
      return { success: true };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/downloads/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      return { success: res.ok && !data.error, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to delete download record" };
    }
  },

  async getLiveClasses(courseId?: string): Promise<{ success: boolean; data?: any[]; message?: string }> {
    if (USE_MOCK_DATA) {
      return { success: true, data: [] };
    }
    try {
      const url = courseId 
        ? `${API_BASE_URL}/student/learn/live-classes?courseId=${courseId}`
        : `${API_BASE_URL}/student/learn/live-classes`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok || data.error) return { success: false, data: [], message: data.message };
      return { success: true, data: safeArray(data.result, data.data), message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to load live classes" };
    }
  },

  async getLiveClassToken(roomId: string): Promise<{ success: boolean; data?: { token: string }; message?: string }> {
    if (USE_MOCK_DATA) {
      return { success: true, data: { token: "mock-livekit-token" } };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/student/learn/live-classes/${roomId}/token`, { headers: getHeaders() });
      const data = await res.json();
      return { success: res.ok && !data.error, data: data.result || data.data || data, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to get live token" };
    }
  }
};


