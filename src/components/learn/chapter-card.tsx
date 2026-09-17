import Link from "next/link";
import { PlayCircle, FileText, ClipboardList, CheckCircle2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ModuleContentTag } from "@/types/subject-content";

// Content-type icon per tag (docs/DESIGN-STANDARDS.md §1 "confident
// accents" — a content-type label isn't a semantic signal worth spending
// four separate saturated hues on, so every tag shares one calm neutral
// chip treatment below; the icon shape, not color, is what tells video
// apart from notes apart from DPP apart from solutions).
const TAG_ICON: Record<ModuleContentTag["type"], typeof PlayCircle> = {
  video: PlayCircle,
  notes: FileText,
  dpp: ClipboardList,
  solution: CheckCircle2,
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
      <Card className="h-full transition-[transform,box-shadow] duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-2">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-title text-primary">
              {moduleNumber}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-title leading-snug text-foreground">{moduleName}</p>
              {watched && (
                <span className="mt-1 inline-flex items-center gap-1 text-caption text-success-500">
                  <CheckCircle className="size-3.5" />
                  Watched
                </span>
              )}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
              {tags.map((tag) => {
                const Icon = TAG_ICON[tag.type];
                return (
                  <span
                    key={tag.type}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-2.5 py-1 text-caption text-secondary-foreground"
                  >
                    <Icon className="size-3.5 text-muted-foreground" />
                    {tag.count} {tag.label}
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
