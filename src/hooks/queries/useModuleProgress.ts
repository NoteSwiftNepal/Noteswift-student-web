import { useQueries } from "@tanstack/react-query";
import { getModuleProgress } from "@/api/lessonProgress";
import type { ModuleProgressEntry } from "@/types/lesson-progress";

// Per-module progress, fetched in parallel and keyed by moduleNumber — same
// existing getModuleProgress wrapper the chapter/module detail page already
// uses (same query key shape, ["module-progress", courseId, moduleNumber,
// courseSubjectId]), applied at list scale via useQueries, the same pattern
// useAllSubjectContents already established for per-subject lesson counts.
// Only videoCompleted is read anywhere this is consumed — it's the one
// progress signal Phase 3 actually wired up correctly (see
// MOBILE_APP_CODE_ISSUES.md's per-module-progress-is-a-mobile-stub entry);
// notes/DPP completion isn't surfaced since there's no verified real signal
// for it yet.
export function useModuleProgressBulk(
  courseId: string | undefined,
  courseSubjectId: string | undefined,
  moduleNumbers: number[]
) {
  const queries = useQueries({
    queries: moduleNumbers.map((moduleNumber) => ({
      queryKey: ["module-progress", courseId, moduleNumber, courseSubjectId],
      queryFn: async (): Promise<ModuleProgressEntry> => {
        const res = await getModuleProgress(courseId!, moduleNumber, courseSubjectId!);
        if (!res.success) throw new Error(res.message);
        return res.data.moduleProgress;
      },
      enabled: !!courseId && !!courseSubjectId,
    })),
  });

  const progressByModule = new Map<number, ModuleProgressEntry>();
  queries.forEach((q, i) => {
    if (q.data) progressByModule.set(moduleNumbers[i], q.data);
  });

  return { progressByModule };
}
