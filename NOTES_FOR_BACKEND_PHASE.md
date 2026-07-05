# NoteSwift Student Web Portal — Backend Wiring & Integration Guide

This guide describes how to wire the frontend codebase in `Noteswift-student-web` to the live `noteswift-backend` during Phase 2.

## 1. System Flag Configuration
To toggle between local localStorage mock data database mode and the live API endpoints, edit `src/config/app-config.ts`:

```typescript
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" || true;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
```

For production integration, set the environment variables in a `.env.local` file:
```bash
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_API_BASE_URL=https://api.noteswift.com/api
```

---

## 2. Authentication Flow
Authentication is managed inside `src/context/student-auth-context.tsx` and protected via `src/components/auth-guard.tsx`.

### API Routes to Implement:
1. **Send OTP Code**:
   - **Method**: `POST` `/api/student/auth/login-otp`
   - **Payload**: `{ phone: string }` (e.g. `+977-9841234567`)
   - **Response**: `{ success: boolean, message?: string }`
2. **Verify OTP Code**:
   - **Method**: `POST` `/api/student/auth/verify-otp`
   - **Payload**: `{ phone: string, otp: string }`
   - **Response**: `{ success: boolean, token: string, student: StudentProfile }`
3. **Register New Student**:
   - **Method**: `POST` `/api/student/auth/register`
   - **Payload**: `{ fullName: string, phone: string, email?: string, agreeTerms: boolean }`
   - **Response**: `{ success: boolean, message?: string }`

---

## 3. Data Access API Methods (`src/services/api.ts`)
The API helper class coordinates all endpoints. When `USE_MOCK_DATA` is `false`, it executes live `fetch()` calls with JWT authorization headers.

### Endpoint Mapping Reference:

| Function | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `getProfile` | `GET` | `/student/profile` | Fetch active student detail (grade, stream, roll number, linking code). |
| `updateProfile` | `PUT` | `/student/profile` | Update profile fields & selected avatar emoji. |
| `getDashboard` | `GET` | `/student/dashboard` | Fetch daily timetable classes and quick metric stats. |
| `getCourses` | `GET` | `/student/courses` | Fetch course explorer blueprints, syllabus curriculum, and FAQs. |
| `enrollInCourse` | `POST` | `/student/courses/:id/enroll` | Enroll student in free course. |
| `startTrial` | `POST` | `/student/courses/:id/trial` | Start 7-day free trial on premium course. |
| `convertTrialToEnrollment` | `POST` | `/student/courses/:id/activate` | Upgrade active trial to full subscription course. |
| `getSubjectContent` | `GET` | `/student/courses/:courseId/subjects/:subject` | Fetch chapters & expandable lessons. |
| `toggleLessonCompleted` | `POST` | `/student/lessons/:lessonId/toggle` | Toggle progress checklist tick. |
| `getAssignments` | `GET` | `/student/assignments` | List homework assignments. |
| `submitAssignment` | `POST` | `/student/assignments/:id/submit` | Upload text answers and file scripts. |
| `getTests` | `GET` | `/student/tests` | List mock exams & previous score attempts. |
| `submitTestAttempt` | `POST` | `/student/tests/:id/attempt` | Grade MCQ options or upload PDF scripts. |
| `getDoubts` | `GET` | `/student/doubts` | Fetch forum doubts asked by community. |
| `askDoubt` | `POST` | `/student/doubts` | Ask new doubt (title, text, subject, tags). |
| `upvoteQuestion` | `POST` | `/student/doubts/:id/upvote` | Toggle forum upvote increments. |
| `replyToDoubt` | `POST` | `/student/doubts/:id/replies` | Post reply comment on thread. |
| `getAIChatHistory` | `GET` | `/student/ai-chats` | Fetch AI Tutor thread history log. |
| `createNewAIChat` | `POST` | `/student/ai-chats` | Create new study session thread. |
| `sendChatMessageToAI` | `POST` | `/student/ai-chats/:id/messages` | Stream chat message query to LLM. |
| `getInvoices` | `GET` | `/student/invoices` | Fetch compulsory invoices and fees. |
| `payInvoice` | `POST` | `/student/invoices/:id/pay` | Confirm successful ConnectIPS / eSewa transaction. |

---

## 4. Local Storage Schema Reference
During mock mode, database persistence uses the local storage key `noteswift_student_mock_db`. Refer to `src/data/mockData.ts` to inspect full Typescript interface schemas for database mirroring.
