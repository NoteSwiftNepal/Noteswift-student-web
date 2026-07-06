"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Award, 
  ArrowUpRight, 
  Video, 
  CalendarDays, 
  GraduationCap, 
  Flame, 
  ClipboardCheck, 
  MessageSquare,
  HelpCircle,
  PlayCircle,
  Layers,
  Bookmark,
  FileText,
  Settings,
  Headphones,
  Download,
  Star
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { useStudentAuth } from "@/context/student-auth-context";
import { api } from "@/services/api";
import { Course, CourseEnrollment, Assignment, MockTest, DoubtQuestion, TimetableClass } from "@/data/mockData";

function DashboardContent() {
  const { student } = useStudentAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [doubts, setDoubts] = useState<DoubtQuestion[]>([]);
  const [timetable, setTimetable] = useState<TimetableClass[]>([]);
  const [stats, setStats] = useState({ attendance: null as number | null, studyHours: null as number | null, assignmentsDue: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        // Load all data in parallel for fast dynamic updates
        const [dashboardRes, coursesRes, assignmentsRes, doubtsRes, testsRes] = await Promise.all([
          api.getDashboard(),
          api.getCourses(),
          api.getAssignments(),
          api.getDoubts(),
          api.getTests(),
        ]);

        if (dashboardRes.success && dashboardRes.data) {
          const d = dashboardRes.data;
          setTimetable(d.timetable || d.liveClassesToday || []);
          if (d.stats) {
            setStats({
            attendance: d.stats.attendance ?? d.stats.overallProgress ?? null,
            studyHours: d.stats.studyHours ?? d.stats.weeklyStudyHours ?? null,
            assignmentsDue: d.stats.assignmentsDue ?? d.stats.testsAvailable ?? 0,
          });
          }
        }

        if (coursesRes.success && coursesRes.data) {
          setCourses(coursesRes.data);
        }

        if (assignmentsRes.success && assignmentsRes.data) {
          setAssignments(assignmentsRes.data);
        }

        if (doubtsRes.success && doubtsRes.data) {
          setDoubts(doubtsRes.data);
        }

        if (testsRes.success && testsRes.data) {
          setTests(testsRes.data);
        }

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
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading || !student) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-36 bg-gray-200 rounded-3xl w-full"></div>
        {/* Quick Access Skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded-md w-32"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl border border-gray-250 flex flex-col items-center justify-center gap-2 p-4">
                <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
        {/* Stats Row Skeleton */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl p-4 space-y-3 border border-gray-250">
              <div className="flex justify-between items-center">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-7 w-7 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="h-6 bg-gray-300 rounded w-12"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
        {/* Main Content Layout Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-44 bg-gray-100 rounded-3xl border border-gray-250"></div>
            <div className="h-44 bg-gray-100 rounded-3xl border border-gray-250"></div>
          </div>
          <div className="space-y-6">
            <div className="h-60 bg-gray-100 rounded-3xl border border-gray-250"></div>
            <div className="h-60 bg-gray-100 rounded-3xl border border-gray-250"></div>
          </div>
        </div>
      </div>
    );
  }

  // Compute stats helper — defensive guards against non-array state
  const pendingAssignments = Array.isArray(assignments) ? assignments.filter(a => a.submissionStatus === "pending") : [];
  const uncompletedTests = Array.isArray(tests) ? tests.filter(t => t.type === "mcq") : [];
  const ongoingClass = Array.isArray(timetable) ? timetable.find(c => c.status === "ongoing") : undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl -mb-8"></div>
        
        <div className="relative z-10 space-y-3">
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
            Student Overview
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Namaste, {student.fullName || student.phoneNumber || "Student"}!
          </h2>
          <p className="text-blue-100 text-xs md:text-sm max-w-xl font-medium">
            Keep up your <span className="font-extrabold text-white underline decoration-yellow-400 decoration-2 underline-offset-4">{student.streakCount}-day study streak!</span> Consistency beats intensity. Ready for today's classes?
          </p>
        </div>
      </div>

      {/* Ongoing Live Class Modular Card */}
      {ongoingClass && (
        <div className="bg-white border border-red-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute right-0 top-0 w-48 h-48 bg-red-500/5 rounded-full blur-2xl -mr-12 -mt-12"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-red-50 text-red-650 flex items-center justify-center rounded-2xl shrink-0 border border-red-100 shadow-xs relative">
                <span className="h-2.5 w-2.5 bg-red-600 rounded-full animate-ping absolute -top-1 -right-1"></span>
                <span className="h-2 w-2 bg-red-600 rounded-full absolute -top-0.5 -right-0.5"></span>
                <Video className="h-6 w-6 text-red-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
                    Live Broadcast Active
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Classroom Join Portal</span>
                </div>
                <h3 className="text-base font-extrabold text-gray-800 tracking-tight leading-tight">
                  {ongoingClass.subject} Session is streaming live
                </h3>
                <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                  <span>Instructor: <span className="font-extrabold text-gray-750">{ongoingClass.teacherName}</span></span>
                  <span className="h-1 w-1 bg-gray-200 rounded-full"></span>
                  <span>148 classmates connected</span>
                </p>
              </div>
            </div>
            
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl px-6 h-10 w-full md:w-auto shadow-sm transition-all hover:scale-[1.01]">
              <Link href={`/live-class?subject=${encodeURIComponent(ongoingClass.subject)}&teacher=${encodeURIComponent(ongoingClass.teacherName)}`}>
                Join Live Session
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Quick Access Portal */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Quick Access Portal</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "My Batches", href: "/courses", icon: Layers, bg: "bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100/50" },
            { label: "My History", href: "/history", icon: Clock, bg: "bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100/50" },
            { label: "My Doubts", href: "/ask", icon: MessageSquare, bg: "bg-orange-50 border-orange-100 text-orange-700 hover:bg-orange-100/50" },
            { label: "PDF Bank", href: "/downloads", icon: FileText, bg: "bg-green-50 border-green-100 text-green-700 hover:bg-green-100/50" },
            { label: "App Settings", href: "/settings", icon: Settings, bg: "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100/50" },
            { label: "Downloads", href: "/downloads", icon: Download, bg: "bg-teal-50 border-teal-100 text-teal-700 hover:bg-teal-100/50" },
            { label: "Help Desk", href: "/support", icon: Headphones, bg: "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100/50" },
            { label: "Bookmarks", href: "/bookmarks", icon: Bookmark, bg: "bg-pink-50 border-pink-100 text-pink-700 hover:bg-pink-100/50" }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center p-4 border rounded-2xl transition-all shadow-sm group hover:scale-[1.02] cursor-pointer text-center space-y-2 ${item.bg}`}
              >
                <div className="p-2.5 rounded-xl bg-white/80 shadow-xs group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {/* Study Streak */}
        <Card className="hover:shadow-md transition-shadow border-gray-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Day Streak</CardTitle>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-650">
              <Flame className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-gray-900">
              {student.streakCount}
            </div>
            <p className="text-xs text-gray-500 font-semibold">Consecutive study days</p>
          </CardContent>
        </Card>

        {/* Points */}
        <Card className="hover:shadow-md transition-shadow border-gray-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Points</CardTitle>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Star className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-gray-900">
              0 <span className="text-xs font-bold text-gray-500">XP</span>
            </div>
            <p className="text-xs text-gray-500 font-semibold">Total learning points</p>
          </CardContent>
        </Card>

        {/* Rank */}
        <Card className="hover:shadow-md transition-shadow border-gray-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</CardTitle>
            <div className="p-2 rounded-xl bg-yellow-50 text-yellow-600">
              <Award className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-gray-900">
              NA
            </div>
            <p className="text-xs text-gray-500 font-semibold">Leaderboard rank</p>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="hover:shadow-md transition-shadow border-gray-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance</CardTitle>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-gray-900">
              {student.attendancePercent != null ? `${student.attendancePercent}%` : "N/A"}
            </div>
            <p className="text-xs text-gray-500 font-semibold">Class presence rate</p>
          </CardContent>
        </Card>

        {/* Weekly Study Time */}
        <Card className="hover:shadow-md transition-shadow border-gray-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Study Hours</CardTitle>
            <div className="p-2 rounded-xl bg-green-50 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-gray-900">
              {student.weeklyStudyHours != null ? `${student.weeklyStudyHours} hrs` : "N/A"}
            </div>
            <p className="text-xs text-gray-500 font-semibold">Active this week</p>
          </CardContent>
        </Card>

        {/* Pending Homework */}
        <Card className="hover:shadow-md transition-shadow border-gray-300 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</CardTitle>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-3xl font-extrabold text-gray-900">
              {pendingAssignments.length}
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={pendingAssignments.length === 0 ? "secondary" : "destructive"} className="text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingAssignments.length === 0 ? "All caught up" : "Homework"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Learning Progress & Timetable */}
        <div className="md:col-span-2 space-y-6">
          {/* Continue Learning Course List */}
          <Card className="border-gray-300 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-300 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-indigo-500" />
                  Continue Learning
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-500 font-semibold">Quick access to your enrolled coursework.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-blue-600 font-bold hover:underline">
                <Link href="/courses">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {enrollments.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-gray-400 text-xs font-bold">You aren't enrolled in any courses yet.</p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold h-9">
                    <Link href="/courses">Browse Course Explorer</Link>
                  </Button>
                </div>
              ) : (
                enrollments.map((enr) => {
                  const courseIdStr = typeof enr.courseId === "object" ? (enr.courseId as Course).id || (enr.courseId as Course)._id : enr.courseId;
                  const course = courses.find(c => c.id === courseIdStr || c._id === courseIdStr);
                  if (!course) return null;

                  return (
                    <div key={enr.id} className="p-4 border border-gray-250 rounded-2xl space-y-3.5 hover:shadow-sm transition-all bg-gradient-to-b from-gray-50/30 to-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-full font-bold text-[9px] mb-1.5 uppercase">
                            {course.subjects[0]?.name || "Course"}
                          </Badge>
                          <h4 className="text-sm font-extrabold text-gray-800 leading-tight">
                            {course.title}
                          </h4>
                        </div>
                        <Button asChild size="icon" variant="outline" className="h-9 w-9 rounded-xl border-gray-300 shrink-0">
                          <Link href={`/learn`}>
                            <PlayCircle className="h-5 w-5 text-blue-600" />
                          </Link>
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                          <span>Syllabus Completion</span>
                          <span>{enr.progress}%</span>
                        </div>
                        <Progress value={enr.progress} className="h-2 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-600 rounded-full" />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Today's Timetable */}
          <Card className="border-gray-300 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-300 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                Today's Timetable
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500 font-semibold">Your class schedule for today.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3.5">
                {timetable.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3.5 border border-gray-250 rounded-2xl bg-white hover:bg-gray-50/50 transition-colors">
                    <div className="flex gap-4 items-center">
                      <div className="h-10 w-10 bg-indigo-50 text-indigo-700 flex items-center justify-center rounded-xl shrink-0">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-extrabold text-gray-800 leading-snug">{cls.subject}</h4>
                        <p className="text-xs font-semibold text-gray-500">{cls.time} • {cls.room}</p>
                        <p className="text-[10px] font-bold text-gray-400">Teacher: {cls.teacherName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cls.status === "ongoing" && (
                        <Button asChild size="sm" className="h-7 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-[10px] px-2.5">
                          <Link href={`/live-class?subject=${encodeURIComponent(cls.subject)}&teacher=${encodeURIComponent(cls.teacherName)}`}>
                            Join
                          </Link>
                        </Button>
                      )}
                      <Badge 
                        variant={cls.status === "completed" ? "secondary" : cls.status === "ongoing" ? "default" : "outline"} 
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                          cls.status === "completed" ? "bg-green-50 text-green-700 hover:bg-green-50" : 
                          cls.status === "ongoing" ? "bg-blue-600 text-white animate-pulse" : "text-gray-500"
                        }`}
                      >
                        {cls.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tests & Doubts */}
        <div className="space-y-6">
          {/* Upcoming Tests & Quizzes */}
          <Card className="border-gray-300 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-300 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Active Mock Exams
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500 font-semibold">Test your knowledge and benchmark scores.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {uncompletedTests.length === 0 ? (
                <p className="text-center py-4 text-gray-400 text-xs font-semibold">No quizzes scheduled currently.</p>
              ) : (
                uncompletedTests.map((t) => (
                  <div key={t.id} className="p-4 border border-gray-250 rounded-2xl bg-white space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Badge className="bg-yellow-50 text-yellow-700 font-extrabold text-[8px] uppercase">{t.subject}</Badge>
                        <span className="text-[10px] text-gray-500 font-extrabold">{t.durationMinutes} mins</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-gray-850 leading-snug">{t.title}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold">{t.totalMarks} Marks • Class Avg: {t.classAverage}%</p>
                    </div>
                    <Button asChild size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold h-9">
                      <Link href={`/test`}>Start Assessment</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Doubts Asked */}
          <Card className="border-gray-300 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-300 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-indigo-500" />
                  Your Active Doubts
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-500 font-semibold">Questions you asked in the community.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-blue-600 font-bold hover:underline">
                <Link href="/ask">Ask</Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {doubts.length === 0 ? (
                <p className="text-center py-4 text-gray-400 text-xs font-semibold">No active doubts posted.</p>
              ) : (
                doubts.slice(0, 2).map((d) => (
                  <div key={d.id} className="p-3.5 border border-gray-250 rounded-2xl bg-white space-y-2">
                    <div className="flex justify-between items-center">
                      <Badge className="bg-gray-100 text-gray-600 font-bold text-[8px] uppercase">{d.subject}</Badge>
                      <Badge 
                        variant={d.status === "resolved" ? "secondary" : "outline"} 
                        className={`text-[8px] font-extrabold uppercase ${d.status === "resolved" ? "bg-green-50 text-green-700" : "text-yellow-700 bg-yellow-50"}`}
                      >
                        {d.status}
                      </Badge>
                    </div>
                    <h4 className="text-xs font-bold text-gray-800 line-clamp-1 leading-snug">{d.title}</h4>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold pt-1">
                      <span>{d.answers.length} answers</span>
                      <span className="font-bold flex items-center gap-0.5 text-blue-600 hover:underline cursor-pointer">
                        <Link href="/ask" className="flex items-center">
                          View details
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <DashboardContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
