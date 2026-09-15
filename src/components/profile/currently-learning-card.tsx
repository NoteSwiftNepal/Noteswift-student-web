"use client";

import { BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { getCourseId } from "@/lib/course";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// A second entry point for the same course-selection mechanism as My
// Batches (src/hooks/useSelectedCourse.ts, backed by Student.selectedCourseId)
// — a deliberate web adaptation, not a mobile port: mobile only has the one
// entry point (a dedicated My Batches screen) because its screen space is
// scarce. Having it here too is a genuine improvement, not a duplication of
// logic, since both read/write the exact same hook/field.
export function CurrentlyLearningCard() {
  const { selectedCourse, enrolledCourses, enrollmentsLoading, selectCourse, selectingCourse } = useSelectedCourse();

  if (enrollmentsLoading || enrolledCourses.length === 0) {
    return null;
  }

  const handleChange = (courseId: string) => {
    selectCourse(courseId, {
      onSuccess: (res) => {
        if (!res.success) {
          toast({ title: "Couldn't switch course", description: res.message, variant: "destructive" });
        }
      },
      onError: () => toast({ title: "Couldn't switch course", description: "Please try again.", variant: "destructive" }),
    });
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BookOpen className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Currently learning</p>
          <Select value={selectedCourse ? getCourseId(selectedCourse) : undefined} onValueChange={handleChange} disabled={selectingCourse}>
            <SelectTrigger className="h-8 border-none px-0 text-sm font-medium shadow-none focus:ring-0">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {enrolledCourses.map((c) => (
                <SelectItem key={getCourseId(c)} value={getCourseId(c)}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
