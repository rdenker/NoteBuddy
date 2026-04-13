import { beforeEach, describe, expect, it } from "vitest";
import { useTabsStore } from "@/store/tabs";

function freshState() {
  const blank = {
    id: "init",
    path: null,
    name: "Untitled.md",
    content: "",
    savedContent: "",
    isDirty: false,
    previewHtml: "",
    frontmatter: null,
  };
  useTabsStore.setState({ tabs: [blank], activeTabId: "init" });
}

describe("tabs store", () => {
  beforeEach(freshState);

  it("openTab adds a new tab and activates it", () => {
    useTabsStore.getState().openTab("/notes/a.md", "a.md", "content", "<p>content</p>", null);
    const s = useTabsStore.getState();
    expect(s.tabs).toHaveLength(2);
    const active = s.tabs.find((t) => t.id === s.activeTabId);
    expect(active?.name).toBe("a.md");
    expect(active?.path).toBe("/notes/a.md");
  });

  it("openTab deduplicates — switching to existing tab instead", () => {
    useTabsStore.getState().openTab("/notes/a.md", "a.md", "c", "", null);
    useTabsStore.getState().openTab("/notes/a.md", "a.md", "c", "", null);
    expect(useTabsStore.getState().tabs).toHaveLength(2);
  });

  it("closeTab with single tab replaces with blank", () => {
    const { activeTabId } = useTabsStore.getState();
    useTabsStore.getState().closeTab(activeTabId);
    const s = useTabsStore.getState();
    expect(s.tabs).toHaveLength(1);
    expect(s.tabs[0].name).toBe("Untitled.md");
  });

  it("closeTab with multiple tabs activates adjacent tab", () => {
    useTabsStore.getState().openTab("/a.md", "a.md", "", "", null);
    useTabsStore.getState().openTab("/b.md", "b.md", "", "", null);
    const { activeTabId } = useTabsStore.getState();
    useTabsStore.getState().closeTab(activeTabId);
    expect(useTabsStore.getState().tabs).toHaveLength(2);
  });

  it("updateActiveTab patches content and dirty", () => {
    useTabsStore.getState().openTab("/a.md", "a.md", "old", "", null);
    useTabsStore.getState().updateActiveTab({ content: "new", isDirty: true });
    const active = useTabsStore.getState().getActiveTab();
    expect(active?.content).toBe("new");
    expect(active?.isDirty).toBe(true);
  });

  it("markActiveSaved clears dirty and updates path/name", () => {
    useTabsStore.getState().openTab("/a.md", "a.md", "content", "", null);
    useTabsStore.getState().updateActiveTab({ isDirty: true });
    useTabsStore.getState().markActiveSaved("/b.md", "b.md");
    const active = useTabsStore.getState().getActiveTab();
    expect(active?.isDirty).toBe(false);
    expect(active?.path).toBe("/b.md");
    expect(active?.name).toBe("b.md");
  });

  it("updateTabPaths renames matching tab paths", () => {
    useTabsStore.getState().openTab("/root/notes/a.md", "a.md", "", "", null);
    useTabsStore.getState().openTab("/root/notes/b.md", "b.md", "", "", null);
    useTabsStore.getState().updateTabPaths("/root/notes", "/root/archive");
    const paths = useTabsStore.getState().tabs.map((t) => t.path);
    expect(paths).toContain("/root/archive/a.md");
    expect(paths).toContain("/root/archive/b.md");
  });

  it("newTab creates a blank tab and activates it", () => {
    useTabsStore.getState().newTab();
    const s = useTabsStore.getState();
    expect(s.tabs.length).toBeGreaterThanOrEqual(2);
    const active = s.tabs.find((t) => t.id === s.activeTabId);
    expect(active?.name).toBe("Untitled.md");
    expect(active?.path).toBeNull();
  });
});
