import { beforeEach, describe, expect, it } from "vitest";
import { useCustomIconsStore } from "@/store/customIcons";

beforeEach(() => {
  localStorage.clear();
  useCustomIconsStore.setState({ icons: {} });
});

describe("customIcons store", () => {
  it("setIcon stores an icon for a path", () => {
    useCustomIconsStore.getState().setIcon("/notes/a.md", "Star");
    expect(useCustomIconsStore.getState().getIcon("/notes/a.md")).toBe("Star");
  });

  it("setIcon overwrites existing icon", () => {
    useCustomIconsStore.getState().setIcon("/notes/a.md", "Star");
    useCustomIconsStore.getState().setIcon("/notes/a.md", "Heart");
    expect(useCustomIconsStore.getState().getIcon("/notes/a.md")).toBe("Heart");
  });

  it("removeIcon deletes the entry", () => {
    useCustomIconsStore.getState().setIcon("/notes/a.md", "Star");
    useCustomIconsStore.getState().removeIcon("/notes/a.md");
    expect(useCustomIconsStore.getState().getIcon("/notes/a.md")).toBeUndefined();
  });

  it("getIcon returns undefined for unknown path", () => {
    expect(useCustomIconsStore.getState().getIcon("/unknown.md")).toBeUndefined();
  });
});
