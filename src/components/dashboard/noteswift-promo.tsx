import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NoteSwiftPromo() {
  return (
    <Card className="border-none bg-gradient-to-r from-primary to-blue-700">
      <CardContent className="flex flex-col gap-3 p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold">NoteSwift Pro</p>
          <p className="text-sm text-primary-foreground/85">
            Unlock smarter learning with premium courses and tools.
          </p>
        </div>
        <Button asChild variant="secondary" className="w-fit">
          <Link href="/courses/pro">Learn more</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
