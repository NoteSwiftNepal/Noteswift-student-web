import { MessagesSquare } from "lucide-react";

// Right pane's default content when no thread is open (desktop only — the
// two-pane shell lives in this segment's layout.tsx, which shows the
// conversation list full-screen instead of this on mobile, since there's
// no room for both panes at once there).
export default function ConversationsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
      <MessagesSquare className="size-10" />
      <p className="text-body-sm">Select a conversation to start chatting.</p>
    </div>
  );
}
