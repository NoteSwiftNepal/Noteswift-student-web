"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveClassList } from "@/components/learn/live-class-list";

// Standalone entry point (linked from Dashboard's "Today's Classes" and
// courses/dashboard) for the same content the "Live Classes" tab on /learn
// renders — see live-class-list.tsx for the shared component itself.
export default function LiveClassListPage() {
  const router = useRouter();

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
          <h1 className="text-h1 text-foreground">Live Classes</h1>
          <p className="text-body text-muted-foreground">Join an ongoing class or see what&apos;s scheduled.</p>
        </div>
      </div>

      <LiveClassList />
    </div>
  );
}
