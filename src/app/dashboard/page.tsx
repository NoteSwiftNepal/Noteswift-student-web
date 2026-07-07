"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Award,
  Video,
  CalendarDays,
  TrendingUp,
  MessageSquare,
  PlayCircle,
  FileText,
  Bookmark,
  Download,
  Headphones,
  Star,
  ArrowRight,
  ClipboardList,
  ChevronRight,
  GraduationCap,
  Layers,
  Settings,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { useStudentAuth } from "@/context/student-auth-context";
import { api } from "@/services/api";
import { Course, CourseEnrollment, Assignment, MockTest, DoubtQuestion, TimetableClass } from "@/data/mockData";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionHeader({ title, href, label = "View All" }: { title: string; href?: string; label?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-extrabold text-gray-800">{title}</h3>
      {href && (
        <Link href={href} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-0.5">
          {label} <ChevronRight size={13} />
        </Link>
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px] animate-pulse">
      {/* Left column */}
      <div className="space-y-5">
        <div className="h-28 bg-gray-200 rounded-2xl w-full" />
        <div className="h-48 bg-gray-100 rounded-2xl border border-gray-200" />
        <div className="h-48 bg-gray-100 rounded-2xl border border-gray-200" />
        <div className="h-32 bg-gray-100 rounded-2xl border border-gray-200" />
      </div>
      {/* Right column */}
      <div className="space-y-4">
        <div className="h-36 bg-gray-100 rounded-2xl border border-gray-200" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-gray-100 rounded-xl border border-gray-200" />
          <div className="h-20 bg-gray-100 rounded-xl border border-gray-200" />
        </div>
        <div className="h-36 bg-gray-100 rounded-2xl border border-gray-200" />
        <div className="h-36 bg-gray-100 rounded-2xl border border-gray-200" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function DashboardContent() {
  const { student } = useStudentAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [doubts, setDoubts] = useState<DoubtQuestion[]>([]);
  const [timetable, setTimetable] = useState<TimetableClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [dashRes, coursesRes, assignRes, doubtsRes, testsRes, enrollRes] = await Promise.all([
          api.getDashboard(),
          api.getCourses(),
          api.getAssignments(),
          api.getDoubts(),
          api.getTests(),
          api.getMyEnrollments(),
        ]);

        if (dashRes.success && dashRes.data) {
          setTimetable(dashRes.data.timetable || dashRes.data.liveClassesToday || []);
        }
        if (coursesRes.success && coursesRes.data) setCourses(coursesRes.data);
        if (assignRes.success && assignRes.data) setAssignments(assignRes.data);
        if (doubtsRes.success && doubtsRes.data) setDoubts(doubtsRes.data);
        if (testsRes.success && testsRes.data) setTests(testsRes.data);
        if (enrollRes.success && enrollRes.data) setEnrollments(enrollRes.data);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading || !student) return <DashboardSkeleton />;

  const pendingAssignments = Array.isArray(assignments) ? assignments.filter((a) => a.submissionStatus === "pending") : [];
  const upcomingTests = Array.isArray(tests) ? tests.filter((t) => t.type === "mcq") : [];
  const ongoingClass = Array.isArray(timetable) ? timetable.find((c) => c.status === "ongoing") : undefined;
  const todayClasses = Array.isArray(timetable) ? timetable : [];

  // Greeting time
  const hour = new Date().getHours();
  const timeLabel = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  // Quick access items
  const quickLinks = [
    { label: "My Courses", href: "/courses", icon: Layers, color: "bg-indigo-50 text-indigo-600" },
    { label: "Live Class", href: "/live-class", icon: Video, color: "bg-red-50 text-red-600" },
    { label: "Tests", href: "/test", icon: ClipboardList, color: "bg-yellow-50 text-yellow-600" },
    { label: "Ask Doubt", href: "/ask", icon: MessageSquare, color: "bg-orange-50 text-orange-600" },
    { label: "Bookmarks", href: "/bookmarks", icon: Bookmark, color: "bg-pink-50 text-pink-600" },
    { label: "Downloads", href: "/downloads", icon: Download, color: "bg-teal-50 text-teal-600" },
    { label: "PDF Bank", href: "/downloads", icon: FileText, color: "bg-green-50 text-green-600" },
    { label: "Support", href: "/support", icon: Headphones, color: "bg-blue-50 text-blue-600" },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">

      {/* ─── LEFT COLUMN ─── */}
      <div className="space-y-5 min-w-0">

        {/* Greeting Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl px-6 py-5 relative overflow-hidden shadow-md">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
          <p className="text-blue-200 text-xs font-semibold mb-1 uppercase tracking-widest">{timeLabel} Overview</p>
          <h2 className="text-lg font-black tracking-tight mb-1">
            {student.fullName || student.phoneNumber || "Student"}
          </h2>
          <p className="text-blue-100 text-xs font-medium">
            {student.grade ? student.grade : ""}{student.grade && student.stream ? " · " : ""}{student.stream || ""}
          </p>
          {/* Mini stat pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
              <Clock size={11} />
              {pendingAssignments.length} Pending Tasks
            </span>
            <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
              <ClipboardList size={11} />
              {upcomingTests.length} Active Tests
            </span>
            <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
              <BookOpen size={11} />
              {enrollments.length} Enrolled Courses
            </span>
          </div>
        </div>

        {/* Ongoing Live Class Banner */}
        {ongoingClass && (
          <div className="flex items-center justify-between gap-4 bg-white border border-red-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-red-50 shrink-0">
                <span className="absolute h-2.5 w-2.5 rounded-full bg-red-500 animate-ping top-1.5 right-1.5" />
                <span className="absolute h-2 w-2 rounded-full bg-red-500 top-2 right-2" />
                <Video size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-red-600 tracking-wider">Live Now</p>
                <p className="text-sm font-extrabold text-gray-800">{ongoingClass.subject}</p>
                <p className="text-[11px] text-gray-500 font-semibold">by {ongoingClass.teacherName}</p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shrink-0">
              <Link href={`/live-class`}>Join Now</Link>
            </Button>
          </div>
        )}

        {/* Quick Access */}
        <div>
          <SectionHeader title="Quick Access" />
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-2xl hover:shadow-sm hover:border-blue-200 transition-all group"
              >
                <div className={cn("p-2 rounded-xl", item.color, "group-hover:scale-110 transition-transform")}>
                  <item.icon size={16} />
                </div>
                <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Continue Learning */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <SectionHeader title="Continue Learning" href="/courses" />
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <GraduationCap size={22} className="text-blue-400" />
              </div>
              <p className="text-xs text-gray-500 font-semibold">Not currently enrolled in any courses.</p>
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {enrollments.map((enr) => {
                const courseIdStr = typeof enr.courseId === "object"
                  ? (enr.courseId as Course).id || (enr.courseId as Course)._id
                  : enr.courseId;
                const course = courses.find((c) => c.id === courseIdStr || c._id === courseIdStr);
                if (!course) return null;
                return (
                  <Link
                    key={enr.id}
                    href="/learn"
                    className="flex-shrink-0 w-56 p-4 border border-gray-200 rounded-xl hover:shadow-sm hover:border-blue-200 transition-all bg-gradient-to-b from-white to-gray-50/30 group space-y-3"
                  >
                    {course.thumbnail ? (
                      <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 border border-gray-150">
                        <img 
                          src={course.thumbnail} 
                          alt={course.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div 
                        className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-white ${course.gradient && !course.gradient.includes("gradient") ? course.gradient : "bg-gradient-to-br from-blue-500 to-indigo-600"}`}
                        style={course.gradient && course.gradient.includes("gradient") ? { background: course.gradient } : undefined}
                      >
                        <BookOpen size={16} />
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-blue-600 font-bold uppercase">{course.program}</p>
                      <h4 className="text-xs font-extrabold text-gray-800 line-clamp-2 leading-snug mt-0.5">{course.title}</h4>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400">
                        <span>Progress</span>
                        <span>{enr.progress}%</span>
                      </div>
                      <Progress value={enr.progress} className="h-1.5 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-600 rounded-full" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <SectionHeader title="Today's Schedule" href="/live-class" />
          {todayClasses.length === 0 ? (
            <p className="text-xs text-gray-400 font-semibold text-center py-5">No classes scheduled.</p>
          ) : (
            <div className="space-y-2.5">
              {todayClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <BookOpen size={15} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-gray-800">{cls.subject}</p>
                      <p className="text-[10px] text-gray-500 font-semibold">{cls.time} · {cls.teacherName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cls.status === "ongoing" && (
                      <Button asChild size="sm" className="h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold px-2.5">
                        <Link href="/live-class">Join</Link>
                      </Button>
                    )}
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                      cls.status === "ongoing" ? "bg-green-100 text-green-700" :
                      cls.status === "completed" ? "bg-gray-100 text-gray-500" :
                      "bg-blue-50 text-blue-600"
                    )}>
                      {cls.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Doubts */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <SectionHeader title="Your Active Doubts" href="/ask" label="Ask More" />
          {doubts.length === 0 ? (
            <p className="text-xs text-gray-400 font-semibold text-center py-5">No active doubts.</p>
          ) : (
            <div className="space-y-2.5">
              {doubts.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-start justify-between gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge className="bg-gray-100 text-gray-600 font-bold text-[8px] uppercase px-2 py-0.5 rounded-full">{d.subject}</Badge>
                      <Badge className={cn("text-[8px] font-bold uppercase px-2 py-0.5 rounded-full",
                        d.status === "resolved" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                      )}>{d.status}</Badge>
                    </div>
                    <p className="text-xs font-bold text-gray-800 line-clamp-1">{d.title}</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{d.answers.length} answers</p>
                  </div>
                  <Link href="/ask" className="text-blue-500 hover:text-blue-700 shrink-0 mt-1">
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT COLUMN ─── */}
      <div className="space-y-4">

        {/* Student Stats Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
              {student.fullName
                ? student.fullName.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : "NS"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-800 truncate">{student.fullName || student.phoneNumber || "Student"}</p>
              <p className="text-[10px] text-gray-500 font-semibold">
                {student.grade || ""}{student.grade && student.stream ? " · " : ""}{student.stream || ""}
              </p>
            </div>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp size={14} className="text-orange-500" />
                <span className="text-lg font-black text-gray-800">{student.streakCount}</span>
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Day Streak</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Star size={14} className="text-blue-500" />
                <span className="text-lg font-black text-gray-800">0</span>
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">XP Points</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp size={14} className="text-indigo-500" />
                <span className="text-lg font-black text-gray-800">
                  {student.attendancePercent != null ? `${student.attendancePercent}%` : "N/A"}
                </span>
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Attendance</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Award size={14} className="text-green-500" />
                <span className="text-lg font-black text-gray-800">N/A</span>
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Rank</p>
            </div>
          </div>

          <Link href="/settings" className="flex items-center justify-center gap-1.5 text-xs text-blue-600 font-bold hover:underline pt-1">
            <Settings size={12} />
            Edit Profile
          </Link>
        </div>

        {/* Live Classes & Tests Counter */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-50 mx-auto mb-2">
              <Video size={18} className="text-red-500" />
            </div>
            <p className="text-2xl font-black text-gray-800">{todayClasses.filter((c) => c.status === "ongoing" || c.status === "scheduled").length}</p>
            <p className="text-[10px] text-gray-500 font-bold mt-0.5">Live Classes</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-yellow-50 mx-auto mb-2">
              <ClipboardList size={18} className="text-yellow-500" />
            </div>
            <p className="text-2xl font-black text-gray-800">{upcomingTests.length}</p>
            <p className="text-[10px] text-gray-500 font-bold mt-0.5">Mock Tests</p>
          </div>
        </div>

        {/* Upcoming Tests */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <SectionHeader title="Upcoming Tests" href="/test" />
          {upcomingTests.length === 0 ? (
            <p className="text-xs text-gray-400 font-semibold text-center py-4">No tests available.</p>
          ) : (
            <div className="space-y-2.5">
              {upcomingTests.slice(0, 3).map((t) => (
                <div key={t.id} className="p-3 border border-gray-200 rounded-xl space-y-2 hover:bg-gray-50/60 transition-colors">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-yellow-50 text-yellow-700 font-bold text-[8px] uppercase px-2 py-0.5 rounded-full">{t.subject}</Badge>
                    <span className="text-[9px] text-gray-400 font-bold">{t.durationMinutes} mins</span>
                  </div>
                  <p className="text-[11px] font-extrabold text-gray-800 line-clamp-1">{t.title}</p>
                  <Button asChild size="sm" className="w-full h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold">
                    <Link href="/test">Start Test</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Assignments */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <SectionHeader title="Pending Tasks" href="/learn" />
          {pendingAssignments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center">
                <CalendarDays size={16} className="text-green-500" />
              </div>
              <p className="text-xs text-gray-400 font-semibold">No pending tasks.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingAssignments.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 p-3 border border-gray-200 rounded-xl hover:bg-gray-50/60 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <Clock size={14} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-extrabold text-gray-800 line-clamp-1">{a.title}</p>
                    <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Due: {new Date(a.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
