import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
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
  );
}
