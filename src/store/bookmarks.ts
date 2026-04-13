import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Bookmark {
  path: string;
  name: string;
}

interface BookmarksState {
  bookmarks: Bookmark[];
  addBookmark: (path: string, name: string) => void;
  removeBookmark: (path: string) => void;
  isBookmarked: (path: string) => boolean;
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (path, name) =>
        set((s) => ({
          bookmarks: s.bookmarks.some((b) => b.path === path)
            ? s.bookmarks
            : [...s.bookmarks, { path, name }],
        })),

      removeBookmark: (path) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.path !== path) })),

      isBookmarked: (path) => get().bookmarks.some((b) => b.path === path),
    }),
    { name: "md-editor-bookmarks" }
  )
);
