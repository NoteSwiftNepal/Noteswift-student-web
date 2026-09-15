import { useQuery } from "@tanstack/react-query";
import { getQuestions } from "@/api/student/questions";
import type { QuestionSummary } from "@/types/question";

// Same query key as mobile's hooks/queries/useQuestions.ts —
// ["questions", courseId ?? null].
export function useQuestions(courseId?: string, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: ["questions", courseId ?? null],
    queryFn: async (): Promise<QuestionSummary[]> => {
      const res = await getQuestions(courseId);
      if (res.error) throw new Error(res.message);
      return res.result.questions;
    },
    enabled: options?.enabled ?? true,
  });

  return {
    questions: query.data ?? [],
    questionsLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
