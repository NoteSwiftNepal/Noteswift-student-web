"use client";

import React, { useEffect, useState, useRef } from "react";
import { LiveKitRoom, VideoTrack, useTracks, useChat, useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Hand, Volume2, Maximize2, Send, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RTCStreamContentProps {
  token: string;
  serverUrl: string;
  subjectName: string;
  teacherName: string;
  studentName: string;
  classroomId: string;
  onLeave: () => void;
}

export default function RealTimeRTCStream({
  token,
  serverUrl,
  subjectName,
  teacherName,
  studentName,
  classroomId,
  onLeave
}: RTCStreamContentProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      data-lk-theme="default"
    >
      <RTCStreamContent
        subjectName={subjectName}
        teacherName={teacherName}
        studentName={studentName}
        classroomId={classroomId}
        onLeave={onLeave}
      />
    </LiveKitRoom>
  );
}

function RTCStreamContent({
  subjectName,
  teacherName,
  studentName,
  classroomId,
  onLeave
}: Omit<RTCStreamContentProps, "token" | "serverUrl">) {
  const room = useRoomContext();
  const { chatMessages, send } = useChat();
  const { toast } = useToast();
  
  const [connectionState, setConnectionState] = useState("connecting");
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [volume, setVolume] = useState(80);
  const [chatInput, setChatInput] = useState("");
  const [doubtInput, setDoubtInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "doubts">("chat");

  const socketRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tracks list from LiveKit
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Sync Room Connection State
  useEffect(() => {
    if (!room) return;
    const onStateChange = () => setConnectionState(room.state);
    room.on("connectionStateChanged" as any, onStateChange);
    setConnectionState(room.state);
    return () => {
      room.off("connectionStateChanged" as any, onStateChange);
    };
  }, [room]);

  // Connect Socket.IO signaling just like mobile
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const socket = io(API_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.emit("join-classroom", {
      classroomId,
      userName: studentName,
      userType: "student",
    });

    socket.on("user-joined", (data: any) => {
      if (data.totalStudents) {
        setViewerCount(data.totalStudents);
      }
    });

    socket.on("raised-hands-sync", (hands: any[]) => {
      const myHand = hands?.find((h: any) => h.userName === studentName);
      setIsHandRaised(!!myHand);
    });

    return () => {
      socket.emit("leave-classroom", { classroomId, userName: studentName, userType: "student" });
      socket.disconnect();
    };
  }, [classroomId, studentName]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Find primary teacher video track
  const teacherTracks = tracks.filter(
    (t) =>
      t.publication &&
      t.participant &&
      String(t.participant.identity || "").toLowerCase().includes("teacher")
  );

  let primaryTeacherTrack = teacherTracks.find(
    (t) => String(t.publication?.source || "").toLowerCase().includes("screen")
  );
  if (!primaryTeacherTrack) {
    primaryTeacherTrack = teacherTracks.find(
      (t) => String(t.publication?.source || "").toLowerCase().includes("camera")
    );
  }
  if (!primaryTeacherTrack) {
    primaryTeacherTrack = tracks.find(
      (t) =>
        t.publication &&
        t.participant &&
        t.participant.identity !== room?.localParticipant?.identity &&
        t.publication.kind === "video"
    );
  }

  const handleRaiseHand = () => {
    const socket = socketRef.current;
    if (!socket) return;
    if (isHandRaised) {
      socket.emit("lower-hand", { classroomId, userName: studentName });
      setIsHandRaised(false);
      toast({ title: "Hand Lowered", description: "Teacher notification retracted." });
    } else {
      socket.emit("raise-hand", { classroomId, userName: studentName });
      setIsHandRaised(true);
      toast({ title: "Hand Raised", description: "Teacher has been notified." });
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await send(chatInput.trim());
      setChatInput("");
    } catch (err) {
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  };

  const handleSendDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtInput.trim()) return;
    const socket = socketRef.current;
    if (socket) {
      socket.emit("send-doubt", { classroomId, userName: studentName, question: doubtInput.trim() });
      toast({ title: "Doubt Submitted", description: "Queued for teacher's view." });
      setDoubtInput("");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Stream Screen */}
      <div className="lg:col-span-2 space-y-4">
            {/* Player Box */}
            <div className="relative aspect-video rounded-3xl bg-indigo-50/50 border border-indigo-150 overflow-hidden shadow-sm group">
              {primaryTeacherTrack?.publication?.track ? (
                <VideoTrack
                  trackRef={primaryTeacherTrack}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 text-slate-805 p-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center font-extrabold text-2xl text-white mb-4 border-2 border-indigo-100 shadow-md">
                    {teacherName.split(' ').map(n=>n[0]).join('').toUpperCase()}
                  </div>
                  <h4 className="text-sm font-extrabold text-indigo-950">{teacherName}</h4>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">Waiting for video stream feed...</p>
                  <Badge className="mt-3 bg-indigo-100/80 text-indigo-700 border border-indigo-200/50 font-bold">
                    {connectionState === "connected" ? "Audio Only Active" : `RTC Connection: ${connectionState}`}
                  </Badge>
                </div>
              )}

              {/* Controls Bar Overlay on Hover */}
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
                      className="w-16 h-1 rounded-lg bg-gray-600 accent-indigo-505 cursor-pointer"
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

        {/* Info Box */}
        <div className="p-5 border border-gray-300 bg-white rounded-2xl">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-600">Active Live Connection</span>
              <h3 className="text-base font-extrabold text-gray-800">{subjectName}</h3>
              <p className="text-xs text-gray-500 font-semibold mt-1">Instructor: {teacherName}</p>
            </div>
            <Badge className="bg-emerald-50 border-emerald-200 text-emerald-700 font-bold capitalize">
              {connectionState}
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat & QA Sidebar */}
      <div className="lg:col-span-1 flex flex-col h-[520px] lg:h-auto min-h-[460px] border border-gray-300 rounded-3xl bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 p-2 gap-1">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "chat" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
            }`}
          >
            Live Chat
          </button>
          <button
            onClick={() => setActiveTab("doubts")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "doubts" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
            }`}
          >
            Ask Doubt
          </button>
        </div>

        {activeTab === "chat" ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] font-extrabold text-gray-700">{msg.from?.name || "Student"}</span>
                    <span className="text-[8px] text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-2xl rounded-tl-none text-[11px] text-gray-850">
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="p-3 border-t border-gray-200 flex gap-2 bg-gray-50">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type message..."
                className="h-10 border-gray-300 rounded-xl text-xs flex-1 bg-white"
              />
              <Button type="submit" size="icon" className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10 rounded-xl shrink-0">
                <Send className="h-4 w-4 text-white" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col flex-1 p-4 justify-between">
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-gray-655 block">Classroom Doubt Console</span>
              <textarea
                value={doubtInput}
                onChange={(e) => setDoubtInput(e.target.value)}
                rows={4}
                placeholder="Ask your question here..."
                className="w-full border border-gray-250 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
              />
            </div>
            <Button onClick={handleSendDoubt} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 text-xs rounded-xl">
              Submit Question
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
