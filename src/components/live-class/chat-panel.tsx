"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Hand, Pencil, Pin, Send, Trash2, Wifi, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatConnectionState, DeleteMessageAck, EditMessageAck } from "@/hooks/useLiveClassSocket";
import type { ChatMessage, RaisedHand } from "@/types/live-class";
import { cn } from "@/lib/utils";

function connectionLabel(state: ChatConnectionState): string {
  switch (state) {
    case "connecting":
      return "Connecting to chat...";
    case "joining":
      return "Joining classroom...";
    case "disconnected":
      return "Reconnecting...";
    case "failed":
      return "Couldn't connect to chat";
    default:
      return "";
  }
}

function MessageBubble({
  msg,
  isMine,
  onEdit,
  onDelete,
}: {
  msg: ChatMessage;
  isMine: boolean;
  onEdit: (messageId: string, message: string) => Promise<EditMessageAck>;
  onDelete: (messageId: string) => Promise<DeleteMessageAck>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(msg.message);
  const [busy, setBusy] = useState(false);

  const handleSaveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === msg.message) {
      setEditing(false);
      return;
    }
    setBusy(true);
    const ack = await onEdit(msg.id, trimmed);
    setBusy(false);
    if (ack.ok) setEditing(false);
  };

  const handleDelete = async () => {
    setBusy(true);
    await onDelete(msg.id);
    setBusy(false);
  };

  return (
    <div className={cn("group flex flex-col", isMine ? "items-end" : "items-start")}>
      {!isMine && <span className="px-1 text-[11px] font-medium text-muted-foreground">{msg.senderName}</span>}
      {msg.pinned && (
        <span className="mb-0.5 flex items-center gap-1 px-1 text-[10px] font-medium text-amber-600">
          <Pin className="size-2.5 fill-amber-600" />
          Pinned
        </span>
      )}
      <div className="flex items-center gap-1">
        {isMine && !editing && (
          <div className="hidden items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-hover:flex">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Edit message"
            >
              <Pencil className="size-3" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Delete message"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )}
        {editing ? (
          <div className="flex max-w-[85%] items-center gap-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={busy}
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-green-600 hover:bg-green-500/10"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-1.5 text-sm",
              isMine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            )}
          >
            {msg.message}
            {msg.editedAt && <span className="ml-1.5 text-[10px] opacity-70">(edited)</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatPanel({
  studentId,
  messages,
  raisedHands,
  typingUserIds = [],
  connectionState,
  onSend,
  onEdit,
  onDelete,
  onTyping,
}: {
  studentId: string | undefined;
  messages: ChatMessage[];
  raisedHands: RaisedHand[];
  typingUserIds?: string[];
  connectionState: ChatConnectionState;
  onSend: (text: string) => Promise<{ ok: boolean; reason?: string }>;
  onEdit: (messageId: string, message: string) => Promise<EditMessageAck>;
  onDelete: (messageId: string) => Promise<DeleteMessageAck>;
  onTyping: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    const ack = await onSend(text);
    setSending(false);
    if (!ack.ok) {
      setDraft(text);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {connectionState !== "connected" && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary px-3 py-2 text-xs text-muted-foreground">
          {connectionState === "failed" ? (
            <WifiOff className="size-3.5" />
          ) : (
            <Wifi className="size-3.5 animate-pulse" />
          )}
          {connectionLabel(connectionState)}
        </div>
      )}

      {raisedHands.length > 0 && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-3 py-2 text-xs text-foreground">
          <Hand className="size-3.5 text-primary" />
          <span className="truncate">
            {raisedHands.map((h) => h.userName).join(", ")} raised{" "}
            {raisedHands.length === 1 ? "a hand" : "hands"}
          </span>
        </div>
      )}

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="pt-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isMine={msg.senderId === studentId} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>

      {typingUserIds.length > 0 && (
        <p className="px-3 pb-1 text-xs italic text-muted-foreground">
          {typingUserIds.length === 1 ? "Someone is typing..." : `${typingUserIds.length} people are typing...`}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            onTyping();
          }}
          placeholder="Type a message..."
          disabled={connectionState !== "connected"}
        />
        <Button type="submit" size="icon" disabled={!draft.trim() || sending || connectionState !== "connected"}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
