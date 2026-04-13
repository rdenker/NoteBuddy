import { create } from "zustand";
import type { Frontmatter } from "@/lib/frontmatter";

export interface Tab {
  id: string;
  path: string | null;
  name: string;
  content: string;
  savedContent: string;
  isDirty: boolean;
  previewHtml: string;
  frontmatter: Frontmatter | null;
}

function makeTab(overrides?: Partial<Tab>): Tab {
  return {
    id: crypto.randomUUID(),
    path: null,
    name: "Untitled.md",
    content: "",
    savedContent: "",
    isDirty: false,
    previewHtml: "",
    frontmatter: null,
    ...overrides,
  };
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string;

  openTab: (
    path: string,
    name: string,
    content: string,
    previewHtml: string,
    frontmatter: Frontmatter | null
  ) => void;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  updateActiveTab: (
    patch: Partial<Pick<Tab, "content" | "isDirty" | "previewHtml" | "frontmatter">>
  ) => void;
  markActiveSaved: (path: string, name: string) => void;
  newTab: () => void;
  getActiveTab: () => Tab | undefined;
  updateTabPaths: (oldPrefix: string, newPrefix: string) => void;
}

const initialTab = makeTab();

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [initialTab],
  activeTabId: initialTab.id,

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId);
  },

  openTab: (path, name, content, previewHtml, frontmatter) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.path === path);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const tab = makeTab({ path, name, content, savedContent: content, previewHtml, frontmatter });
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    if (tabs.length === 1) {
      const blank = makeTab();
      set({ tabs: [blank], activeTabId: blank.id });
      return;
    }
    const idx = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    let newActiveId = activeTabId;
    if (activeTabId === id) {
      newActiveId = (newTabs[idx] ?? newTabs[idx - 1])?.id;
    }
    set({ tabs: newTabs, activeTabId: newActiveId });
  },

  switchTab: (id) => set({ activeTabId: id }),

  updateActiveTab: (patch) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === s.activeTabId ? { ...t, ...patch } : t)),
    }));
  },

  markActiveSaved: (path, name) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === s.activeTabId ? { ...t, path, name, savedContent: t.content, isDirty: false } : t
      ),
    }));
  },

  newTab: () => {
    const tab = makeTab();
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
  },

  updateTabPaths: (oldPrefix, newPrefix) => {
    set((s) => ({
      tabs: s.tabs.map((t) => {
        if (!t.path) return t;
        if (t.path === oldPrefix || t.path.startsWith(`${oldPrefix}/`)) {
          const newPath = newPrefix + t.path.slice(oldPrefix.length);
          return { ...t, path: newPath, name: newPath.split("/").pop() ?? t.name };
        }
        return t;
      }),
    }));
  },
}));
