"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  Brain,
  EyeOff,
  CalendarClock,
  NotebookPen,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Ported as a real feature, NOT a "coming soon" stub — confirmed by reading
// app/Ask/StudyTips.tsx directly (222 lines of real static content, no API
// calls, no "coming soon" text) rather than assuming from CODEBASE_MAP.md's
// summary, which groups it with the genuine stubs (Community/DoubtSolver/
// QuestionGenerator). Same static tips content, ported verbatim.
interface StudyTip {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tips: string[];
}

const STUDY_TIPS: StudyTip[] = [
  {
    id: "1",
    category: "Time Management",
    title: "Pomodoro Technique",
    description: "Study in focused 25-minute intervals with short breaks",
    icon: Clock,
    tips: [
      "Set a timer for 25 minutes of focused study",
      "Take a 5-minute break after each session",
      "After 4 sessions, take a longer 15-30 minute break",
      "Use breaks to stretch, hydrate, or relax your eyes",
      "Track your completed pomodoros to measure productivity",
    ],
  },
  {
    id: "2",
    category: "Memory",
    title: "Active Recall",
    description: "Test yourself frequently instead of passive re-reading",
    icon: Brain,
    tips: [
      "Close your notes and try to recall information from memory",
      "Create flashcards for key concepts and definitions",
      "Explain topics to someone else or out loud to yourself",
      "Use practice tests and past papers regularly",
      "Space out your review sessions over multiple days",
    ],
  },
  {
    id: "3",
    category: "Focus",
    title: "Distraction-Free Environment",
    description: "Create an optimal space for deep concentration",
    icon: EyeOff,
    tips: [
      "Turn off phone notifications or use focus mode",
      "Use website blockers to limit social media during study",
      "Keep your study area clean and organized",
      "Use noise-cancelling headphones or white noise",
      "Study in a dedicated space, not where you sleep",
    ],
  },
  {
    id: "4",
    category: "Exam Prep",
    title: "Strategic Revision",
    description: "Plan your revision systematically for better results",
    icon: CalendarClock,
    tips: [
      "Start revision at least 2-3 weeks before exams",
      "Create a revision timetable covering all subjects",
      "Prioritize weak topics but don't neglect strong ones",
      "Practice past papers under timed conditions",
      "Get 7-8 hours of sleep, especially before exams",
    ],
  },
  {
    id: "5",
    category: "Note-Taking",
    title: "Cornell Method",
    description: "Structured system for organizing and reviewing notes",
    icon: NotebookPen,
    tips: [
      "Divide your page into three sections: notes, cues, summary",
      "Write main notes during class or reading",
      "Add keywords and questions in the cue column",
      "Summarize the page in your own words at the bottom",
      "Review notes within 24 hours for better retention",
    ],
  },
  {
    id: "6",
    category: "Understanding",
    title: "Feynman Technique",
    description: "Learn by teaching and simplifying complex concepts",
    icon: GraduationCap,
    tips: [
      "Choose a concept you want to understand deeply",
      "Explain it in simple terms as if teaching a child",
      "Identify gaps in your understanding when you struggle",
      "Go back to your materials to fill those gaps",
      "Simplify your explanation and use analogies",
    ],
  },
];

export default function StudyTipsPage() {
  const router = useRouter();
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(STUDY_TIPS.map((t) => t.category)))],
    []
  );
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = category === "All" ? STUDY_TIPS : STUDY_TIPS.filter((t) => t.category === category);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Tips</h1>
          <p className="text-sm text-muted-foreground">Proven techniques to study smarter.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              category === c
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((tip) => {
          const isOpen = expanded === tip.id;
          return (
            <Card key={tip.id}>
              <CardContent className="p-5">
                <button
                  type="button"
                  className="flex w-full items-start gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : tip.id)}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <tip.icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Badge variant="secondary" className="mb-1 text-[10px]">
                      {tip.category}
                    </Badge>
                    <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                    <p className="text-xs text-muted-foreground">{tip.description}</p>
                  </div>
                </button>

                {isOpen && (
                  <ul className="mt-4 space-y-2 border-t border-border pt-4">
                    {tip.tips.map((t, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="text-primary">&bull;</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
