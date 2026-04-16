import { create } from "zustand";
import type { FileEntry } from "@/lib/commands";
import type { Frontmatter } from "@/lib/frontmatter";

interface EditorState {
  currentFilePath: string | null;
  currentFileName: string | null;
  content: string;
  savedContent: string;
  isDirty: boolean;
  previewHtml: string;
  isPreviewVisible: boolean;
  rootDir: string | null;
  fileTree: FileEntry[];
  activePanel: "editor" | "split" | "preview";
  vimModeLabel: string | null;
  frontmatter: Frontmatter | null;
  activeTagFilter: string | null;
  activeDateFrom: string | null;
  activeDateTo: string | null;

  setCurrentFile: (path: string, name: string) => void;
  setContent: (content: string) => void;
  markSaved: () => void;
  setPreviewHtml: (html: string) => void;
  togglePreview: () => void;
  setRootDir: (dir: string) => void;
  setFileTree: (tree: FileEntry[]) => void;
  setActivePanel: (panel: "editor" | "split" | "preview") => void;
  setVimModeLabel: (mode: string | null) => void;
  setFrontmatter: (fm: Frontmatter | null) => void;
  setActiveTagFilter: (tag: string | null) => void;
  setActiveDateFrom: (date: string | null) => void;
  setActiveDateTo: (date: string | null) => void;
  newFile: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
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

  setCurrentFile: (path, name) => set({ currentFilePath: path, currentFileName: name }),

  setContent: (content) => set((state) => ({ content, isDirty: content !== state.savedContent })),

  markSaved: () => set((state) => ({ savedContent: state.content, isDirty: false })),

  setPreviewHtml: (html) => set({ previewHtml: html }),

  togglePreview: () => set((state) => ({ isPreviewVisible: !state.isPreviewVisible })),

  setRootDir: (dir) => set({ rootDir: dir }),

  setFileTree: (tree) => set({ fileTree: tree }),

  setActivePanel: (panel) => set({ activePanel: panel }),

  setVimModeLabel: (vimModeLabel) => set({ vimModeLabel }),

  setFrontmatter: (fm) => set({ frontmatter: fm }),

  setActiveTagFilter: (tag) => set({ activeTagFilter: tag }),
  setActiveDateFrom: (date) => set({ activeDateFrom: date }),
  setActiveDateTo: (date) => set({ activeDateTo: date }),

  newFile: () =>
    set({
      currentFilePath: null,
      currentFileName: "Untitled.md",
      content: "",
      savedContent: "",
      isDirty: false,
      previewHtml: "",
      vimModeLabel: null,
      frontmatter: null,
    }),
}));
