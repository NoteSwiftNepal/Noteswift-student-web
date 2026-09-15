import { create } from "zustand";

// In-progress test-attempt state: current question, answers, and the
// countdown timer. Deliberately NOT persisted — an in-progress attempt's
// local answer state is exactly as ephemeral on mobile too (MCQTest.tsx
// holds it in plain component useState, not AsyncStorage-backed). Mobile
// also has a Zustand store literally named testStore.ts, but it caches the
// test LIST/filters (superseded here by useTests' React Query cache) — it
// holds no attempt-answer state at all, despite the name; see
// MOBILE_APP_CODE_ISSUES.md.
interface TestAttemptState {
  testId: string | null;
  attemptId: string | null;
  currentQuestionIndex: number;
  // questionNumber -> answer. MCQ: the option LETTER ('A'/'B'/...), matching
  // what the backend grades against. Subjective: the uploaded image URL.
  answers: Record<number, string>;
  timeRemaining: number; // seconds
  startedAt: number | null; // Date.now() at attempt start, for elapsed-time calc

  startAttempt: (testId: string, attemptId: string, durationSeconds: number) => void;
  setAnswer: (questionNumber: number, answer: string) => void;
  clearAnswer: (questionNumber: number) => void;
  goToQuestion: (index: number) => void;
  tick: () => void;
  reset: () => void;
}

const initialState = {
  testId: null,
  attemptId: null,
  currentQuestionIndex: 0,
  answers: {},
  timeRemaining: 0,
  startedAt: null,
};

export const useTestStore = create<TestAttemptState>()((set, get) => ({
  ...initialState,

  startAttempt: (testId, attemptId, durationSeconds) =>
    set({
      testId,
      attemptId,
      currentQuestionIndex: 0,
      answers: {},
      timeRemaining: durationSeconds,
      startedAt: Date.now(),
    }),

  setAnswer: (questionNumber, answer) =>
    set((state) => ({ answers: { ...state.answers, [questionNumber]: answer } })),

  clearAnswer: (questionNumber) =>
    set((state) => {
      const { [questionNumber]: _removed, ...rest } = state.answers;
      return { answers: rest };
    }),

  goToQuestion: (index) => set({ currentQuestionIndex: index }),

  tick: () => set((state) => ({ timeRemaining: Math.max(0, state.timeRemaining - 1) })),

  reset: () => set(initialState),
}));

export function getElapsedSeconds(): number {
  const { startedAt } = useTestStore.getState();
  return startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
}
