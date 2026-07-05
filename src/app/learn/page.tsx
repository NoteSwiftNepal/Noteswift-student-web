"use client";

import { useEffect, useState } from "react";
import { 
  BookOpen, 
  Video, 
  FileText, 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Clock, 
  Upload, 
  ClipboardList, 
  CheckSquare, 
  Play,
  Download,
  CheckCircle2,
  FileCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { api } from "@/services/api";
import { Course, CourseEnrollment, Assignment, SubjectContent, LessonContent } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";


function LearningFeedContent() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("Mathematics");
  const [subjectContent, setSubjectContent] = useState<SubjectContent | null>(null);
  
  // Assignment states
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video modal states
  const [activeVideoLesson, setActiveVideoLesson] = useState<LessonContent | null>(null);
  // Notes modal states
  const [activeNotesLesson, setActiveNotesLesson] = useState<LessonContent | null>(null);

  const loadData = async () => {
    const coursesRes = await api.getCourses();
    if (coursesRes.success && coursesRes.data) {
      setCourses(coursesRes.data);
    }

    const assignmentsRes = await api.getAssignments();
    if (assignmentsRes.success && assignmentsRes.data) {
      setAssignments(assignmentsRes.data);
    }

    // Refresh enrollments from local DB
    if (typeof window !== "undefined") {
      const rawDb = localStorage.getItem("noteswift_student_mock_db");
      if (rawDb) {
        try {
          const db = JSON.parse(rawDb);
          setEnrollments(db.enrollments || []);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const loadSubjectContent = async (subject: string) => {
    // Find course ID that has this subject
    const res = await api.getSubjectContent("course-math-10", subject);
    if (res.success && res.data) {
      setSubjectContent(res.data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSubjectContent(selectedSubject);
  }, [selectedSubject]);

  const handleToggleLesson = async (chapterId: string, lessonId: string) => {
    const res = await api.toggleLessonCompleted(selectedSubject, chapterId, lessonId);
    if (res.success) {
      toast({
        title: "Progress Updated",
        description: "Lesson completion status toggled.",
      });
      loadSubjectContent(selectedSubject);
      loadData(); // Recompute progress bars
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    const res = await api.submitAssignment(selectedAssignment.id, submissionText, submissionFile || "assignment_response.pdf");
    setIsSubmitting(false);

    if (res.success) {
      toast({
        title: "Assignment Submitted",
        description: "Your answers have been uploaded successfully.",
      });
      setSelectedAssignment(null);
      setSubmissionText("");
      setSubmissionFile("");
      loadData();
    }
  };

  // Subjects lists matching enrolled courses
  const enrolledSubjects = Array.from(
    new Set(
      enrollments.flatMap((enr) => {
        const courseIdStr = typeof enr.courseId === "object" ? (enr.courseId as Course).id || (enr.courseId as Course)._id : enr.courseId;
        const course = courses.find(c => c.id === courseIdStr || c._id === courseIdStr);
        return course ? course.subjects.map(s => s.name) : [];
      })
    )
  );

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="curriculum" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-300 pb-3">
          <TabsList className="bg-gray-100 p-1 rounded-xl h-11 border border-gray-350 bg-white">
            <TabsTrigger value="curriculum" className="font-bold text-xs sm:text-sm px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
              <BookOpen className="h-4 w-4 mr-2" />
              Syllabus Curriculum
            </TabsTrigger>
            <TabsTrigger value="assignments" className="font-bold text-xs sm:text-sm px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
              <ClipboardList className="h-4 w-4 mr-2" />
              Assignments & Homework
            </TabsTrigger>
          </TabsList>

          {/* Subject selector tab-pill (visible only in curriculum tab) */}
          {enrolledSubjects.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
              {enrolledSubjects.map((sub) => (
                <Badge
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`cursor-pointer rounded-full px-3 py-1 font-bold text-xs transition-colors shrink-0 ${
                    selectedSubject === sub ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {sub}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* CURRICULUM TAB */}
        <TabsContent value="curriculum" className="focus-visible:outline-none pt-4">
          {enrollments.length === 0 ? (
            <Card className="border border-gray-300 bg-white p-8 text-center rounded-2xl max-w-md mx-auto space-y-4 mt-6">
              <div className="text-gray-400">🎒</div>
              <h3 className="text-base font-extrabold text-gray-800">No Course Enrolled</h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                You must enroll in a course from the Course Explorer to view subject materials.
              </p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 px-6">
                <Link href="/courses">Explore Courses</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Chapters list (left) */}
              <div className="md:col-span-2 space-y-6">
                {subjectContent?.chapters.map((ch) => (
                  <Card key={ch.id} className="border border-gray-300 shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-gray-200 bg-gray-50/50 p-4">
                      <CardTitle className="text-sm sm:text-base font-extrabold text-gray-850 leading-snug">{ch.title}</CardTitle>
                      <CardDescription className="text-xs text-gray-500 font-semibold">{ch.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 divide-y divide-gray-150">
                      {ch.lessons.map((les) => (
                        <div key={les.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleLesson(ch.id, les.id)}
                              className="text-gray-400 hover:text-blue-600 transition-colors shrink-0"
                            >
                              {les.isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 fill-green-50/50" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                            <div className="space-y-0.5">
                              <span className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-1">{les.title}</span>
                              <span className="text-[10px] text-gray-400 font-extrabold">{les.duration}</span>
                            </div>
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            {les.videoUrl && (
                              <Button 
                                onClick={() => setActiveVideoLesson(les)}
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2 rounded-lg border-gray-300 text-gray-700 font-semibold text-xs flex items-center gap-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                              >
                                <Video className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Play</span>
                              </Button>
                            )}
                            {les.notesUrl && (
                              <Button 
                                onClick={() => setActiveNotesLesson(les)}
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2 rounded-lg border-gray-300 text-gray-700 font-semibold text-xs flex items-center gap-1 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Notes</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Progress Summary (right) */}
              <div className="space-y-6">
                <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject Analytics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                      <span>{selectedSubject} Progress</span>
                      <span>
                        {subjectContent?.chapters.reduce((sum, ch) => sum + ch.lessons.filter(l => l.isCompleted).length, 0) || 0} / {subjectContent?.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0) || 0} Lessons
                      </span>
                    </div>
                    {/* Calculate percent */}
                    {(() => {
                      const total = subjectContent?.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0) || 1;
                      const completed = subjectContent?.chapters.reduce((sum, ch) => sum + ch.lessons.filter(l => l.isCompleted).length, 0) || 0;
                      const pct = Math.round((completed / total) * 100);
                      return (
                        <div className="space-y-1.5">
                          <Progress value={pct} className="h-2 bg-gray-100 [&>div]:bg-blue-600 rounded-full" />
                          <p className="text-[10px] text-gray-500 font-semibold text-right">{pct}% Completed</p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="border-t border-gray-150 pt-4 space-y-2.5 text-xs text-gray-500 font-semibold">
                    <div className="flex justify-between">
                      <span>Total Videos</span>
                      <span className="font-extrabold text-gray-800">
                        {subjectContent?.chapters.reduce((sum, ch) => sum + ch.lessons.filter(l => l.videoUrl).length, 0)} lectures
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reference Notes</span>
                      <span className="font-extrabold text-gray-800">
                        {subjectContent?.chapters.reduce((sum, ch) => sum + ch.lessons.filter(l => l.notesUrl).length, 0)} PDF sets
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ASSIGNMENTS TAB */}
        <TabsContent value="assignments" className="focus-visible:outline-none pt-4">
          <div className="grid gap-6 md:grid-cols-3">
            {/* List of assignments (left) */}
            <div className="md:col-span-2 space-y-4">
              {assignments.map((as) => (
                <Card key={as.id} className="border border-gray-300 shadow-sm bg-white rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-full font-bold text-[8px] uppercase">{as.subject}</Badge>
                        <Badge 
                          variant={as.submissionStatus === "submitted" ? "secondary" : as.submissionStatus === "pending" ? "default" : "destructive"}
                          className={`text-[8px] font-extrabold uppercase ${
                            as.submissionStatus === "submitted" ? "bg-green-50 text-green-700" :
                            as.submissionStatus === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {as.submissionStatus}
                        </Badge>
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-gray-850 leading-snug">{as.title}</h4>
                      <p className="text-xs text-gray-500 font-semibold">{as.description}</p>
                    </div>

                    {as.score && (
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Grade Score</span>
                        <span className="text-base font-extrabold text-green-600">{as.score}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-150 mt-4 pt-3 flex justify-between items-center text-xs text-gray-500 font-semibold">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Due: {as.dueDate}</span>
                    </div>

                    {as.submissionStatus === "pending" && (
                      <Button 
                        onClick={() => setSelectedAssignment(as)}
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg h-8 text-xs px-4"
                      >
                        Submit Answer
                      </Button>
                    )}

                    {as.submissionStatus === "submitted" && (
                      <div className="flex items-center gap-1 text-green-600 font-bold">
                        <CheckSquare className="h-4 w-4" />
                        <span>Submitted</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Assignments Summary Stats (right) */}
            <div className="space-y-6">
              <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Homework Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 text-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Completed</span>
                    <span className="text-2xl font-extrabold text-green-600">
                      {assignments.filter(a => a.submissionStatus === "submitted" || a.submissionStatus === "late").length}
                    </span>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 text-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Pending</span>
                    <span className="text-2xl font-extrabold text-yellow-600">
                      {assignments.filter(a => a.submissionStatus === "pending").length}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* VIDEO PLAYER MODAL */}
      <Dialog open={!!activeVideoLesson} onOpenChange={(open) => !open && setActiveVideoLesson(null)}>
        <DialogContent className="max-w-2xl bg-white border border-gray-300 p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-4 border-b border-gray-200 bg-gray-50/50">
            <DialogTitle className="text-sm sm:text-base font-extrabold text-gray-800 flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              {activeVideoLesson?.title}
            </DialogTitle>
          </DialogHeader>

          {/* Premium Video Stub Player */}
          <div className="relative aspect-video bg-black flex items-center justify-center text-white">
            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/assets/video_thumb.jpg')" }}></div>
            <div className="z-10 flex flex-col items-center space-y-3 p-6 text-center">
              <div className="h-16 w-16 bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer">
                <Play className="h-8 w-8 fill-white ml-1" />
              </div>
              <p className="text-sm font-bold max-w-sm">Playing Lesson (Nepal CDN Optimized Feed)</p>
              <p className="text-xs text-gray-400">Local Cache Active • Size: 48.5 MB • Duration: {activeVideoLesson?.duration}</p>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50/50">
            <Button 
              variant="outline" 
              onClick={() => setActiveVideoLesson(null)}
              className="border-gray-300 rounded-xl font-bold text-xs"
            >
              Close Lecture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOTES READER MODAL */}
      <Dialog open={!!activeNotesLesson} onOpenChange={(open) => !open && setActiveNotesLesson(null)}>
        <DialogContent className="max-w-md bg-white border border-gray-300 p-6 rounded-2xl space-y-5">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Course Reference Notes
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-semibold leading-relaxed">
              Read notes for <span className="font-extrabold text-gray-700">{activeNotesLesson?.title}</span>.
            </DialogDescription>
          </DialogHeader>

          {/* Notes summary preview card */}
          <div className="p-4 border border-indigo-100 rounded-xl bg-indigo-50/50 space-y-3">
            <div className="flex gap-3 items-center">
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-indigo-600 font-bold block uppercase">Document Download Ready</span>
                <span className="text-xs font-bold text-gray-800">Trig_Concepts_Ch2.pdf (1.8 MB)</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-semibold">
              Contains formula summaries, 12 solved example proofs, and a set of 5 challenge questions with step-by-step solutions.
            </p>
          </div>

          <div className="flex gap-2.5">
            <Button 
              asChild 
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 text-xs flex items-center justify-center gap-1.5"
            >
              <a href={activeNotesLesson?.notesUrl} download>
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setActiveNotesLesson(null)}
              className="border-gray-300 rounded-xl font-bold text-xs"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUBMISSION DIALOG */}
      <Dialog open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
        <DialogContent className="max-w-md bg-white border border-gray-300 p-6 rounded-2xl space-y-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-extrabold text-gray-800">Submit Assignment</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-semibold leading-relaxed">
              Upload your response for: <span className="font-bold text-gray-700">{selectedAssignment?.title}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignmentSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="answer" className="text-xs font-bold text-gray-600">Text Response (Optional)</Label>
              <Textarea
                id="answer"
                placeholder="Type your response or answers here..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={4}
                className="border-gray-250 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="file" className="text-xs font-bold text-gray-600">Attachment File (e.g. PDF/Image)</Label>
              <div className="border-2 border-dashed border-gray-250 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer transition-colors relative">
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-gray-700 block">Drag & Drop or Click to Upload</span>
                <span className="text-[10px] text-gray-500 block mt-1">Accepts PDF, JPG, PNG up to 10MB</span>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSubmissionFile(e.target.files?.[0]?.name || "")}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              {submissionFile && (
                <p className="text-xs text-green-600 font-bold mt-1">Selected File: {submissionFile}</p>
              )}
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 text-xs"
              >
                {isSubmitting ? "Submitting..." : "Submit Homework"}
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setSelectedAssignment(null)}
                className="border-gray-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LearningFeedPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <LearningFeedContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
