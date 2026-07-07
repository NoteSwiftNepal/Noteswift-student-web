"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Video, 
  VideoOff,
  Send, 
  MessageSquare, 
  Users, 
  Hand, 
  Sparkles, 
  Volume2, 
  Settings, 
  ArrowLeft, 
  HelpCircle,
  Clock,
  Maximize2
} from "lucide-react";
import { useStudentAuth } from "@/context/student-auth-context";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { USE_MOCK_DATA } from "@/config/app-config";

// Dynamic import of LiveKit WebRTC module to completely bypass Server-Side Pre-Rendering failures
const RealTimeRTCStream = dynamic(() => import("./realtime-rtc-stream"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-gray-300 rounded-3xl bg-gray-50/50 min-h-[350px]">
      <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-bold text-gray-500 mt-3">Initializing real-time video connection...</span>
    </div>
  )
});

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  time: string;
  avatarClass: string;
  isSelf?: boolean;
}

export default function LiveClassPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <LiveClassContent />
      </StudentLayout>
    </DashboardGuard>
  );
}

function LiveClassContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { student } = useStudentAuth();
  const { toast } = useToast();
  
  const subjectName = searchParams.get("subject") || "Mathematics";
  const teacherName = searchParams.get("teacher") || "Mr. Kiran Adhikari";

  const [activeTab, setActiveTab] = useState<"chat" | "doubts">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [doubtInput, setDoubtInput] = useState("");
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [viewerCount, setViewerCount] = useState(148);
  const [liveDuration, setLiveDuration] = useState("00:22:15");
  const [volume, setVolume] = useState(80);

  // Real-time RTC states
  const [token, setToken] = useState<string | null>(null);
  const [useRealRTC, setUseRealRTC] = useState(false);
  const [classroomId, setClassroomId] = useState("live-math-class");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Resolve Real LiveKit tokens if running on actual backend
  useEffect(() => {
    if (USE_MOCK_DATA) {
      // Load preseeded mock messages
      setMessages([
        { id: "m1", sender: "Ankit Shrestha", message: "Namaste Sir! 🙏 Ready for today's session.", time: "12:15 PM", avatarClass: "from-blue-500 to-indigo-650" },
        { id: "m2", sender: "Pooja Sharma", message: "Could you please explain that trigonometry formula again once we start?", time: "12:16 PM", avatarClass: "from-purple-500 to-indigo-700" },
        { id: "m3", sender: "Bibek Thapa", message: "Audio and video are perfectly clear from my side.", time: "12:16 PM", avatarClass: "from-emerald-500 to-teal-700" },
      ]);
      return;
    }

    const fetchToken = async () => {
      try {
        const classesRes = await api.getLiveClasses();
        if (classesRes.success && classesRes.data && classesRes.data.length > 0) {
          // Find the currently active/live stream classroom
          const activeClass = classesRes.data.find(c => c.status === "ongoing" || c.status === "live" || c.status === "active");
          const activeRoomId = activeClass?.roomId || activeClass?.id || "live-math-class";
          setClassroomId(activeRoomId);

          const tokenRes = await api.getLiveClassToken(activeRoomId);
          if (tokenRes.success && tokenRes.data?.token) {
            setToken(tokenRes.data.token);
            setUseRealRTC(true);
            toast({
              title: "Connected to Media Server",
              description: "Established real-time WebRTC media connection."
            });
          }
        }
      } catch (err) {
        console.error("Failed to connect to LiveKit token server:", err);
      }
    };
    fetchToken();
  }, [toast]);

  // Live timer simulation
  useEffect(() => {
    const start = Date.now() - 22 * 60 * 1000 - 15 * 1000;
    const timer = setInterval(() => {
      const diff = Date.now() - start;
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setLiveDuration(
        `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Classmate live chat simulator (Only runs in mock mode)
  useEffect(() => {
    if (!USE_MOCK_DATA) return;

    const comments = [
      "Is this theorem going to be in our upcoming board examinations?",
      "Yes Pooja! Sir wrote that formula on slide 3.",
      "Wow, the visual diagrams make Venn relations so simple to understand.",
      "Let's practice question 4 from the exercise guidelines.",
      "Can we get the revision homework PDF today?",
      "Thank you Sir! This is extremely helpful.",
      "I am noting down all these key proofs.",
    ];

    const senders = [
      { name: "Sita Dahal", avatar: "from-rose-500 to-pink-650" },
      { name: "Rohan Basnet", avatar: "from-cyan-500 to-blue-600" },
      { name: "Aayush Khanal", avatar: "from-amber-500 to-orange-600" },
      { name: "Nisha Tamang", avatar: "from-teal-500 to-emerald-600" },
    ];

    const chatSimulator = setInterval(() => {
      const randomSender = senders[Math.floor(Math.random() * senders.length)];
      const randomComment = comments[Math.floor(Math.random() * comments.length)];
      
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      setMessages(prev => [
        ...prev,
        {
          id: `m-sim-${Date.now()}`,
          sender: randomSender.name,
          message: randomComment,
          time: timeStr,
          avatarClass: randomSender.avatar
        }
      ]);
      setViewerCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 12000);

    return () => clearInterval(chatSimulator);
  }, [useRealRTC]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newMsg: ChatMessage = {
      id: `self-${Date.now()}`,
      sender: student?.fullName || "You",
      message: chatInput.trim(),
      time: timeStr,
      avatarClass: "from-indigo-600 to-blue-600",
      isSelf: true,
    };

    setMessages(prev => [...prev, newMsg]);
    setChatInput("");
  };

  const handleSendDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtInput.trim()) return;

    toast({
      title: "Question Transmitted",
      description: "Your academic question has been queued in the instructor dashboard panel.",
    });
    setDoubtInput("");
  };

  const handleRaiseHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    toast({
      title: newState ? "Hand Raised" : "Hand Lowered",
      description: newState 
        ? "The instructor has been alerted that you wish to speak or answer." 
        : "Alert retracted.",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border-gray-300 h-10 w-10 shrink-0 bg-white"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-red-500 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm shrink-0">
                <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping"></span>
                <span>Live Class</span>
              </Badge>
              <span className="text-gray-400 text-xs font-bold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Sustained: {liveDuration}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 tracking-tight leading-tight mt-1">
              Interactive session: {subjectName}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{viewerCount} Students Attending</span>
          </Badge>
        </div>
      </div>

      {/* Main Grid: Render RTC connection if token exists, else fall back to simulation */}
      {useRealRTC && token ? (
        <RealTimeRTCStream
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://noteswift-ure1s57i.livekit.cloud"}
          subjectName={subjectName}
          teacherName={teacherName}
          studentName={student?.fullName || "Student"}
          classroomId={classroomId}
          onLeave={() => router.push("/dashboard")}
        />
      ) : !USE_MOCK_DATA ? (
        <div className="flex flex-col items-center justify-center border border-gray-250 rounded-3xl bg-white p-12 text-center shadow-sm min-h-[400px] space-y-4">
          <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <VideoOff size={32} />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-extrabold text-gray-800">No Ongoing Live Classes</h3>
            <p className="text-sm text-gray-505 font-semibold leading-relaxed">
              There is no scheduled live class active right now. Please check your timetable or wait for your instructor to initiate the session.
            </p>
          </div>
          <Button 
            onClick={() => router.push("/dashboard")}
            className="font-bold text-xs bg-gray-105 hover:bg-gray-200 text-gray-700 rounded-xl px-4 py-2 border border-gray-250 shadow-xs"
          >
            Go back to Dashboard
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Player & Meta */}
          <div className="lg:col-span-2 space-y-4">
            {/* Player Box */}
            <div className="relative aspect-video rounded-3xl bg-indigo-50/50 border border-indigo-150 overflow-hidden shadow-sm group">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 text-slate-800 text-center">
                <div className="w-full max-w-md bg-white border border-indigo-100 rounded-2xl p-5 shadow-xs space-y-3 mb-4 animate-pulse">
                  <div className="flex justify-between items-center text-[10px] font-bold text-indigo-650 uppercase tracking-widest border-b border-indigo-50 pb-2">
                    <span>NoteSwift Virtual Board</span>
                    <span className="text-emerald-600">Sync Active</span>
                  </div>
                  <div className="text-left font-mono text-xs sm:text-sm text-gray-655 space-y-1.5">
                    <p className="text-indigo-600 font-bold">// Today's Concept: Analytical Equations</p>
                    <p>1. Identify the coefficients: a = 2, b = -5, c = 3</p>
                    <p>2. Apply Quadratic theorem formula: x = (-b ± √(b² - 4ac)) / 2a</p>
                    <p>3. D = b² - 4ac = (-5)² - 4(2)(3) = 25 - 24 = 1</p>
                    <p className="text-emerald-600 font-bold">4. x = (5 ± √1) / 4 =&gt; x = 1.5 or x = 1</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-indigo-100 px-4 py-2 rounded-2xl shadow-xs">
                  <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-sm text-white border border-indigo-400 shadow-sm">
                    {teacherName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-gray-800">{teacherName}</span>
                    <span className="text-[10px] text-gray-400 font-semibold block">Speaking & Sharing screen...</span>
                  </div>
                  <div className="flex gap-0.5 items-end h-4 w-6 pl-2 shrink-0">
                    <div className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_100ms] h-3"></div>
                    <div className="w-1 bg-emerald-500 rounded-full animate-[bounce_1.2s_infinite_300ms] h-2"></div>
                    <div className="w-1 bg-emerald-500 rounded-full animate-[bounce_0.8s_infinite_0ms] h-4"></div>
                    <div className="w-1 bg-emerald-500 rounded-full animate-[bounce_1.1s_infinite_200ms] h-1.5"></div>
                  </div>
                </div>
              </div>

              {/* Controls Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="bg-slate-900/95 text-white rounded-2xl p-3 flex justify-between items-center shadow-lg">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-gray-300" />
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-16 h-1 rounded-lg bg-gray-600 accent-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={handleRaiseHand}
                      size="sm" 
                      variant="ghost" 
                      className={`rounded-xl text-xs gap-1.5 h-8 hover:bg-white/10 ${isHandRaised ? "text-yellow-400" : "text-white"}`}
                    >
                      <Hand className="h-4 w-4" />
                      <span>{isHandRaised ? "Hand Raised" : "Raise Hand"}</span>
                    </Button>
                    <button className="p-1 hover:text-indigo-400"><Settings className="h-4 w-4" /></button>
                    <button className="p-1 hover:text-indigo-400"><Maximize2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum Info */}
            <Card className="border border-gray-300 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">NoteSwift Course Curriculum</span>
                    <h3 className="text-base font-extrabold text-gray-800">
                       SEE Compulsory Course • Unit 3 Algebra
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold">
                      Interactive classroom lesson mapping algebraic indices, surds rationalization, and quadratic formula proofs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-200 rounded-2xl">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                      {teacherName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">{teacherName}</span>
                      <span className="text-[9px] font-bold text-gray-400 block uppercase">Mathematics Specialist</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-gray-150 pt-3.5 flex-wrap">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase shrink-0">Classmates online:</span>
                  <div className="flex -space-x-2.5 overflow-hidden shrink-0">
                    {["AS", "PS", "BT", "SD", "RB", "AK"].map((initial, i) => (
                      <div 
                        key={i} 
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full border border-white text-[9px] font-bold text-white bg-gradient-to-tr ${
                          i === 0 ? "from-blue-500 to-indigo-600" :
                          i === 1 ? "from-purple-500 to-indigo-700" :
                          i === 2 ? "from-emerald-500 to-teal-700" :
                          i === 3 ? "from-rose-500 to-pink-650" :
                          i === 4 ? "from-cyan-500 to-blue-600" :
                          "from-amber-500 to-indigo-600"
                        }`}
                      >
                        {initial}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer pl-1">
                    + {viewerCount - 6} other students
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Chat & QA */}
          <div className="lg:col-span-1 flex flex-col h-[520px] lg:h-auto min-h-[460px] border border-gray-300 rounded-3xl bg-white shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50/50 p-2 gap-1 shrink-0">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "chat" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Live Chat
              </button>
              <button
                onClick={() => setActiveTab("doubts")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "doubts" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Ask Doubt
              </button>
            </div>

            {activeTab === "chat" ? (
              <div className="flex flex-col flex-1 min-h-0 bg-white">
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex items-start gap-2.5 ${m.isSelf ? "flex-row-reverse text-right" : ""}`}>
                      <div className={`h-7 w-7 rounded-full bg-gradient-to-tr ${m.avatarClass} flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm`}>
                        {m.sender.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div className="space-y-0.5 max-w-[80%]">
                        <div className="flex items-center gap-1.5 flex-wrap justify-start">
                          <span className="text-[10px] font-extrabold text-gray-700">{m.sender}</span>
                          <span className="text-[8px] text-gray-400 font-bold">{m.time}</span>
                        </div>
                        <div className={`p-2.5 rounded-2xl text-[11px] leading-relaxed shadow-xs text-left ${
                          m.isSelf ? "bg-indigo-650 text-white rounded-tr-none" : "bg-gray-50 border border-gray-200 rounded-tl-none text-gray-850"
                        }`}>
                          {m.message}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendChat} className="p-3 border-t border-gray-200 flex gap-2 items-center bg-gray-50/50 shrink-0">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type message..."
                    className="h-10 border-gray-300 rounded-xl text-xs flex-1 bg-white focus-visible:ring-indigo-500"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="bg-indigo-650 hover:bg-indigo-700 text-white h-10 w-10 rounded-xl shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col flex-1 p-4 justify-between bg-white">
                <div className="space-y-4">
                  <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl space-y-1.5">
                    <span className="text-indigo-705 font-extrabold text-[10px] uppercase flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Priority Classroom Q&A
                    </span>
                    <p className="text-[10px] text-indigo-900 leading-normal font-semibold">
                      Questions submitted here appear directly on the instructor's console. If your question is chosen, the teacher will answer it live!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-650 block">Your Doubt Description *</span>
                    <textarea
                      value={doubtInput}
                      onChange={(e) => setDoubtInput(e.target.value)}
                      rows={4}
                      placeholder="e.g. In slide 4, where did the coefficient of -5 factor in? Is that from the index variables?"
                      className="w-full border border-gray-250 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-gray-400 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleSendDoubt}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    Submit Doubt to Teacher
                  </Button>
                  <p className="text-center text-[9px] text-gray-400 font-semibold">
                    NoteSwift moderates messages to protect live stream environments.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
