import Link from "next/link";
import { PlayCircle, FileText, ClipboardList, CheckCircle2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ModuleContentTag } from "@/types/subject-content";

const TAG_META: Record<ModuleContentTag["type"], { icon: typeof PlayCircle; className: string }> = {
  video: { icon: PlayCircle, className: "bg-red-500/10 text-red-600" },
  notes: { icon: FileText, className: "bg-primary/10 text-primary" },
  dpp: { icon: ClipboardList, className: "bg-purple-500/10 text-purple-600" },
  solution: { icon: CheckCircle2, className: "bg-green-500/10 text-green-600" },
};

// Redesigned rather than ported verbatim from mobile's plain white-card-
// plus-chevron ChapterCard.tsx (components/Container/ChapterCard.tsx) — a
// clearer visual hierarchy (a numbered lead, prominent title, content types
// as real icon+label chips instead of small text-in-a-pill, a hover
// elevation for desktop pointers) rather than a flat DOM clone. The
// "Watched" indicator is real: Phase 3's video-watched-progress signal
// (updateModuleProgress's videoCompleted flag) is genuinely wired up —
// deliberately NOT shown for notes/DPP, which have no verified real
// completion signal (see MOBILE_APP_CODE_ISSUES.md).
export function ChapterCard({
  href,
  moduleNumber,
  moduleName,
  tags,
  watched,
}: {
  href: string;
  moduleNumber: number;
  moduleName: string;
  tags: ModuleContentTag[];
  watched?: boolean;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
              {moduleNumber}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-base font-bold leading-snug text-foreground">{moduleName}</p>
              {watched && (
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-700">
                  <CheckCircle className="size-3.5" />
                  Watched
                </span>
              )}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 border-t border-border pt-3">
              {tags.map((tag) => {
                const meta = TAG_META[tag.type];
                const Icon = meta.icon;
                return (
                  <span
                    key={tag.type}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
                  >
                    <Icon className="size-3.5" />
                    {tag.label} ({tag.count})
                  </span>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
