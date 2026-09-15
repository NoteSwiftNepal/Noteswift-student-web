"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Download, History as HistoryIcon, PlayCircle, FileText, Users } from "lucide-react";
import { useHistory } from "@/hooks/queries/useHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import { cn } from "@/lib/utils";
import type { HistoryItem, HistoryItemType } from "@/types/history";

const TABS: { key: HistoryItemType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "video", label: "Videos" },
  { key: "notes", label: "Notes" },
  { key: "test", label: "Tests" },
  { key: "live_class", label: "Live Classes" },
  { key: "download", label: "Downloads" },
];

const ICONS: Record<HistoryItemType, { icon: typeof PlayCircle; className: string }> = {
  video: { icon: PlayCircle, className: "bg-red-500/10 text-red-600" },
  notes: { icon: FileText, className: "bg-primary/10 text-primary" },
  test: { icon: CheckCircle2, className: "bg-green-500/10 text-green-600" },
  live_class: { icon: Users, className: "bg-purple-500/10 text-purple-600" },
  download: { icon: Download, className: "bg-amber-500/10 text-amber-600" },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

function dateLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function subtitleFor(item: HistoryItem): string {
  switch (item.type) {
    case "video":
      return item.progress !== undefined ? `Watched ${item.progress}%` : "Watched";
    case "notes":
      return "Read";
    case "test":
      return item.score ? `Score: ${item.score.obtained}/${item.score.total}` : "Attempted";
    case "live_class":
      return item.duration ? `Attended • ${item.duration}` : "Attended";
    case "download":
      return item.fileType ? `Downloaded • ${item.fileType}` : "Downloaded";
    default:
      return "";
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const { history, historyLoading, error, refetch } = useHistory();
  const [activeTab, setActiveTab] = useState<HistoryItemType | "all">("all");

  // GET /history can return duplicate _id values for "video" entries — its
  // id is derived from `enrollment._id` + `moduleNumber` (routes/history.ts),
  // which collides whenever an enrollment's moduleProgress array has more
  // than one entry for the same moduleNumber (a backend-side data-integrity
  // issue, not something this page can fix). Dedupe defensively so React
  // never sees two list items sharing a key.
  const filtered = useMemo(() => {
    const byType = activeTab === "all" ? history : history.filter((h) => h.type === activeTab);
    const seen = new Set<string>();
    return byType.filter((item) => (seen.has(item._id) ? false : (seen.add(item._id), true)));
  }, [history, activeTab]);

  const grouped = useMemo(() => {
    const map = new Map<string, HistoryItem[]>();
    for (const item of filtered) {
      const key = dateLabel(item.timestamp);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [filtered]);

  const handleClick = (item: HistoryItem) => {
    if (item.type === "test" && item.contentId) router.push(`/test/${item.contentId}`);
    else if (item.type === "download") router.push("/downloads");
    else if (item.type === "video" || item.type === "notes" || item.type === "live_class") router.push("/learn");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My History</h1>
        <p className="text-sm text-muted-foreground">Everything you&apos;ve watched, read, and attempted.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const count = tab.key === "all" ? history.length : history.filter((h) => h.type === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                activeTab === tab.key ? "bg-foreground text-background" : "border border-border bg-card text-muted-foreground hover:bg-secondary/60"
              )}
            >
              {tab.label}
              {count > 0 && ` (${count})`}
            </button>
          );
        })}
      </div>

      {historyLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load your history." onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <HistoryIcon className="mb-3 size-10 text-muted-foreground" />
          <p className="text-base font-medium text-foreground">No learning activity yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Start exploring courses to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateKey, items]) => (
            <div key={dateKey}>
              <p className="mb-2 text-sm font-bold text-muted-foreground">{dateKey}</p>
              <div className="space-y-2">
                {items.map((item) => {
                  const { icon: Icon, className } = ICONS[item.type];
                  return (
                    <button
                      key={item._id}
                      onClick={() => handleClick(item)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-secondary/40"
                    >
                      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", className)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                        {item.courseName && <p className="truncate text-xs text-muted-foreground">{item.courseName}</p>}
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 className="size-3" />
                          <span>{subtitleFor(item)}</span>
                          <span className="ml-auto">{relativeTime(item.timestamp)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
