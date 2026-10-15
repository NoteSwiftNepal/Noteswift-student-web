"use client";

import { BookOpen, Check, ChevronDown, Loader2 } from "lucide-react";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { getCourseId } from "@/lib/course";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// "Switch course" in the header, left of the notification bell (owner's
// request, 2026-10-15): shows the course being learned and lists the
// student's enrolled courses. Uses the same useSelectedCourse mechanism as
// My Batches / Profile / Learn, so switching here changes all of them.
// Hidden for students with no enrolled course.
export function CourseSwitcher({ compact = false }: { compact?: boolean }) {
  const { selectedCourse, enrolledCourses, selectCourse, selectingCourse } = useSelectedCourse();
  if (enrolledCourses.length === 0) return null;

  const currentId = selectedCourse ? getCourseId(selectedCourse) : undefined;

  const choose = (courseId: string) => {
    if (courseId === currentId) return;
    selectCourse(courseId, {
      onSuccess: (res) => {
        if (!res.success) {
          toast({ title: "Couldn't switch course", description: res.message, variant: "destructive" });
          return;
        }
        toast({ title: "Course switched" });
      },
      onError: () => toast({ title: "Couldn't switch course", description: "Please try again.", variant: "destructive" }),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Switch course"
        className={cn(
          "flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "max-w-[150px]" : "max-w-[260px]"
        )}
      >
        {selectingCourse ? <Loader2 className="size-4 shrink-0 animate-spin text-primary" /> : <BookOpen className="size-4 shrink-0 text-primary" />}
        <span className="truncate">{selectedCourse?.title ?? "Switch course"}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Switch course</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {enrolledCourses.map((course) => {
          const id = getCourseId(course);
          const active = id === currentId;
          return (
            <DropdownMenuItem key={id} onSelect={() => choose(id)} className="gap-2">
              <Check className={cn("size-4 shrink-0", active ? "text-primary" : "invisible")} />
              <span className={cn("truncate", active && "font-semibold")}>{course.title}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
