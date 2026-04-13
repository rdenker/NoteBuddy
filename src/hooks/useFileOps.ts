import type { UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useRef } from "react";
import {
  onFileChanged,
  openFileDialog,
  parseMarkdown,
  readFile,
  saveFileDialog,
  watchFile,
  writeFile,
} from "@/lib/commands";
import { parseFrontmatter } from "@/lib/frontmatter";
import { useEditorStore } from "@/store/editor";
import { useSettingsStore } from "@/store/settings";
import { useTabsStore } from "@/store/tabs";

export function useFileOps() {
  const unlistenRefs = useRef<Map<string, UnlistenFn>>(new Map());

  const computePreview = useCallback(async (content: string) => {
    const { frontmatter, body } = parseFrontmatter(content);
    const processed = body.replace(/\[\[([^\]]+)\]\]/g, (_, name: string) => {
      const encoded = encodeURIComponent(name.trim());
      return `[${name.trim()}](wikilink://${encoded})`;
    });
    const html = await parseMarkdown(processed);
    return { html, frontmatter };
  }, []);

  const syncTabToEditor = useCallback((tabId?: string) => {
    const { tabs, activeTabId } = useTabsStore.getState();
    const tab = tabs.find((t) => t.id === (tabId ?? activeTabId));
    if (!tab) return;
    const store = useEditorStore.getState();
    store.setCurrentFile(tab.path ?? "", tab.name);
    store.setContent(tab.content);
    store.setPreviewHtml(tab.previewHtml);
    store.setFrontmatter(tab.frontmatter);
    if (!tab.isDirty) store.markSaved();
  }, []);

  const openFile = useCallback(
    async (filePath?: string) => {
      const path = filePath ?? (await openFileDialog());
      if (!path) return;

      const existing = useTabsStore.getState().tabs.find((t) => t.path === path);
      if (existing) {
        useTabsStore.getState().switchTab(existing.id);
        syncTabToEditor(existing.id);
        return;
      }

      const content = await readFile(path);
      const name = path.split("/").pop() ?? "file.md";

      try {
        const { html, frontmatter } = await computePreview(content);
        useTabsStore.getState().openTab(path, name, content, html, frontmatter);
        syncTabToEditor();
        useSettingsStore.getState().setLastFilePath(path);

        await watchFile(path);
        const unlisten = await onFileChanged(async (changedPath) => {
          if (changedPath !== path) return;
          try {
            const activeTab = useTabsStore.getState().getActiveTab();
            if (activeTab?.path === path && !activeTab.isDirty) {
              const updated = await readFile(path);
              const { html: newHtml, frontmatter: newFm } = await computePreview(updated);
              useTabsStore
                .getState()
                .updateActiveTab({ content: updated, previewHtml: newHtml, frontmatter: newFm });
              syncTabToEditor();
            }
          } catch (_e) {
            return;
          }
        });
        unlistenRefs.current.set(path, unlisten);
      } catch {
        useEditorStore.getState().setPreviewHtml("<p style='color:red'>Preview error</p>");
      }
    },
    [computePreview, syncTabToEditor]
  );

  const saveFile = useCallback(async () => {
    const tab = useTabsStore.getState().getActiveTab();
    if (!tab) return;
    const path = tab.path ?? (await saveFileDialog(null));
    if (!path) return;
    await writeFile(path, tab.content);
    const name = path.split("/").pop() ?? "file.md";
    useTabsStore.getState().markActiveSaved(path, name);
    const store = useEditorStore.getState();
    store.setCurrentFile(path, name);
    store.markSaved();
  }, []);

  const saveFileAs = useCallback(async () => {
    const tab = useTabsStore.getState().getActiveTab();
    if (!tab) return;
    const path = await saveFileDialog(tab.path);
    if (!path) return;
    await writeFile(path, tab.content);
    const name = path.split("/").pop() ?? "file.md";
    useTabsStore.getState().markActiveSaved(path, name);
    const store = useEditorStore.getState();
    store.setCurrentFile(path, name);
    store.markSaved();
  }, []);

  const handleContentChange = useCallback(
    async (content: string) => {
      try {
        const { html, frontmatter } = await computePreview(content);
        useTabsStore
          .getState()
          .updateActiveTab({ content, isDirty: true, previewHtml: html, frontmatter });
        const store = useEditorStore.getState();
        store.setContent(content);
        store.setPreviewHtml(html);
        store.setFrontmatter(frontmatter);
      } catch {
        useEditorStore.getState().setPreviewHtml("<p style='color:red'>Preview error</p>");
      }
    },
    [computePreview]
  );

  const refreshPreview = useCallback(
    async (content: string) => {
      try {
        const { html, frontmatter } = await computePreview(content);
        const store = useEditorStore.getState();
        store.setPreviewHtml(html);
        store.setFrontmatter(frontmatter);
      } catch {
        useEditorStore.getState().setPreviewHtml("<p style='color:red'>Preview error</p>");
      }
    },
    [computePreview]
  );

  return { openFile, saveFile, saveFileAs, handleContentChange, refreshPreview, syncTabToEditor };
}
