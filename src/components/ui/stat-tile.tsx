import { cn } from "@/lib/utils";

// Shared icon-chip + value + label stat tile (docs/DESIGN-STANDARDS.md §6) —
// extracted from the Dashboard's stats-overview.tsx so every stats row in
// the app (Dashboard, Test, and any future one) reuses the same visual
// language instead of each page inventing its own tile.
export function StatTile({
  icon: Icon,
  iconClassName,
  iconStyle,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconClassName: string;
  iconStyle?: React.CSSProperties;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4 shadow-1">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-sm", iconClassName)}>
        <Icon className="size-5" style={iconStyle} />
      </div>
      <div className="min-w-0">
        <p className="text-h4 tabular-nums leading-none text-foreground">{value}</p>
        <p className="mt-1 truncate text-caption text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
