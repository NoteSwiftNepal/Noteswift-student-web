"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ExternalLink, FileText, ImagePlus, Paperclip, RotateCw, Send, WifiOff } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useDirectChatSocket, validateChatDocumentPick, validateChatImagePick } from "@/hooks/useDirectChatSocket";
import { useDirectChatStore } from "@/stores/directChatStore";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DirectChatMessage } from "@/types/direct-chat";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function AttachmentPreview({ attachment }: { attachment: NonNullable<DirectChatMessage["attachment"]> }) {
  if (attachment.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={attachment.url} alt="Attachment" className="mb-1 max-h-56 rounded-lg object-cover" />
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="mb-1 flex items-center gap-2 rounded-lg bg-black/10 px-2.5 py-2 text-inherit"
    >
      <FileText className="size-4 shrink-0" />
      <span className="truncate text-xs font-medium">{attachment.filename || "Document"}</span>
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}

function MessageBubble({
  msg,
  isMine,
  onRetrySend,
  onRetryUpload,
}: {
  msg: DirectChatMessage;
  isMine: boolean;
  onRetrySend: (clientMessageId: string) => void;
  onRetryUpload: (clientMessageId: string) => void;
}) {
  return (
    <div className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-1.5 text-sm",
          isMine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
          (msg.status === "uploading" || msg.status === "pending") && "opacity-70"
        )}
      >
        {msg.attachment && <AttachmentPreview attachment={msg.attachment} />}
        {msg.message}
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
        {msg.status === "uploading" && <span>Uploading...</span>}
        {msg.status === "pending" && <span>Sending...</span>}
        {msg.status === "sent" && <span>{formatTime(msg.createdAt)}</span>}
        {msg.status === "failed" && msg.clientMessageId && (
          <button
            type="button"
            onClick={() => onRetrySend(msg.clientMessageId!)}
            className="flex items-center gap-1 font-medium text-destructive hover:underline"
          >
            <RotateCw className="size-2.5" />
            {msg.failureKind === "permanent" ? msg.failureMessage || "Couldn't send" : "Failed — tap to retry"}
          </button>
        )}
        {msg.status === "failed-upload" && msg.clientMessageId && (
          <button
            type="button"
            onClick={() => onRetryUpload(msg.clientMessageId!)}
            className="flex items-center gap-1 font-medium text-destructive hover:underline"
          >
            <RotateCw className="size-2.5" />
            Upload failed — tap to retry
          </button>
        )}
      </div>
    </div>
  );
}

function ChatThreadContent() {
  const params = useParams<{ teacherId: string; subjectName: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const subjectName = decodeURIComponent(params.subjectName);
  const teacherId = params.teacherId;
  const courseId = searchParams.get("courseId") || "";
  const teacherName = searchParams.get("teacherName") || "Teacher";
  const courseName = searchParams.get("courseName") || "";

  const [draft, setDraft] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const {
    connectionState,
    joinConversation,
    loadEarlierMessages,
    sendMessage,
    retryMessage,
    sendImage,
    sendDocument,
    retryFailedUpload,
    markRead,
  } = useDirectChatSocket(user?.id, accessToken);

  const messages = useDirectChatStore((s) => s.messagesFor(teacherId, subjectName));
  const hasMoreHistory = useDirectChatStore((s) => s.hasMoreHistoryFor(teacherId, subjectName));

  // Explicit join for THIS specific conversation — the socket hook's own
  // reconnect-rejoin loop only rejoins conversations already in the REST
  // conversation list, which wouldn't include a brand-new one the student
  // has never messaged before. Runs whenever the connection (re)establishes.
  useEffect(() => {
    if (connectionState !== "connected" || !courseId) return;
    let cancelled = false;
    setLoadingHistory(true);
    joinConversation(teacherId, courseId, subjectName).then(() => {
      if (!cancelled) setLoadingHistory(false);
    });
    return () => {
      cancelled = true;
    };
  }, [connectionState, teacherId, courseId, subjectName, joinConversation]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Mark-read effect: gated on the connection actually being connected (the
  // hook's own markRead already checks this before touching local state —
  // see its comment for the bug this ordering fixes), with connectionState
  // as a dependency so a reconnect naturally re-evaluates and retries for
  // any message still (genuinely) unread, rather than only ever firing once
  // per mount.
  useEffect(() => {
    if (connectionState !== "connected") return;
    const hasUnreadFromTeacher = messages.some((m) => m.senderType === "teacher" && !m.isRead);
    if (hasUnreadFromTeacher) {
      markRead(teacherId, subjectName);
    }
  }, [connectionState, messages, teacherId, subjectName, markRead]);

  const handleLoadEarlier = useCallback(async () => {
    if (loadingEarlier || !hasMoreHistory) return;
    setLoadingEarlier(true);
    const container = listRef.current;
    const prevHeight = container?.scrollHeight ?? 0;
    await loadEarlierMessages(teacherId, subjectName);
    // Preserve scroll position — prepending older messages above the
    // viewport would otherwise yank the view down/up as content is added.
    requestAnimationFrame(() => {
      if (container) container.scrollTop = container.scrollHeight - prevHeight;
    });
    setLoadingEarlier(false);
  }, [loadingEarlier, hasMoreHistory, loadEarlierMessages, teacherId, subjectName]);

  const handleScroll = () => {
    if (listRef.current && listRef.current.scrollTop < 80) {
      handleLoadEarlier();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !courseId) return;
    setDraft("");
    sendMessage(teacherId, subjectName, courseId, text);
  };

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !courseId) return;
    const check = validateChatImagePick(file);
    if (!check.ok) {
      toast({ title: "Can't send this image", description: check.message, variant: "destructive" });
      return;
    }
    sendImage(teacherId, subjectName, courseId, file, "");
  };

  const handlePickDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !courseId) return;
    const check = validateChatDocumentPick(file);
    if (!check.ok) {
      toast({ title: "Can't send this document", description: check.message, variant: "destructive" });
      return;
    }
    sendDocument(teacherId, subjectName, courseId, file, "");
  };

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-4rem)] flex-col sm:-mx-6 lg:-mx-8">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {teacherName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{teacherName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {subjectName} {courseName && `· ${courseName}`}
          </p>
        </div>
      </div>

      {connectionState !== "connected" && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-2 text-xs text-muted-foreground">
          <WifiOff className="size-3.5" />
          {connectionState === "connecting" ? "Connecting..." : "Reconnecting..."}
        </div>
      )}

      <div ref={listRef} onScroll={handleScroll} className="flex-1 space-y-2 overflow-y-auto p-4">
        {loadingEarlier && (
          <div className="flex justify-center py-2">
            <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {loadingHistory ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="ml-auto h-10 w-2/3" />
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={msg.senderType === "student"}
              onRetrySend={(clientMessageId) => retryMessage(teacherId, subjectName, courseId, clientMessageId)}
              onRetryUpload={(clientMessageId) => retryFailedUpload(teacherId, subjectName, courseId, clientMessageId)}
            />
          ))
        ) : (
          <p className="pt-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to {teacherName}!
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border bg-card p-3">
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={handlePickImage} />
        <input ref={documentInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePickDocument} />
        <Button type="button" variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()} title="Send an image">
          <ImagePlus className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => documentInputRef.current?.click()} title="Send a document">
          <Paperclip className="size-4" />
        </Button>
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." />
        <Button type="submit" size="icon" disabled={!draft.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

export default function ChatThreadPage() {
  return (
    <Suspense fallback={null}>
      <ChatThreadContent />
    </Suspense>
  );
}
