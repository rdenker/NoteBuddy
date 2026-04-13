import { create } from "zustand";

export type DropPosition = "into" | "before" | "after" | "root" | null;

interface DragState {
  dragging: { path: string; name: string; isDir: boolean } | null;
  overPath: string | null;
  dropPosition: DropPosition;
  cursorX: number;
  cursorY: number;
  startDrag: (path: string, name: string, isDir: boolean) => void;
  setOver: (path: string | null, pos: DropPosition, x: number, y: number) => void;
  endDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  dragging: null,
  overPath: null,
  dropPosition: null,
  cursorX: 0,
  cursorY: 0,
  startDrag: (path, name, isDir) =>
    set({ dragging: { path, name, isDir }, overPath: null, dropPosition: null }),
  setOver: (overPath, dropPosition, x, y) =>
    set({ overPath, dropPosition, cursorX: x, cursorY: y }),
  endDrag: () =>
    set({ dragging: null, overPath: null, dropPosition: null, cursorX: 0, cursorY: 0 }),
}));
