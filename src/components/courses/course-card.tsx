import Link from "next/link";
import { BookOpen, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getCourseId, courseTypeBadgeClasses } from "@/lib/course";
import type { Course } from "@/types/course";

export function CourseCard({
  course,
  progress,
}: {
  course: Course;
  /** 0-100. When provided, renders an enrolled-progress bar instead of price/rating. */
  progress?: number;
}) {
  const id = getCourseId(course);

  return (
    <Link href={`/courses/${id}`} className="block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-video w-full bg-secondary/40">
          {course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail}
              alt={course.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="size-10 text-muted-foreground" />
            </div>
          )}
          {course.type && (
            <Badge
              className={cn("absolute right-2 top-2 capitalize", courseTypeBadgeClasses(course.type))}
            >
              {course.type}
            </Badge>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{course.title}</h3>
          <p className="text-xs text-muted-foreground">{course.offeredBy || "NoteSwift"}</p>

          {progress !== undefined ? (
            <div className="mt-auto space-y-1.5 pt-2">
              <Progress value={progress} className="h-1.5" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{Math.round(progress)}% complete</span>
                {progress >= 100 && (
                  <Badge className="bg-green-100 text-[10px] text-green-700 hover:bg-green-100">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-auto flex items-center justify-between pt-2">
              {course.rating ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {course.rating.toFixed(1)} ({course.enrolledCount ?? 0})
                </span>
              ) : (
                <span />
              )}
              <span
                className={cn(
                  "text-sm font-semibold",
                  course.price ? "text-foreground" : "text-green-700"
                )}
              >
                {course.price ? `Rs. ${course.price}` : "Free"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
