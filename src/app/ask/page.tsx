"use client";

import { useEffect, useState, useRef } from "react";
import { 
  MessageSquare, 
  Sparkles, 
  Plus, 
  Send, 
  Search, 
  ThumbsUp, 
  User, 
  Check, 
  HelpCircle,
  Clock,
  Trash2,
  BookOpen
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DashboardGuard } from "@/components/auth-guard";
import { StudentLayout } from "@/components/student-layout";
import { api } from "@/services/api";
import { DoubtQuestion, AIChatHistory } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

function AskPortalContent() {
  const { toast } = useToast();
  
  // Community Doubt states
  const [doubts, setDoubts] = useState<DoubtQuestion[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Ask new doubt dialog
  const [isDoubtDialogOpen, setIsDoubtDialogOpen] = useState(false);
  const [newDoubtTitle, setNewDoubtTitle] = useState("");
  const [newDoubtText, setNewDoubtText] = useState("");
  const [newDoubtSubject, setNewDoubtSubject] = useState("Mathematics");
  const [newDoubtTags, setNewDoubtTags] = useState("");

  // Detailed doubt viewer dialog
  const [viewingDoubt, setViewingDoubt] = useState<DoubtQuestion | null>(null);
  const [replyText, setReplyText] = useState("");

  // AI Chat states
  const [aiChats, setAIChats] = useState<AIChatHistory[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [aiInputMessage, setAIInputMessage] = useState("");
  const [isAISending, setIsAISending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    const doubtsRes = await api.getDoubts();
    if (doubtsRes.success && doubtsRes.data) {
      setDoubts(doubtsRes.data);
    }

    const aiRes = await api.getAIChatHistory();
    if (aiRes.success && aiRes.data) {
      setAIChats(aiRes.data);
      if (aiRes.data.length > 0 && !activeChatId) {
        setActiveChatId(aiRes.data[0].id);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChats, activeChatId]);

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await api.upvoteQuestion(id);
    if (res.success) {
      setDoubts(prev => prev.map(d => d.id === id ? { ...d, upvotes: res.upvotes ?? d.upvotes, voted: d.voted === "up" ? undefined : "up" } : d));
      // If we are currently viewing this doubt in detail, update it too
      if (viewingDoubt?.id === id) {
        setViewingDoubt(prev => prev ? { ...prev, upvotes: res.upvotes ?? prev.upvotes, voted: prev.voted === "up" ? undefined : "up" } : null);
      }
    }
  };

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoubtTitle.trim() || !newDoubtText.trim()) return;

    const tags = newDoubtTags.split(",").map(t => t.trim()).filter(Boolean);
    const res = await api.askDoubt(newDoubtTitle, newDoubtText, newDoubtSubject, tags);
    if (res.success) {
      toast({
        title: "Doubt Posted",
        description: "Your question has been posted to the student forum.",
      });
      setIsDoubtDialogOpen(false);
      setNewDoubtTitle("");
      setNewDoubtText("");
      setNewDoubtTags("");
      loadData();
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingDoubt || !replyText.trim()) return;

    const res = await api.replyToDoubt(viewingDoubt.id, replyText);
    if (res.success && res.data) {
      toast({
        title: "Reply Posted",
        description: "Your reply has been added.",
      });
      setViewingDoubt(prev => prev ? { ...prev, answers: [...prev.answers, res.data] } : null);
      setReplyText("");
      loadData();
    }
  };

  const handleCreateNewAIChat = async () => {
    const title = `AI Tutor Session #${aiChats.length + 1}`;
    const res = await api.createNewAIChat(title);
    if (res.success && res.data) {
      setAIChats(prev => [res.data!, ...prev]);
      setActiveChatId(res.data.id);
      toast({
        title: "New AI Chat Session",
        description: "Ask your AI tutor anything about subjects, formulas, or exams.",
      });
    }
  };

  const handleDeleteAIChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await api.deleteAIChat(id);
    if (res.success) {
      setAIChats(prev => prev.filter(c => c.id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
      }
      toast({
        title: "Chat Deleted",
        description: "Chat history deleted.",
      });
    }
  };

  const handleSendAIMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !aiInputMessage.trim() || isAISending) return;

    const currentMsg = aiInputMessage;
    setAIInputMessage("");
    setIsAISending(true);

    const res = await api.sendChatMessageToAI(activeChatId, currentMsg);
    setIsAISending(false);

    if (res.success) {
      loadData(); // Reload chat history state
    }
  };

  // Filter doubts
  const filteredDoubts = doubts.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject ? d.subject === selectedSubject : true;
    return matchesSearch && matchesSubject;
  });

  const subjects = Array.from(new Set(doubts.map(d => d.subject)));
  const activeAIChat = aiChats.find(c => c.id === activeChatId);

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="community" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-xl h-11 border border-gray-350 bg-white mb-4">
          <TabsTrigger value="community" className="font-bold text-xs sm:text-sm px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            <MessageSquare className="h-4 w-4 mr-2" />
            Community Forum
          </TabsTrigger>
          <TabsTrigger value="ai-tutor" className="font-bold text-xs sm:text-sm px-4 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
            <Sparkles className="h-4 w-4 mr-2" />
            Ask NoteSwift AI
          </TabsTrigger>
        </TabsList>

        {/* COMMUNITY FORUM */}
        <TabsContent value="community" className="focus-visible:outline-none space-y-6">
          {/* Header controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 border border-gray-300 rounded-2xl shadow-sm">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search forum questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 border-gray-250 rounded-xl"
              />
            </div>

            <div className="flex gap-2 flex-wrap sm:flex-nowrap justify-between w-full sm:w-auto">
              <div className="flex gap-1.5 overflow-x-auto">
                <Badge 
                  onClick={() => setSelectedSubject(null)}
                  className={`cursor-pointer rounded-full px-3 py-1 font-bold text-xs shrink-0 ${
                    !selectedSubject ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  All
                </Badge>
                {subjects.map((sub) => (
                  <Badge 
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={`cursor-pointer rounded-full px-3 py-1 font-bold text-xs shrink-0 ${
                      selectedSubject === sub ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {sub}
                  </Badge>
                ))}
              </div>

              <Button 
                onClick={() => setIsDoubtDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 text-xs px-4 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" />
                Ask a Doubt
              </Button>
            </div>
          </div>

          {/* Doubts list */}
          <div className="space-y-4">
            {filteredDoubts.map((d) => (
              <Card 
                key={d.id} 
                onClick={() => setViewingDoubt(d)}
                className="border border-gray-300 shadow-sm bg-white rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer space-y-4"
              >
                <div className="flex gap-3 items-center">
                  <div className="h-9 w-9 bg-blue-100 text-base rounded-full flex items-center justify-center border border-blue-200">
                    {d.studentAvatar || "🎒"}
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-gray-800 leading-none">{d.studentName}</h5>
                    <span className="text-[10px] text-gray-400 font-semibold">{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 font-extrabold text-[8px] ml-auto uppercase">{d.subject}</Badge>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-extrabold text-gray-850 leading-snug">{d.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold line-clamp-2 leading-relaxed">
                    {d.text}
                  </p>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {d.tags.map((tag) => (
                    <Badge key={tag} className="bg-gray-100 text-gray-500 hover:bg-gray-100 font-semibold text-[9px] px-2 rounded">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                <div className="border-t border-gray-150 pt-3.5 flex items-center gap-6 text-xs text-gray-400 font-extrabold">
                  <button 
                    onClick={(e) => handleUpvote(d.id, e)}
                    className={`flex items-center gap-1.5 transition-colors ${d.voted === "up" ? "text-blue-600" : "hover:text-blue-600"}`}
                  >
                    <ThumbsUp className="h-4.5 w-4.5" />
                    <span>{d.upvotes} Upvotes</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4.5 w-4.5 text-gray-400" />
                    <span>{d.answers.length} Answers</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ASK AI TUTOR */}
        <TabsContent value="ai-tutor" className="focus-visible:outline-none">
          <div className="grid gap-6 md:grid-cols-4 border border-gray-300 shadow-sm bg-white rounded-3xl overflow-hidden min-h-[550px] max-h-[650px]">
            {/* AI Chats sidebar */}
            <div className="border-r border-gray-300 bg-gray-50/50 flex flex-col md:col-span-1 h-full max-h-[650px] overflow-y-auto">
              <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-white shrink-0">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sessions</span>
                <Button 
                  onClick={handleCreateNewAIChat}
                  size="icon" 
                  variant="outline" 
                  className="h-8 w-8 rounded-lg border-gray-300 text-blue-600"
                >
                  <Plus className="h-4.5 w-4.5" />
                </Button>
              </div>

              <div className="flex-1 p-2 space-y-1">
                {aiChats.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setActiveChatId(c.id)}
                    className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-colors ${
                      activeChatId === c.id 
                        ? "bg-blue-50 text-blue-700 font-bold" 
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    <div className="flex gap-2 items-center min-w-0">
                      <Sparkles className={`h-4 w-4 shrink-0 ${activeChatId === c.id ? "text-blue-600" : "text-gray-400"}`} />
                      <span className="text-xs truncate leading-none">{c.title}</span>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteAIChat(c.id, e)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Active chat work pane */}
            <div className="md:col-span-3 flex flex-col h-full justify-between max-h-[650px]">
              {activeAIChat ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-gray-350 bg-white flex justify-between items-center shrink-0">
                    <div className="flex gap-2.5 items-center">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Sparkles className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-gray-800 leading-none">{activeAIChat.title}</h4>
                        <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">Online • NoteSwift AI Study Buddy</span>
                      </div>
                    </div>
                  </div>

                  {/* Messages box */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-gray-50/20">
                    {activeAIChat.messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full border border-blue-100 animate-bounce">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-extrabold text-gray-800">Ask NoteSwift AI Tutor</h4>
                        <p className="text-xs text-gray-500 font-semibold max-w-xs leading-relaxed">
                          Ask questions about math equations, chemical equations, grammar usage, or historical timelines.
                        </p>
                      </div>
                    ) : (
                      activeAIChat.messages.map((m) => {
                        const isStudent = m.role === "user";
                        return (
                          <div 
                            key={m.id} 
                            className={`flex gap-3 items-start max-w-[85%] ${
                              isStudent ? "ml-auto flex-row-reverse" : ""
                            }`}
                          >
                            <div className={`h-8 w-8 rounded-full border flex items-center justify-center text-xs shrink-0 select-none ${
                              isStudent 
                                ? "bg-indigo-650 text-white border-indigo-700" 
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {isStudent ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                            </div>

                            <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed font-medium shadow-sm ${
                              isStudent 
                                ? "bg-indigo-600 text-white rounded-tr-none" 
                                : "bg-white text-gray-800 border border-gray-250 rounded-tl-none"
                            }`}>
                              {m.content.split("\n").map((line, idx) => (
                                <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>{line}</p>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input box */}
                  <form onSubmit={handleSendAIMessage} className="p-4 border-t border-gray-300 bg-white flex gap-3 shrink-0">
                    <Input
                      placeholder="Ask the AI Tutor a question..."
                      value={aiInputMessage}
                      onChange={(e) => setAIInputMessage(e.target.value)}
                      disabled={isAISending}
                      className="h-11 border-gray-250 rounded-xl focus-visible:ring-blue-500 font-semibold"
                    />
                    <Button 
                      type="submit" 
                      disabled={isAISending || !aiInputMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-5"
                    >
                      <Send className="h-4.5 w-4.5" />
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-gray-800">Select an AI Tutor Session</h4>
                  <p className="text-xs text-gray-500 font-semibold max-w-xs leading-relaxed">
                    Create a new session or choose an active discussion thread.
                  </p>
                  <Button onClick={handleCreateNewAIChat} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 px-6">
                    Start Session
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ASK DOUBT DIALOG */}
      <Dialog open={isDoubtDialogOpen} onOpenChange={setIsDoubtDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-gray-300 p-6 rounded-2xl space-y-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-extrabold text-gray-800">Post community doubt</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-semibold leading-relaxed">
              Describe your doubt clearly so other students or school teachers can respond.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAskDoubt} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-bold text-gray-600">Question Title *</Label>
              <Input
                id="title"
                placeholder="What is your question?"
                value={newDoubtTitle}
                onChange={(e) => setNewDoubtTitle(e.target.value)}
                required
                className="h-11 border-gray-250 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-bold text-gray-600">Select Subject *</Label>
              <select
                id="subject"
                value={newDoubtSubject}
                onChange={(e) => setNewDoubtSubject(e.target.value)}
                className="w-full h-11 border border-gray-250 rounded-xl px-3 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="Social Studies">Social Studies</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="text" className="text-xs font-bold text-gray-600">Detailed Explanation *</Label>
              <Textarea
                id="text"
                placeholder="Provide details of your doubt, equations, formulas, context..."
                value={newDoubtText}
                onChange={(e) => setNewDoubtText(e.target.value)}
                required
                rows={4}
                className="border-gray-250 rounded-xl text-xs sm:text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags" className="text-xs font-bold text-gray-600">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="e.g. algebra, formula, proof"
                value={newDoubtTags}
                onChange={(e) => setNewDoubtTags(e.target.value)}
                className="h-11 border-gray-250 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <Button type="submit" className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 text-xs">
                Post Doubt
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDoubtDialogOpen(false)}
                className="border-gray-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAILED DOUBT VIEWER DIALOG */}
      <Dialog open={!!viewingDoubt} onOpenChange={(open) => !open && setViewingDoubt(null)}>
        <DialogContent className="max-w-xl bg-white border border-gray-300 p-6 rounded-3xl space-y-5 max-h-[85vh] overflow-y-auto">
          {viewingDoubt && (
            <>
              {/* Question details */}
              <div className="space-y-4">
                <div className="flex gap-3 items-center">
                  <div className="h-9 w-9 bg-blue-100 text-base rounded-full flex items-center justify-center border border-blue-200">
                    {viewingDoubt.studentAvatar || "🎒"}
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-gray-800 leading-none">{viewingDoubt.studentName}</h5>
                    <span className="text-[10px] text-gray-400 font-semibold">{new Date(viewingDoubt.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 font-extrabold text-[8px] ml-auto uppercase">{viewingDoubt.subject}</Badge>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-gray-800 leading-snug">{viewingDoubt.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-medium">{viewingDoubt.text}</p>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-gray-150 text-xs text-gray-400 font-bold">
                  <button 
                    onClick={(e) => handleUpvote(viewingDoubt.id, e)}
                    className={`flex items-center gap-1.5 ${viewingDoubt.voted === "up" ? "text-blue-600" : "hover:text-blue-600"}`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{viewingDoubt.upvotes} Upvotes</span>
                  </button>
                  <span className="bg-secondary px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase text-gray-600">
                    {viewingDoubt.status}
                  </span>
                </div>
              </div>

              {/* Answers / Replies list */}
              <div className="space-y-3.5 border-t border-gray-150 pt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Answers ({viewingDoubt.answers.length})</h4>
                
                {viewingDoubt.answers.length === 0 ? (
                  <p className="text-xs text-gray-400 font-bold py-2">No replies yet. Be the first to answer!</p>
                ) : (
                  <div className="space-y-3">
                    {viewingDoubt.answers.map((ans) => (
                      <div key={ans.id} className="p-3.5 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-1.5 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-gray-800">{ans.authorName}</span>
                          <Badge className={`text-[8px] font-extrabold uppercase ${
                            ans.authorRole === "teacher" ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {ans.authorRole}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-medium">{ans.text}</p>
                        {ans.isAccepted && (
                          <div className="absolute top-2 right-2 flex items-center gap-0.5 text-green-600 text-[9px] font-extrabold bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                            <Check className="h-3 w-3" />
                            <span>Accepted</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Reply Form */}
              <form onSubmit={handlePostReply} className="space-y-3 border-t border-gray-150 pt-4">
                <Label htmlFor="reply" className="text-xs font-bold text-gray-600">Post your reply</Label>
                <Textarea
                  id="reply"
                  placeholder="Type your response to explain or solve this doubt..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                  rows={3}
                  className="border-gray-250 rounded-xl text-xs sm:text-sm font-medium"
                />
                <div className="flex justify-end gap-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-9 text-xs px-4">
                    Post Answer
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setViewingDoubt(null)}
                    className="border-gray-300 rounded-xl font-bold text-xs h-9 px-4"
                  >
                    Close
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AskPortalPage() {
  return (
    <DashboardGuard>
      <StudentLayout>
        <AskPortalContent />
      </StudentLayout>
    </DashboardGuard>
  );
}
