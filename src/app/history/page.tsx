"use client";

import { useEffect, useState } from "react";
import { 
  Clock, 
  Trash2, 
  PlayCircle, 
  FileText, 
  CheckCircle2, 
  Download, 
  ArrowLeft,
  Calendar,
  Sparkles,
  Search,
  Filter
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { api } from "@/services/api";

interface HistoryItem {
  id: string;
  type: "video" | "notes" | "test" | "live_class" | "download";
  title: string;
  courseName?: string;
  subjectName?: string;
  timestamp: string;
  progress?: number;
  score?: { obtained: number; total: number };
  duration?: string;
}

const initialHistory: HistoryItem[] = [
  { id: "h-1", type: "video", title: "Completing the Square Method", courseName: "SEE Grade 10 Mathematics Complete Guide", subjectName: "Mathematics", timestamp: new Date(Date.now() - 3600000).toISOString(), progress: 85 },
  { id: "h-2", type: "notes", title: "Newton's Laws & Gravity notes PDF", courseName: "SEE Grade 10 Science Masterclass", subjectName: "Science", timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: "h-3", type: "test", title: "Trigonometry Heights and Angles Test", courseName: "SEE Grade 10 Mathematics Complete Guide", subjectName: "Mathematics", timestamp: new Date(Date.now() - 86400000).toISOString(), score: { obtained: 13.5, total: 20 } },
  { id: "h-4", type: "live_class", title: "Compound Interest & Venn Diagrams live stream", courseName: "SEE Grade 10 Mathematics Complete Guide", subjectName: "Mathematics", timestamp: new Date(Date.now() - 172800000).toISOString(), duration: "1 hr 15 mins" },
  { id: "h-5", type: "download", title: "Heredity & Mendel Genetics notes", courseName: "SEE Grade 10 Science Masterclass", subjectName: "Science", timestamp: new Date(Date.now() - 259200000).toISOString() }
];

function HistoryContent() {
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const res = await api.getHistory();
      if (res.success && res.data) {
        setHistory(res.data);
      }
      // If API returns empty or fails, history stays [] and empty state is shown
    };
    loadData();
  }, []);

  const handleClearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.setItem("noteswift_student_history", JSON.stringify([]));
    }
    toast({
      title: "History Cleared",
      description: "Your academic history log has been cleared.",
    });
  };


  const getIcon = (type: string) => {
    switch (type) {
      case "video": return <PlayCircle className="h-5 w-5 text-red-500" />;
      case "notes": return <FileText className="h-5 w-5 text-blue-500" />;
      case "test": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "live_class": return <Calendar className="h-5 w-5 text-purple-500" />;
      case "download": return <Download className="h-5 w-5 text-amber-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredHistory = history.filter(item => {
    const typeMatch = filter === "all" || item.type === filter;
    const searchMatch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                        (item.courseName || "").toLowerCase().includes(search.toLowerCase());
    return typeMatch && searchMatch;
  });

  const relativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center border-b border-gray-300 pb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
            <Clock className="h-6 w-6 text-indigo-500 animate-pulse" />
            Learning History Log
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Review your lectures, documents opened, and completed exams in chronological order.
          </p>
        </div>

        {history.length > 0 && (
          <Button 
            onClick={handleClearHistory}
            variant="outline" 
            className="border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl h-10 text-xs px-4 flex items-center gap-1.5 bg-white"
          >
            <Trash2 className="h-4 w-4" />
            Clear Log
          </Button>
        )}
      </div>

      {/* Filter and search controllers */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search classes or lecture notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-10 border-gray-250 rounded-2xl bg-white text-xs sm:text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: "All Activities" },
            { id: "video", label: "Videos" },
            { id: "notes", label: "Notes" },
            { id: "test", label: "Tests" },
            { id: "live_class", label: "Classes" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl border shrink-0 transition-all",
                filter === tab.id
                  ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Items list */}
      {filteredHistory.length === 0 ? (
        <Card className="border border-gray-300 bg-white p-12 text-center rounded-2xl max-w-md mx-auto space-y-3 mt-4">
          <div className="h-12 w-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto border border-gray-150 animate-bounce">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-extrabold text-gray-800">History Log Empty</h3>
          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            No logged items match your current search queries or filter pills.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div 
              key={item.id} 
              className="p-4 bg-white border border-gray-250 rounded-2xl flex items-start gap-4 transition-all hover:bg-gray-50/50 relative overflow-hidden"
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 shrink-0">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-800 leading-snug truncate">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-bold shrink-0">{relativeTime(item.timestamp)}</span>
                </div>
                {item.courseName && (
                  <p className="text-[11px] text-gray-500 font-semibold truncate">{item.courseName}</p>
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-650 rounded-full font-bold text-[8px] uppercase">
                    {item.type}
                  </Badge>
                  {item.progress !== undefined && (
                    <span className="text-[10px] text-gray-400 font-bold">Watched {item.progress}%</span>
                  )}
                  {item.duration && (
                    <span className="text-[10px] text-gray-400 font-bold">Duration: {item.duration}</span>
                  )}
                  {item.score && (
                    <span className="text-[10px] text-green-600 font-bold">Score: {item.score.obtained} / {item.score.total}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <HistoryContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
