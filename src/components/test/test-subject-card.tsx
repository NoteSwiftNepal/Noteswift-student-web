import Link from "next/link";
import { BookOpenCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Subjects tab shows ONLY these — no tests inline, no grouped sections
// (docs/DESIGN-STANDARDS.md §12 fix-pass). Clicking navigates to a real,
// linkable route (/test/subject/[subjectName]) rather than expanding
// in-page state, matching the routing convention Learn's own subject
// drill-down already uses.
export function TestSubjectCard({
  subjectName,
  totalTests,
  completedTests,
}: {
  subjectName: string;
  totalTests: number;
  completedTests: number;
}) {
  return (
    <Link href={`/test/subject/${encodeURIComponent(subjectName)}`} className="block h-full">
      <Card className="h-full transition-[transform,box-shadow] duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-2">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpenCheck className="size-5" />
          </div>
          <p className="line-clamp-2 flex-1 text-title text-foreground">{subjectName}</p>
          <div className="flex items-center justify-between text-body-sm text-muted-foreground">
            <span>
              {totalTests} test{totalTests === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-1 font-medium text-primary">
              <CheckCircle2 className="size-3.5" />
              {completedTests} done
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
