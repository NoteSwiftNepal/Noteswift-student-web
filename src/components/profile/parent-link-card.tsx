"use client";

import { useEffect, useState } from "react";
import { UserRound, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { generateParentLinkCode } from "@/api/student/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_LINKED_PARENTS = 2;

// Ported from Profile/ParentLink.tsx — code display + countdown, linked-
// parents list read from user.parentNames (falling back to splitting the
// legacy single parentName field on " & ", same as mobile).
export function ParentLinkCard() {
  const user = useAuthStore((s) => s.user);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setCode(null);
        setExpiresAt(null);
        setTimeLeft("");
        clearInterval(timer);
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const linkedParentNames: string[] =
    user?.parentNames ?? (user?.parentName ? user.parentName.split(" & ") : []);
  const isMaxed = linkedParentNames.length >= MAX_LINKED_PARENTS;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateParentLinkCode();
      if (res.error || !res.result) throw new Error(res.message || "Failed to generate code");
      setCode(res.result.code);
      setExpiresAt(new Date(res.result.expiresAt).getTime());
    } catch (err) {
      toast({
        title: "Code generation failed",
        description: err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Parent Link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Share a one-time code with your parent so they can connect to your account.
          </p>
          {isMaxed ? (
            <p className="text-sm text-muted-foreground">
              You&apos;ve reached the maximum of {MAX_LINKED_PARENTS} linked parent accounts.
            </p>
          ) : code ? (
            <div className="rounded-lg bg-secondary/50 p-4 text-center">
              <p className="text-2xl font-bold tracking-widest text-foreground">{code}</p>
              <p className="mt-2 text-xs text-muted-foreground">Expires in {timeLeft || "..."}</p>
            </div>
          ) : (
            <Button onClick={handleGenerate} disabled={generating} className="w-full">
              {generating ? "Generating..." : linkedParentNames.length === 1 ? "Link Another Parent Account" : "Generate Linking Code"}
            </Button>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Linked Parents</p>
            <span className="text-xs text-muted-foreground">
              {linkedParentNames.length}/{MAX_LINKED_PARENTS}
            </span>
          </div>
          {linkedParentNames.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No parents linked yet</p>
          ) : (
            <ul className="space-y-2">
              {linkedParentNames.map((name, i) => (
                <li key={`${name}-${i}`} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                  <UserRound className="size-4 text-muted-foreground" />
                  <span className="flex-1">{name}</span>
                  <CheckCircle2 className="size-4 text-green-600" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
