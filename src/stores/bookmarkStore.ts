import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Mobile's Bookmarks.tsx (158 lines, read in full) is entirely
// AsyncStorage-based — {fileName, fileUri}[] under the 'bookmarks' key,
// zero backend calls — and fileUri there is a local on-device file path
// left over from a downloaded PDF, which has no meaning on web (no local
// filesystem to point at). The closest web equivalent is a bookmark of the
// original remote URL instead of a local path — same "saved for later,
// device-local, no sync across devices" shape as mobile, via localStorage
// instead of AsyncStorage.
export interface BookmarkedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  courseName?: string;
  subjectName?: string;
  bookmarkedAt: string;
}

interface BookmarkState {
  bookmarks: BookmarkedFile[];
  addBookmark: (bookmark: Omit<BookmarkedFile, "id" | "bookmarkedAt">) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (fileUrl: string) => boolean;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: [
            { ...bookmark, id: crypto.randomUUID(), bookmarkedAt: new Date().toISOString() },
            ...state.bookmarks,
          ],
        })),
      removeBookmark: (id) => set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) })),
      isBookmarked: (fileUrl) => get().bookmarks.some((b) => b.fileUrl === fileUrl),
    }),
    {
      name: "noteswift-web-bookmarks",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
