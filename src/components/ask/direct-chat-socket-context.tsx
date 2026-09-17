"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useDirectChatSocket } from "@/hooks/useDirectChatSocket";

type DirectChatSocketValue = ReturnType<typeof useDirectChatSocket>;

const DirectChatSocketContext = createContext<DirectChatSocketValue | null>(null);

// One socket connection for the whole /ask/chat route segment — mounted
// once by ask/chat/layout.tsx (the persistent two-pane shell), consumed by
// both the "select a conversation" empty state and the thread page.
// useDirectChatSocket itself connects on mount / disconnects on unmount
// (see its own header comment); before the two-pane layout existed, the
// list page and the thread page were two separate full-page routes that
// EACH called this hook independently, so navigating from the list to a
// thread tore down one socket and opened a brand new one on every click.
// Lifting the one call up here means the connection now persists across
// that navigation, the same way the left panel itself does.
export function DirectChatSocketProvider({ children }: { children: ReactNode }) {
  const userId = useAuthStore((s) => s.user?.id);
  const accessToken = useAuthStore((s) => s.accessToken);
  const value = useDirectChatSocket(userId, accessToken);
  return <DirectChatSocketContext.Provider value={value}>{children}</DirectChatSocketContext.Provider>;
}

export function useDirectChatSocketContext(): DirectChatSocketValue {
  const ctx = useContext(DirectChatSocketContext);
  if (!ctx) {
    throw new Error("useDirectChatSocketContext must be used within DirectChatSocketProvider (ask/chat/layout.tsx)");
  }
  return ctx;
}
