import { LatexText } from "@/components/latex-preview";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/test";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// Options render in exactly the order the API returns them — shuffleOptions
// is a documented server-side no-op (blueprint §10.4); re-shuffling here
// would submit the wrong letter for the on-screen position and grade wrong.
export function McqQuestion({
  question,
  selectedLetter,
  onSelect,
}: {
  question: Question;
  selectedLetter: string | undefined;
  onSelect: (letter: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-base font-medium text-foreground">
        <LatexText content={question.question} hasLatex={question.hasLatex} />
      </div>

      <div className="space-y-2">
        {(question.options ?? []).map((option, index) => {
          const letter = OPTION_LETTERS[index] ?? String(index);
          const isSelected = selectedLetter === letter;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(letter)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border hover:bg-secondary/60"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                )}
              >
                {letter}
              </span>
              <span className="pt-0.5">
                <LatexText content={option} hasLatex={question.hasLatex} />
              </span>
            </button>
          );
        })}
        {(!question.options || question.options.length === 0) && (
          <p className="text-sm text-muted-foreground">No options available for this question.</p>
        )}
      </div>
    </div>
  );
}
