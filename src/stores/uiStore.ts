import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 360;
export const SIDEBAR_DEFAULT_WIDTH = 256; // matches the old static w-64

// Sidebar collapse-to-icons toggle and drag-resizable width — genuine web
// adaptations with no mobile equivalent (mobile has no persistent sidebar
// at all). Both persisted per-browser so the choice survives a reload; read
// by both SidebarNav (which renders the rail) and AppShell (which has to
// offset the main content by the same width).
interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  // Transient, deliberately NOT persisted (see `partialize` below) — lets
  // the sidebar's own drag handle and AppShell's content-offset share one
  // "a drag is live right now" flag, so both can skip their width
  // transition while dragging (which would otherwise lag a pointer-tracked
  // resize behind its own animation) and still animate smoothly for a
  // deliberate collapse/expand click.
  sidebarDragging: boolean;
  setSidebarDragging: (dragging: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
      // Clamped here, at the single source of truth, not just in the drag
      // handler that happens to call it today — any future caller gets the
      // same min/max guarantee for free.
      setSidebarWidth: (width) =>
        set({ sidebarWidth: Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width)) }),
      sidebarDragging: false,
      setSidebarDragging: (dragging) => set({ sidebarDragging: dragging }),
    }),
    {
      name: "noteswift-web-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, sidebarWidth: s.sidebarWidth }),
    }
  )
);
