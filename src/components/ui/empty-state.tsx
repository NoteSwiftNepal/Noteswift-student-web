import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// docs/DESIGN-STANDARDS.md §6.10 — one shared "nothing here" component
// instead of bespoke markup per page. Tone (neutral/encouraging/reassuring)
// lives entirely in the copy passed as props, not as a branching prop here —
// see the doc for when to use which tone.
export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-surface-sunken/50 px-6 py-12 text-center ${className ?? ""}`}
    >
      {Icon && (
        <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="size-5" />
        </div>
      )}
      <p className="text-title text-foreground">{title}</p>
      {description && <p className="max-w-sm text-body-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button variant="outline" size="sm" className="mt-3" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
