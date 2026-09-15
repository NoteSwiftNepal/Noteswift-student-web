"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowBigUp, ArrowBigDown, CheckCircle2, ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import {
  getQuestionById,
  replyToQuestion,
  resolveQuestion,
  voteQuestion,
} from "@/api/student/questions";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RoutePlaceholder } from "@/components/route-placeholder";

export default function QuestionDetailPage() {
  const params = useParams<{ questionId: string }>();
  const questionId = params.questionId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const [reply, setReply] = useState("");

  const { data: question, isPending, error } = useQuery({
    queryKey: ["question", questionId],
    queryFn: async () => {
      const res = await getQuestionById(questionId);
      if (res.error) throw new Error(res.message);
      return res.result.question;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["question", questionId] });
    queryClient.invalidateQueries({ queryKey: ["questions"] });
  };

  const voteMutation = useMutation({
    mutationFn: (voteType: "upvote" | "downvote") => voteQuestion(questionId, voteType),
    onSuccess: (res) => {
      if (res.error) {
        toast({ title: "Couldn't vote", description: res.message, variant: "destructive" });
        return;
      }
      invalidate();
    },
    onError: () => toast({ title: "Couldn't vote", description: "Please try again.", variant: "destructive" }),
  });

  const resolveMutation = useMutation({
    mutationFn: () => resolveQuestion(questionId),
    onSuccess: (res) => {
      if (res.error) {
        toast({ title: "Couldn't resolve", description: res.message, variant: "destructive" });
        return;
      }
      toast({ title: "Marked as resolved" });
      invalidate();
    },
  });

  const replyMutation = useMutation({
    mutationFn: () => replyToQuestion(questionId, reply.trim()),
    onSuccess: (res) => {
      if (res.error) {
        toast({ title: "Couldn't send reply", description: res.message, variant: "destructive" });
        return;
      }
      setReply("");
      toast({ title: "Reply sent", description: "Waiting for teacher response." });
      invalidate();
    },
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !question) {
    return <RoutePlaceholder title="Question not found" />;
  }

  const isMine = question.studentId === userId;
  const upvoted = userId ? question.upvotes.includes(userId) : false;
  const downvoted = userId ? question.downvotes.includes(userId) : false;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => router.back()}>
        <ChevronLeft className="size-4" />
        Back
      </Button>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {question.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {question.subjectName} &middot; {question.courseName}
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground">{question.title}</h1>
          <p className="whitespace-pre-wrap text-sm text-foreground">{question.questionText}</p>

          {question.attachments && question.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {question.attachments.map((att, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={att.url} alt={att.name} className="h-24 rounded-lg border border-border object-cover" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => voteMutation.mutate("upvote")}
              disabled={voteMutation.isPending}
              className={`flex items-center gap-1 text-sm ${upvoted ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ArrowBigUp className="size-5" />
              {question.upvotes.length}
            </button>
            <button
              type="button"
              onClick={() => voteMutation.mutate("downvote")}
              disabled={voteMutation.isPending}
              className={`flex items-center gap-1 text-sm ${downvoted ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ArrowBigDown className="size-5" />
              {question.downvotes.length}
            </button>

            {isMine && question.status === "answered" && (
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => resolveMutation.mutate()} disabled={resolveMutation.isPending}>
                <CheckCircle2 className="size-4" />
                Mark resolved
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">
          {question.answers.length} Answer{question.answers.length === 1 ? "" : "s"}
        </h2>
        {question.answers.map((answer, i) => (
          <Card key={answer._id ?? i}>
            <CardContent className="space-y-1.5 p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{answer.answeredByName}</p>
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {answer.answeredByRole}
                </Badge>
                {answer.isAccepted && (
                  <Badge className="gap-1 bg-green-100 text-[10px] text-green-700 hover:bg-green-100">
                    <CheckCircle2 className="size-3" />
                    Accepted
                  </Badge>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{answer.answerText}</p>
              <p className="text-xs text-muted-foreground">{new Date(answer.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}

        {isMine && question.status === "answered" && (
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-medium text-foreground">Have a follow-up?</p>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Ask a follow-up question..."
                rows={3}
              />
              <Button
                size="sm"
                onClick={() => replyMutation.mutate()}
                disabled={!reply.trim() || replyMutation.isPending}
              >
                {replyMutation.isPending ? "Sending..." : "Send reply"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
