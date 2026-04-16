import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStore } from "@/store/editor";

describe("editor store", () => {
  beforeEach(() => {
    useEditorStore.setState({
      currentFilePath: null,
      currentFileName: null,
      content: "",
      savedContent: "",
      isDirty: false,
      previewHtml: "",
      isPreviewVisible: true,
      rootDir: null,
      fileTree: [],
      activePanel: "split",
      vimModeLabel: null,
      frontmatter: null,
      activeTagFilter: null,
      activeDateFrom: null,
      activeDateTo: null,
    });
  });

  it("setContent marks dirty when content differs from savedContent", () => {
    useEditorStore.getState().setContent("hello");
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it("markSaved clears dirty flag and syncs savedContent", () => {
    useEditorStore.getState().setContent("hello");
    useEditorStore.getState().markSaved();
    expect(useEditorStore.getState().isDirty).toBe(false);
    expect(useEditorStore.getState().savedContent).toBe("hello");
  });

  it("setContent not dirty when matches savedContent", () => {
    useEditorStore.setState({ savedContent: "same" });
    useEditorStore.getState().setContent("same");
    expect(useEditorStore.getState().isDirty).toBe(false);
  });

  it("newFile resets state", () => {
    useEditorStore.setState({ content: "foo", isDirty: true, currentFilePath: "/foo.md" });
    useEditorStore.getState().newFile();
    const s = useEditorStore.getState();
    expect(s.content).toBe("");
    expect(s.isDirty).toBe(false);
    expect(s.currentFilePath).toBeNull();
    expect(s.currentFileName).toBe("Untitled.md");
  });

  it("setActivePanel updates panel", () => {
    useEditorStore.getState().setActivePanel("editor");
    expect(useEditorStore.getState().activePanel).toBe("editor");
  });

  it("setVimModeLabel stores mode", () => {
    useEditorStore.getState().setVimModeLabel("INSERT");
    expect(useEditorStore.getState().vimModeLabel).toBe("INSERT");
  });

  it("setActiveTagFilter stores tag", () => {
    useEditorStore.getState().setActiveTagFilter("rust");
    expect(useEditorStore.getState().activeTagFilter).toBe("rust");
    useEditorStore.getState().setActiveTagFilter(null);
    expect(useEditorStore.getState().activeTagFilter).toBeNull();
  });

  it("setActiveDateFrom and setActiveDateTo store dates", () => {
    useEditorStore.getState().setActiveDateFrom("2026-01-01");
    useEditorStore.getState().setActiveDateTo("2026-12-31");
    const s = useEditorStore.getState();
    expect(s.activeDateFrom).toBe("2026-01-01");
    expect(s.activeDateTo).toBe("2026-12-31");
  });
});
