// /tests* endpoints use ApiResponse<T> (JsonResponse — {error,status,result,
// message}), confirmed against test.controller.ts. Field shapes below are
// ported from mobile's api/student/test.ts interfaces, cross-checked against
// the controller (see PR notes) — mobile's own types were accurate here.

export interface TestAttemptInfo {
  attemptId: string;
  attemptNumber: number;
  status: string;
  startedAt: string;
  submittedAt?: string;
  totalScore: number;
  percentage: number;
  timeSpent: number;
}

export interface Test {
  _id: string;
  title: string;
  description: string;
  // 'subjective' = text-only questions the student answers by uploading a
  // photo of their handwritten solution; graded manually by the teacher.
  type: "mcq" | "subjective";
  category: string;
  duration: number;
  totalMarks: number;
  passingMarks?: number;
  passingPercentage: number;
  totalQuestions: number;
  courseName: string;
  subjectName: string;
  moduleName?: string;
  startTime?: string;
  endTime?: string;
  availability: "upcoming" | "open" | "closed";
  allowMultipleAttempts: boolean;
  maxAttempts?: number;
  showResultsImmediately: boolean;
  instructions?: string;
  attemptInfo: TestAttemptInfo | null;
  canAttempt: boolean;
}

export interface TestListStats {
  total: number;
  available: number;
  completed: number;
  inProgress: number;
}

export interface TestListResult {
  tests: Test[];
  stats: TestListStats;
}

export interface Question {
  questionNumber: number;
  question: string;
  // Subjective questions have no options — the answer is a photo upload.
  options?: string[];
  type?: string;
  marks: number;
  explanation?: string;
  // Question text (and options) may contain LaTeX — render via LatexText.
  hasLatex?: boolean;
  // Subjective-only: teacher-attached diagram/image for the question.
  diagramUrl?: string;
}

export interface TestDetailAttemptInfo {
  attemptId: string;
  startedAt: string;
  timeSpent: number;
  answers: Array<{ questionNumber: number; answer: string | number }>;
}

export interface TestDetail {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  type: "mcq" | "subjective";
  duration: number;
  totalMarks: number;
  passingMarks?: number;
  passingPercentage: number;
  totalQuestions: number;
  shuffleQuestions: boolean;
  // Server-side no-op (blueprint §9/§10.4) — options always render in the
  // order the API returns them regardless of this flag. Never re-shuffle
  // client-side: the student submits the on-screen option's letter, and
  // grading compares it against correctAnswer's letter in the ORIGINAL
  // stored order.
  shuffleOptions: boolean;
  showResultsImmediately: boolean;
  courseName: string;
  subjectName: string;
  moduleName?: string;
  questions?: Question[];
  attemptInfo?: TestDetailAttemptInfo;
}

export interface StartTestAttemptResult {
  attemptId: string;
  attemptNumber?: number;
  message: string;
}

export interface SubmitTestResult {
  attemptId: string;
  totalScore: number;
  percentage: number;
  passed: boolean;
  showResults: boolean;
  message: string;
}

export interface UploadAnswerImageResult {
  url: string;
}

export interface DetailedAnswer {
  questionNumber: number;
  question: string;
  hasLatex?: boolean;
  options?: string[];
  // MCQ-only fields
  selectedOption?: number;
  selectedOptionText?: string | null;
  isCorrect?: boolean;
  correctOption?: number;
  correctOptionText?: string | null;
  marks?: number;
  explanation?: string;
  // Subjective-only fields — the student's uploaded photo answer plus
  // whatever the teacher has awarded so far (undefined until graded)
  submittedImageUrl?: string;
  marksAwarded?: number;
  maxMarks?: number;
}

export interface TestResult {
  test: {
    _id: string;
    title: string;
    type: string;
    totalMarks: number;
    passingMarks?: number;
    passingPercentage: number;
    totalQuestions: number;
    showCorrectAnswers: boolean;
  };
  attempt: {
    attemptId: string;
    attemptNumber: number;
    startedAt: string;
    submittedAt?: string;
    timeSpent: number;
    totalScore: number;
    percentage: number;
    status: string;
    feedback?: string;
    gradedAt?: string;
    passed: boolean;
    answers: DetailedAnswer[];
  };
}
