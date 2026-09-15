"use client";

import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shared inline error state for any data-fetching view — a query's error
// state should never look the same as "genuinely no data yet" (the Phase 7
// polish-pass brief specifically calls this out: several routes previously
// only handled the loading/success cases and let a failed fetch fall
// through to look like an empty list). Use wherever a query's `isError` (or
// equivalent thrown-error) case needs a visible, retriable state.
export function InlineError({
  message = "Something went wrong loading this.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-12 text-center ${className ?? ""}`}
    >
      <AlertCircle className="size-8 text-destructive" />
      <p className="text-sm font-medium text-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="size-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}
