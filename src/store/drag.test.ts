import { beforeEach, describe, expect, it } from "vitest";
import { useDragStore } from "@/store/drag";

beforeEach(() => {
  useDragStore.setState({
    dragging: null,
    overPath: null,
    dropPosition: null,
    cursorX: 0,
    cursorY: 0,
  });
});

describe("drag store", () => {
  it("starts with no drag state", () => {
    const s = useDragStore.getState();
    expect(s.dragging).toBeNull();
    expect(s.overPath).toBeNull();
    expect(s.dropPosition).toBeNull();
  });

  it("startDrag sets dragging and clears over/position", () => {
    useDragStore.getState().setOver("/some/path", "into", 100, 200);
    useDragStore.getState().startDrag("/notes/a.md", "a.md", false);
    const s = useDragStore.getState();
    expect(s.dragging).toEqual({ path: "/notes/a.md", name: "a.md", isDir: false });
    expect(s.overPath).toBeNull();
    expect(s.dropPosition).toBeNull();
  });

  it("startDrag preserves isDir=true for folders", () => {
    useDragStore.getState().startDrag("/notes/folder", "folder", true);
    expect(useDragStore.getState().dragging?.isDir).toBe(true);
  });

  it("setOver updates overPath, dropPosition and cursor", () => {
    useDragStore.getState().startDrag("/a.md", "a.md", false);
    useDragStore.getState().setOver("/target", "before", 50, 75);
    const s = useDragStore.getState();
    expect(s.overPath).toBe("/target");
    expect(s.dropPosition).toBe("before");
    expect(s.cursorX).toBe(50);
    expect(s.cursorY).toBe(75);
  });

  it("setOver accepts all DropPosition values", () => {
    for (const pos of ["into", "before", "after", "root", null] as const) {
      useDragStore.getState().setOver("/p", pos, 0, 0);
      expect(useDragStore.getState().dropPosition).toBe(pos);
    }
  });

  it("endDrag resets all state to initial", () => {
    useDragStore.getState().startDrag("/a.md", "a.md", false);
    useDragStore.getState().setOver("/b", "into", 10, 20);
    useDragStore.getState().endDrag();
    const s = useDragStore.getState();
    expect(s.dragging).toBeNull();
    expect(s.overPath).toBeNull();
    expect(s.dropPosition).toBeNull();
    expect(s.cursorX).toBe(0);
    expect(s.cursorY).toBe(0);
  });
});
