import { cn } from "@/lib/utils";

// docs/DESIGN-STANDARDS.md §6.12 — formalizes what were previously
// hand-colored per-call-site pills ("live"/"free"/"upcoming"/"pro"). `pro`
// is the warm gold accent, never purple (§2.1) — sweep any remaining
// purple-100/purple-600 "Pro" pill to this during that page's own refactor.
export type StatusTone = "live" | "free" | "upcoming" | "pro" | "neutral" | "success" | "danger";

const TONE_CLASSES: Record<StatusTone, string> = {
  live: "bg-danger-100 text-danger-700",
  danger: "bg-danger-100 text-danger-700",
  free: "bg-success-100 text-success-700",
  success: "bg-success-100 text-success-700",
  upcoming: "bg-warning-100 text-warning-700",
  pro: "bg-gold-100 text-gold-700",
  neutral: "bg-secondary text-secondary-foreground",
};

export function StatusBadge({
  tone,
  children,
  className,
  icon: Icon,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold leading-none",
        TONE_CLASSES[tone],
        className
      )}
    >
      {tone === "live" ? (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-500 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-danger-500" />
        </span>
      ) : (
        Icon && <Icon className="size-3" />
      )}
      {children}
    </span>
  );
}
