import { useQueries, useQuery } from "@tanstack/react-query";
import { getSubjectContent } from "@/api/lessonProgress";
import type { SubjectContent } from "@/types/subject-content";

// Same query key shape as mobile's hooks/queries/useSubjectContent.ts —
// ["subjectContent", courseId, subjectName].
export function useSubjectContent(courseId?: string, subjectName?: string) {
  const query = useQuery({
    queryKey: ["subjectContent", courseId, subjectName],
    queryFn: async () => {
      const res = await getSubjectContent(courseId!, subjectName!);
      if (!res.success) {
        throw new Error(res.message || "Failed to load subject content");
      }
      return res.data;
    },
    enabled: !!courseId && !!subjectName,
  });

  return {
    subjectContent: query.data ?? null,
    subjectContentLoading: query.isPending,
    subjectContentError: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

// Every subject of a course, fetched in parallel and keyed by subject name —
// ported from mobile's useAllSubjectContents (hooks/queries/useSubjectContent.ts),
// which exists for exactly this need: an accurate per-subject lesson count
// before the student has picked one, since the Course object's own embedded
// subjects[].modules can be a stale client snapshot (see that hook's own
// comment). Reuses the same getSubjectContent wrapper/cache entries as
// useSubjectContent above (one entry per subject, same key shape) rather
// than a separate bulk endpoint — selecting a subject afterward reads a warm
// cache instead of refetching.
export function useAllSubjectContents(courseId: string | undefined, subjectNames: string[]) {
  const queries = useQueries({
    queries: subjectNames.map((name) => ({
      queryKey: ["subjectContent", courseId, name],
      queryFn: async (): Promise<SubjectContent> => {
        const res = await getSubjectContent(courseId!, name);
        if (!res.success) throw new Error(res.message || "Failed to load subject content");
        return res.data;
      },
      enabled: !!courseId,
    })),
  });

  const subjectContents = new Map<string, SubjectContent>();
  queries.forEach((q, i) => {
    if (q.data) subjectContents.set(subjectNames[i], q.data);
  });

  return {
    subjectContents,
    isLoaded: queries.every((q) => q.isFetched),
  };
}
