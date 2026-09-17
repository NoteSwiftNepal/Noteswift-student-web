// Pure, framework-agnostic live-class chat merge logic — mirrors
// src/lib/directChat.ts's mergeIncomingMessage/mergeSyncedMessages pattern,
// which itself ports mobile's lib/liveClassChat.ts. Needed so a reconnect
// (the socket briefly drops and socket.io-client auto-reconnects, which
// still fires 'connect' but WITHOUT tearing down and remounting the whole
// page) can catch up on whatever was broadcast while disconnected via
// chatHandler.ts's sync-messages, the same recovery path mobile's
// LiveClassOverlay.tsx and the teacher web app's LiveRoomContext.tsx both
// already run on every 'connect' — this hook previously relied solely on
// 'previous-messages' (only sent once, on the join that happens as part of
// the very first connect), so any reconnect thereafter had no way to fetch
// what was missed short of a full page navigation away and back.
import type { ChatMessage } from "@/types/live-class";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// Same id-based upsert used for both a single live broadcast (receive-
// message) and each entry of a sync-messages/previous-messages batch —
// already-known id gets replaced in place (picks up an edit/pin change that
// arrived via sync rather than its own live broadcast), unknown id gets
// appended.
export function mergeIncomingMessage(list: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const idx = list.findIndex((m) => m.id === incoming.id);
  if (idx !== -1) {
    const next = list.slice();
    next[idx] = incoming;
    return next;
  }
  return [...list, incoming];
}

export function mergeSyncedMessages(
  list: ChatMessage[],
  synced: ChatMessage[],
  deletedMessageIds: string[] = []
): ChatMessage[] {
  let next = synced.reduce((acc, m) => mergeIncomingMessage(acc, m), list);
  if (deletedMessageIds.length > 0) {
    const deleted = new Set(deletedMessageIds);
    next = next.filter((m) => !deleted.has(m.id));
  }
  return next;
}

// The cursor sync-messages needs: the newest message id this client already
// has. Mongo ObjectIds sort lexicographically in chronological order, same
// as directChat.ts's latestConfirmedMessageId.
export function latestConfirmedMessageId(list: ChatMessage[]): string | null {
  let latest: string | null = null;
  for (const m of list) {
    if (!OBJECT_ID_RE.test(m.id)) continue;
    if (latest === null || m.id > latest) latest = m.id;
  }
  return latest;
}
