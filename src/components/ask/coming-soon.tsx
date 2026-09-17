"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Shared by every Ask-hub "coming soon" stub (community, doubt-solver,
// question-generator, study-tips) — the back button lives here once so all
// four get it, rather than editing four near-identical page files.
export function ComingSoon({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => router.back()} aria-label="Back">
        <ChevronLeft className="size-4" />
      </Button>
      <div className="mx-auto max-w-md py-10 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10">
            <Icon className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">{title} coming soon</p>
            <p className="text-sm text-muted-foreground">
              This feature is still a work in progress — matching its status in the mobile app.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
