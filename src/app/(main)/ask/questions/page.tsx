"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { useQuestions } from "@/hooks/queries/useQuestions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/inline-error";
import type { QuestionSummary } from "@/types/question";

function statusBadge(status: QuestionSummary["status"]) {
  switch (status) {
    case "resolved":
      return (
        <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2 className="size-3" />
          Resolved
        </Badge>
      );
    case "answered":
      return (
        <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
          <MessageSquare className="size-3" />
          Answered
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="size-3" />
          Pending
        </Badge>
      );
  }
}

export default function MyDoubtsPage() {
  // Unscoped (every course) — mirrors mobile's AllQuestions.tsx/MyDoubts,
  // which is the same underlying "my questions" data as this page (there is
  // no separate "browse other students' public questions" endpoint on the
  // backend — confirmed against questions.route.ts, which always scopes
  // GET /questions to the authenticated student).
  const { questions, questionsLoading, error, refetch } = useQuestions();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subjectName?.toLowerCase().includes(q) ||
        item.questionText?.toLowerCase().includes(q)
    );
  }, [questions, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Doubts</h1>
          <p className="text-sm text-muted-foreground">Every question you've asked, across all courses.</p>
        </div>
        <Button asChild>
          <Link href="/ask/doubt">
            <Plus className="size-4" />
            Ask a doubt
          </Link>
        </Button>
      </div>

      <div className="relative sm:w-80">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search doubts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {questionsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <InlineError message="Couldn't load your doubts." onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No doubts yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Link key={q._id} href={`/ask/questions/${q._id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{q.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{q.questionText}</p>
                    </div>
                    {statusBadge(q.status)}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{q.subjectName}</span>
                    <span>&middot;</span>
                    <span>{q.courseName}</span>
                    <span>&middot;</span>
                    <span>{q.answersCount} answer{q.answersCount === 1 ? "" : "s"}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
