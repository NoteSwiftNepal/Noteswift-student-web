"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Sparkles, Send, Plus, Trash2, History, Menu } from "lucide-react";
import { useCourses } from "@/hooks/queries/useCourses";
import { chatWithAI, deleteChatHistory, getChatHistoryDetail, getChatHistoryList, saveChatHistory } from "@/api/student/ai";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { LatexText } from "@/components/latex-preview";
import { cn } from "@/lib/utils";
import type { AIChatHistoryTurn, ChatHistorySummary, StoredChatMessage } from "@/types/ai-chat";

const WELCOME: StoredChatMessage = {
  id: "welcome",
  text: "Hi! I'm SikAI, your study tutor. Pick a subject and chapter, then ask me anything about it.",
  sender: "ai",
  timestamp: "",
};

function newChatId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

function AIChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { courses } = useCourses();

  const [courseId, setCourseId] = useState(searchParams.get("courseId") ?? "");
  const [subjectName, setSubjectName] = useState(searchParams.get("subjectName") ?? "");
  const [moduleName, setModuleName] = useState(searchParams.get("moduleName") ?? "");

  const selectedCourse = courses.find((c) => c._id === courseId);
  const subjects = selectedCourse?.subjects ?? [];
  const modules = subjects.find((s) => s.name === subjectName)?.modules ?? [];

  const [messages, setMessages] = useState<StoredChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState(newChatId());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<ChatHistorySummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const contextReady = !!subjectName && !!moduleName;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await getChatHistoryList();
      setHistory(res.success ? res.data ?? [] : []);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const saveHistory = async (currentMessages: StoredChatMessage[]) => {
    const realMessages = currentMessages.filter((m) => m.id !== "welcome");
    if (realMessages.length === 0) return;
    const firstUserText = realMessages.find((m) => m.sender === "user")?.text ?? "New Conversation";
    const last = realMessages[realMessages.length - 1];
    try {
      await saveChatHistory({
        chatId,
        title: firstUserText.slice(0, 50) + (firstUserText.length > 50 ? "..." : ""),
        lastMessage: last.text.slice(0, 100) + (last.text.length > 100 ? "..." : ""),
        courseTitle: selectedCourse?.title,
        courseId,
        subjectName,
        moduleName,
        messages: realMessages,
      });
      loadHistory();
    } catch {
      // Best-effort — a failed history save shouldn't interrupt the chat.
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending || !contextReady) return;

    const userMessage: StoredChatMessage = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);

    try {
      const conversationHistory: AIChatHistoryTurn[] = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));

      const res = await chatWithAI({
        message: text,
        courseContext: selectedCourse
          ? { courseId: selectedCourse._id, courseTitle: selectedCourse.title, program: selectedCourse.program }
          : undefined,
        subjectContext: { subjectName },
        moduleContext: { moduleName },
        conversationHistory,
      });

      if (!res.success) throw new Error(res.message);

      const aiMessage: StoredChatMessage = {
        id: (Date.now() + 1).toString(),
        text: res.data.response,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const finalMessages = [...nextMessages, aiMessage];
      setMessages(finalMessages);
      saveHistory(finalMessages);
    } catch (err) {
      toast({
        title: "SikAI couldn't respond",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const startNewChat = async () => {
    await saveHistory(messages);
    setMessages([WELCOME]);
    setChatId(newChatId());
    setSidebarOpen(false);
  };

  const loadChat = async (id: string) => {
    const res = await getChatHistoryDetail(id);
    if (res.success) {
      setMessages([WELCOME, ...res.data.messages]);
      setChatId(res.data.chatId);
      setSubjectName(res.data.subjectName ?? subjectName);
      setModuleName(res.data.moduleName ?? moduleName);
      setSidebarOpen(false);
    }
  };

  const removeChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteChatHistory(id);
    setHistory((prev) => prev.filter((c) => c.chatId !== id));
    if (id === chatId) startNewChat();
  };

  const historyList = (
    <>
      <div className="flex items-center justify-between border-b border-border p-3">
        <p className="text-sm font-semibold text-foreground">History</p>
        <Button size="sm" variant="outline" onClick={startNewChat}>
          <Plus className="size-3.5" />
          New
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {historyLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">No past conversations yet.</p>
        ) : (
          history.map((c) => (
            <button
              key={c.chatId}
              onClick={() => loadChat(c.chatId)}
              className={cn(
                "group flex w-full items-start justify-between gap-2 rounded-lg p-2.5 text-left transition-colors hover:bg-secondary/60",
                c.chatId === chatId && "bg-secondary"
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{c.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{c.lastMessage}</p>
              </div>
              <Trash2
                className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                onClick={(e) => removeChat(c.chatId, e)}
              />
            </button>
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-4rem)] sm:-mx-6 lg:-mx-8">
      {/* ≥lg: static column. Below lg it renders as a full-screen Sheet
          overlay instead (see below the main column) — as a flex-row
          sibling with `shrink-0` here it would hold its full 288px width
          and squeeze the chat column into a sliver at phone widths rather
          than actually overlaying it. */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card lg:flex">
        {historyList}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen((v) => !v)}>
            <Menu className="size-4" />
          </Button>
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <p className="text-sm font-semibold text-foreground">SikAI Tutor</p>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setSidebarOpen(true)}>
            <History className="size-4" />
          </Button>
        </div>

        {/* Context pickers */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/40 px-4 py-2">
          <Select value={courseId} onValueChange={(v) => { setCourseId(v); setSubjectName(""); setModuleName(""); }}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subjectName} onValueChange={(v) => { setSubjectName(v); setModuleName(""); }} disabled={!courseId}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.name} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={moduleName} onValueChange={setModuleName} disabled={!subjectName}>
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue placeholder="Chapter" />
            </SelectTrigger>
            <SelectContent>
              {modules.map((m) => (
                <SelectItem key={m.name} value={m.name}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                )}
              >
                <LatexText content={msg.text} hasLatex={/\$|\\\(|\\\[/.test(msg.text)} />
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">Thinking...</div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="border-t border-border bg-card p-3"
        >
          {!contextReady && (
            <p className="mb-2 text-xs text-muted-foreground">
              Select a subject and chapter above to start asking questions.
            </p>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask SikAI anything about this chapter..."
              disabled={!contextReady || sending}
            />
            <Button type="submit" size="icon" disabled={!draft.trim() || !contextReady || sending}>
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0 lg:hidden">
          <VisuallyHidden>
            <SheetTitle>Chat history</SheetTitle>
          </VisuallyHidden>
          {historyList}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AIChatPage() {
  return (
    <Suspense fallback={null}>
      <AIChatContent />
    </Suspense>
  );
}
