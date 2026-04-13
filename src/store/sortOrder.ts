import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SortOrderState {
  order: Record<string, string[]>;
  setOrder: (dirPath: string, paths: string[]) => void;
  getOrder: (dirPath: string) => string[] | null;
  clearDir: (dirPath: string) => void;
  moveItem: (
    dirPath: string,
    srcPath: string,
    targetPath: string,
    position: "before" | "after"
  ) => void;
}

export const useSortOrderStore = create<SortOrderState>()(
  persist(
    (set, get) => ({
      order: {},

      setOrder: (dirPath, paths) => set((s) => ({ order: { ...s.order, [dirPath]: paths } })),

      getOrder: (dirPath) => get().order[dirPath] ?? null,

      clearDir: (dirPath) =>
        set((s) => {
          const next = { ...s.order };
          delete next[dirPath];
          return { order: next };
        }),

      moveItem: (dirPath, srcPath, targetPath, position) => {
        set((s) => {
          const current = s.order[dirPath] ?? [];
          const without = current.filter((p) => p !== srcPath);
          const targetIdx = without.indexOf(targetPath);
          if (targetIdx === -1) return s;
          const insertAt = position === "before" ? targetIdx : targetIdx + 1;
          const next = [...without];
          next.splice(insertAt, 0, srcPath);
          return { order: { ...s.order, [dirPath]: next } };
        });
      },
    }),
    { name: "md-editor-sort-order" }
  )
);
