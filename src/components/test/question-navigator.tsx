import { cn } from "@/lib/utils";

export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answeredQuestionNumbers,
  onSelect,
}: {
  totalQuestions: number;
  currentIndex: number;
  answeredQuestionNumbers: Set<number>;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-5">
      {Array.from({ length: totalQuestions }).map((_, index) => {
        const questionNumber = index + 1;
        const isAnswered = answeredQuestionNumbers.has(questionNumber);
        const isCurrent = index === currentIndex;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              "flex size-9 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
              isCurrent
                ? "border-primary bg-primary text-primary-foreground"
                : isAnswered
                  ? "border-green-200 bg-green-100 text-green-700"
                  : "border-border text-muted-foreground hover:bg-secondary/60"
            )}
          >
            {questionNumber}
          </button>
        );
      })}
    </div>
  );
}
