"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, 
  BookOpen, 
  Star, 
  Tag, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Bookmark,
  Layers,
  KeyRound,
  Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { api } from "@/services/api";
import { Course, CourseEnrollment, TrialEnrollment } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

function CourseExplorerContent() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [trials, setTrials] = useState<TrialEnrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  
  // Sheet open state
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  // Checkout and Redeem code states
  const [checkoutCourseId, setCheckoutCourseId] = useState<string | null>(null);
  const [unlockCode, setUnlockCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const loadCoursesData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, enrollRes] = await Promise.all([
        api.getCourses(),
        api.getMyEnrollments(),
      ]);
      if (coursesRes.success && coursesRes.data) setCourses(coursesRes.data);
      if (enrollRes.success && enrollRes.data) setEnrollments(enrollRes.data);
      // Trials: still from localStorage for mock mode; real endpoint TBD
      if (typeof window !== "undefined") {
        const rawDb = localStorage.getItem("noteswift_student_mock_db");
        if (rawDb) {
          try { setTrials(JSON.parse(rawDb).trials || []); } catch {}
        }
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoursesData();
  }, []);

  const handleEnrollFree = async (courseId: string) => {
    const res = await api.enrollInCourse(courseId);
    if (res.success) {
      toast({
        title: "Enrollment Complete",
        description: "You have successfully enrolled in this course.",
      });
      loadCoursesData();
    }
  };

  const handleStartTrial = async (courseId: string) => {
    const res = await api.startTrial(courseId);
    if (res.success) {
      toast({
        title: "Trial Started",
        description: "Your 7-day free trial is now active.",
      });
      loadCoursesData();
    }
  };

  const handleConvertTrial = async (courseId: string) => {
    const res = await api.convertTrialToEnrollment(courseId);
    if (res.success) {
      toast({
        title: "Course Unlocked",
        description: "Free trial upgraded to active enrollment.",
      });
      loadCoursesData();
    }
  };

  const handleRedeemCode = async () => {
    if (!checkoutCourseId) return;
    if (!unlockCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter an unlock code to enroll.",
        variant: "destructive"
      });
      return;
    }
    setIsRedeeming(true);
    const res = await api.redeemUnlockCode(unlockCode.trim(), checkoutCourseId);
    setIsRedeeming(false);
    if (res.success) {
      toast({
        title: "Enrollment Complete",
        description: "Your unlock code was verified and you have successfully enrolled!",
      });
      setUnlockCode("");
      setCheckoutCourseId(null);
      loadCoursesData();
    } else {
      toast({
        title: "Verification Failed",
        description: res.message || "Invalid or expired unlock code.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {/* Search and filter bar skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 border border-gray-250 rounded-2xl shadow-sm h-16 w-full">
          <div className="h-9 bg-gray-200 rounded-xl w-48"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
          </div>
        </div>

        {/* Course Card Grid skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-gray-250 shadow-sm bg-white rounded-2xl overflow-hidden h-[360px] flex flex-col justify-between p-5 space-y-4">
              <div className="h-32 bg-gray-250 rounded-xl w-full"></div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-250 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-8 bg-gray-200 rounded-xl w-24"></div>
                <div className="h-8 bg-gray-200 rounded-xl w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter courses
  const filteredCourses = (activeTab === "my"
    ? courses.filter((c) => {
        const enrolled = enrollments.some((e) => {
          const eCourseId = typeof e.courseId === "object" ? e.courseId.id || e.courseId._id : e.courseId;
          return eCourseId === c.id || eCourseId === c._id;
        });
        const trialing = trials.some((t) => {
          const tCourseId = typeof t.courseId === "object" ? t.courseId.id || t.courseId._id : t.courseId;
          return tCourseId === c.id || tCourseId === c._id;
        });
        return enrolled || trialing;
      })
    : courses
  ).filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? c.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  // Extract all unique tags
  const allTags = Array.from(new Set(courses.flatMap((c) => c.tags)));

  const activeCourse = courses.find(c => c.id === activeCourseId || c._id === activeCourseId);
  
  return (
    <div className="flex flex-col gap-6">
      {/* ─── Tabs ─── */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeTab === "all"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Courses
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeTab === "my"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          My Courses
          {enrollments.length + trials.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-black leading-none">
              {enrollments.length + trials.length}
            </span>
          )}
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 border border-gray-300 rounded-2xl shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 border-gray-250 rounded-xl focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
          <Badge 
            onClick={() => setSelectedTag(null)}
            className={`cursor-pointer rounded-full px-3 py-1 font-bold text-xs transition-colors ${
              !selectedTag ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            All Subjects
          </Badge>
          {allTags.map((tag) => (
            <Badge 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`cursor-pointer rounded-full px-3 py-1 font-bold text-xs transition-colors ${
                selectedTag === tag ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Courses grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-gray-700 text-sm">
              {activeTab === "my" ? "No enrolled courses yet" : "No courses found"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {activeTab === "my"
                ? "Go to All Courses tab to browse and enroll."
                : "Try adjusting your search or tag filters."}
            </p>
          </div>
          {activeTab === "my" && (
            <button
              onClick={() => setActiveTab("all")}
              className="mt-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold shadow-sm hover:shadow-md transition-shadow"
            >
              Browse All Courses
            </button>
          )}
        </div>
      ) : (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((c) => {
          const isEnrolled = enrollments.some(e => {
            const eCourseId = typeof e.courseId === "object" ? e.courseId.id || e.courseId._id : e.courseId;
            return eCourseId === c.id || eCourseId === c._id;
          });

          const hasTrial = trials.some(t => {
            const tCourseId = typeof t.courseId === "object" ? t.courseId.id || t.courseId._id : t.courseId;
            return tCourseId === c.id || tCourseId === c._id;
          });

          return (
            <Card key={c.id || c._id} className="border border-gray-250 shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                {/* Course Header Banner */}
                <div 
                  className="h-32 relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
                  style={c.gradient && c.gradient.includes("gradient") ? { background: c.gradient } : undefined}
                >
                  {c.thumbnail ? (
                    <img 
                      src={c.thumbnail} 
                      alt={c.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white/90">
                      <BookOpen className="h-10 w-10 stroke-[1.5]" />
                    </div>
                  )}
                  {c.type === "featured" && (
                    <Badge className="absolute top-3 right-3 bg-yellow-400 text-yellow-950 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase border-0 flex items-center gap-1 shadow-sm z-10">
                      <Sparkles className="h-2.5 w-2.5" />
                      Featured
                    </Badge>
                  )}
                </div>

                <CardContent className="p-5 space-y-3.5">
                  {/* Category & Program Row */}
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <span>{c.offeredBy || "Note Swift"}</span>
                    <Badge className="bg-blue-50 text-blue-700 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full border-0">
                      {c.program}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-extrabold text-gray-800 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {c.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-2 border-t border-gray-150">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-gray-700">{c.rating}</span>
                      <span>({c.enrolledCount} enrolled)</span>
                    </div>
                    <span className="font-extrabold text-blue-600">
                      {c.price === 0 ? "FREE" : `Rs. ${c.price}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((tag) => (
                      <Badge key={tag} className="bg-gray-100 hover:bg-gray-100 text-gray-600 font-bold text-[9px] px-2 rounded">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </div>

              <CardFooter className="p-5 pt-0 flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveCourseId(c.id || c._id)}
                      className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl h-10"
                    >
                      Syllabus Details
                    </Button>
                  </SheetTrigger>
                  
                  {activeCourse && (
                    <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white border-l border-gray-300 p-6 space-y-6">
                      <SheetHeader className="space-y-2">
                        <Badge className="bg-blue-50 text-blue-700 font-bold text-[10px] w-fit uppercase">
                          {activeCourse.program} Syllabus
                        </Badge>
                        <SheetTitle className="text-lg font-extrabold text-gray-800 leading-snug">{activeCourse.title}</SheetTitle>
                        <SheetDescription className="text-xs text-gray-500 font-semibold leading-relaxed">
                          Syllabus checklist and FAQ outline.
                        </SheetDescription>
                      </SheetHeader>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Course Overview</h4>
                          <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-medium">{activeCourse.courseOverview}</p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Key Highlights</h4>
                          <ul className="space-y-1.5 text-xs sm:text-sm text-gray-650 font-medium">
                            {activeCourse.keyFeatures.map((feat, idx) => (
                              <li key={idx} className="flex gap-2 items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Syllabus Curriculum</h4>
                          <div className="space-y-2">
                            {activeCourse.syllabus.map((syll) => (
                              <div key={syll.moduleNumber} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                                <h5 className="text-xs sm:text-sm font-extrabold text-gray-800">
                                  Module {syll.moduleNumber}: {syll.title}
                                </h5>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">{syll.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Course FAQs</h4>
                          <Accordion type="single" collapsible className="w-full">
                            {activeCourse.faq.map((fq, idx) => (
                              <AccordionItem key={idx} value={`item-${idx}`} className="border-gray-250">
                                <AccordionTrigger className="text-xs font-bold text-gray-700 hover:no-underline text-left">
                                  {fq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-xs text-gray-500 leading-relaxed font-semibold">
                                  {fq.answer}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      </div>
                    </SheetContent>
                  )}
                </Sheet>

                {isEnrolled ? (
                  <Button asChild className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl h-10 border border-green-700 flex items-center justify-center gap-1.5">
                    <Link href={`/learn`}>
                      <BookOpen className="h-4 w-4" />
                      Learn Feed
                    </Link>
                  </Button>
                ) : hasTrial ? (
                  <div className="flex gap-2 w-full flex-1">
                    <Button asChild variant="outline" className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl h-10 flex items-center justify-center gap-1">
                      <Link href="/learn">
                        Continue Trial
                      </Link>
                    </Button>
                    <Button 
                      onClick={() => setCheckoutCourseId(c.id || c._id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 border border-blue-700"
                    >
                      Upgrade Trial
                    </Button>
                  </div>
                ) : c.price === 0 ? (
                  <Button 
                    onClick={() => handleEnrollFree(c.id || c._id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 border border-blue-700"
                  >
                    Enroll Free
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full flex-1">
                    <Button 
                      onClick={() => handleStartTrial(c.id || c._id)}
                      variant="outline"
                      className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl h-10"
                    >
                      Free Trial
                    </Button>
                    <Button 
                      onClick={() => setCheckoutCourseId(c.id || c._id)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl h-10 shadow-sm border border-indigo-700"
                    >
                      Enroll Now
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
      )}

      {/* Checkout/Unlock Dialog */}
      <Dialog open={!!checkoutCourseId} onOpenChange={(open) => { if (!open) { setCheckoutCourseId(null); setUnlockCode(""); } }}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-300 rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Checkout
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-semibold leading-relaxed">
              Enter your one-time unlock code to active premium access.
            </DialogDescription>
          </DialogHeader>

          {checkoutCourseId && (
            (() => {
              const course = courses.find(c => c.id === checkoutCourseId || c._id === checkoutCourseId);
              if (!course) return null;
              return (
                <div className="space-y-4 py-2">
                  {/* Course Details Summary Card */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider">{course.program}</span>
                      <h4 className="text-sm font-extrabold text-gray-800 leading-snug">{course.title}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">Offered by {course.offeredBy}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-gray-800 block">Rs. {course.price?.toLocaleString()}</span>
                      <span className="text-[9px] text-gray-500 font-bold block">One-time Payment</span>
                    </div>
                  </div>

                  {/* Payment Method Option */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Payment Method</span>
                    <div className="flex items-center gap-3 p-3.5 border-2 border-blue-500 bg-blue-50/50 rounded-xl">
                      <KeyRound className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-blue-900 block">Enter Unlock Code</span>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-blue-600 fill-blue-50/50 shrink-0" />
                    </div>
                  </div>

                  {/* Code Input */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Unlock Code</span>
                    <Input
                      placeholder="e.g. IEA-21JA-WA"
                      value={unlockCode}
                      onChange={(e) => setUnlockCode(e.target.value.toUpperCase())}
                      className="h-11 border-gray-300 rounded-xl text-sm font-mono tracking-wider focus-visible:ring-blue-500 uppercase bg-white"
                    />
                    <a
                      href={`https://wa.me/9779767464242?text=Hello!%20I'm%2520interested%2520in%2520getting%2520an%252520unlock%252520code%252520for%252520the%25252520"${encodeURIComponent(course.title)}"%25252520course%25252520on%25252520NoteSwift.%2525252520Can%2525252520you%2525252520help%2525252520me%2525252520with%2525252520that?`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-[11px] font-bold text-center block pt-1"
                    >
                      Don't have a code? Click here to WhatsApp us
                    </a>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2.5 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => { setCheckoutCourseId(null); setUnlockCode(""); }}
                      className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl h-11"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRedeemCode}
                      disabled={isRedeeming}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-11 border border-blue-700 flex items-center justify-center gap-1.5"
                    >
                      {isRedeeming ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify & Enroll
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })()
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CourseExplorerPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <CourseExplorerContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
