import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Sidebar collapse-to-icons toggle — a genuine web adaptation with no
// mobile equivalent (mobile has no persistent sidebar at all). Persisted
// per-browser so the choice survives a reload; read by both SidebarNav
// (which renders the collapsed/expanded rail) and AppShell (which has to
// offset the main content by the same width).
interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "noteswift-web-ui",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
