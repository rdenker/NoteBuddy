import { motion } from "framer-motion";
import {
  Columns2,
  Download,
  Eye,
  FilePlus,
  FileText,
  FolderOpen,
  LayoutTemplate,
  PanelLeft,
  Save,
  Search,
  Settings,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFileOps } from "@/hooks/useFileOps";
import {
  exportHtml,
  type SearchResult,
  saveAsTemplate,
  saveFileDialog,
  searchFiles,
  writeFile,
} from "@/lib/commands";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor";
import { useSettingsStore } from "@/store/settings";
import { useTabsStore } from "@/store/tabs";

interface PaletteAction {
  id: string;
  label: string;
  detail?: string;
  icon: React.ReactNode;
  run: () => void;
  keywords?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onPrint: () => void;
}

export function CommandPalette({ open, onClose, onPrint }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openFile, saveFile } = useFileOps();
  const { setSettingsOpen: openSettings, zenMode, setZenMode } = useSettingsStore();
  const { setActivePanel: setPanel, rootDir, content, currentFileName } = useEditorStore();
  const { newTab } = useTabsStore();

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setSearchResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const staticActions: PaletteAction[] = useMemo(
    () => [
      {
        id: "new-file",
        label: "New file",
        icon: <FilePlus className="h-4 w-4" />,
        run: () => {
          newTab();
          onClose();
        },
      },
      {
        id: "open-file",
        label: "Open file…",
        icon: <FolderOpen className="h-4 w-4" />,
        run: () => {
          openFile();
          onClose();
        },
      },
      {
        id: "save",
        label: "Save",
        detail: "⌘S",
        icon: <Save className="h-4 w-4" />,
        run: () => {
          saveFile();
          onClose();
        },
      },
      {
        id: "view-split",
        label: "Split view",
        icon: <Columns2 className="h-4 w-4" />,
        run: () => {
          setPanel("split");
          onClose();
        },
      },
      {
        id: "view-editor",
        label: "Editor only",
        icon: <PanelLeft className="h-4 w-4" />,
        run: () => {
          setPanel("editor");
          onClose();
        },
      },
      {
        id: "view-preview",
        label: "Preview only",
        icon: <Eye className="h-4 w-4" />,
        run: () => {
          setPanel("preview");
          onClose();
        },
      },
      {
        id: "settings",
        label: "Open settings",
        detail: "⚙",
        icon: <Settings className="h-4 w-4" />,
        run: () => {
          openSettings(true);
          onClose();
        },
      },
      {
        id: "zen",
        label: zenMode ? "Exit zen mode" : "Enter zen mode",
        detail: "⌘⇧Z",
        icon: <Eye className="h-4 w-4" />,
        keywords: "zen focus distraction-free",
        run: () => {
          setZenMode(!zenMode);
          onClose();
        },
      },
      {
        id: "export-html",
        label: "Export as HTML…",
        icon: <Download className="h-4 w-4" />,
        run: async () => {
          onClose();
          const html = await exportHtml(content, currentFileName ?? "export");
          const path = await saveFileDialog(null);
          if (path) await writeFile(path.endsWith(".html") ? path : `${path}.html`, html);
        },
      },
      {
        id: "export-pdf",
        label: "Print / Export as PDF…",
        icon: <Download className="h-4 w-4" />,
        keywords: "print pdf export",
        run: () => onPrint(),
      },
      {
        id: "save-template",
        label: "Save as template…",
        icon: <LayoutTemplate className="h-4 w-4" />,
        keywords: "template save",
        run: async () => {
          if (!rootDir || !content) return;
          const name = prompt("Template name:", currentFileName?.replace(".md", "") ?? "");
          if (!name) return;
          await saveAsTemplate(rootDir, name, content);
          onClose();
        },
      },
    ],
    [
      openFile,
      saveFile,
      setPanel,
      openSettings,
      content,
      currentFileName,
      rootDir,
      onClose,
      zenMode,
      setZenMode,
      onPrint,
      newTab,
    ]
  );

  useEffect(() => {
    if (!query.startsWith(">") && query.length >= 2 && rootDir) {
      setSearching(true);
      const t = setTimeout(async () => {
        const results = await searchFiles(rootDir, query);
        setSearchResults(results);
        setSearching(false);
      }, 200);
      return () => clearTimeout(t);
    } else {
      setSearchResults([]);
      setSearching(false);
    }
  }, [query, rootDir]);

  const filteredActions = useMemo(() => {
    if (!query || query.startsWith(">")) {
      const q = query.startsWith(">") ? query.slice(1).trim().toLowerCase() : "";
      return q
        ? staticActions.filter((a) => a.label.toLowerCase().includes(q) || a.keywords?.includes(q))
        : staticActions;
    }
    return [];
  }, [query, staticActions]);

  const allItems: Array<
    { type: "action"; item: PaletteAction } | { type: "result"; item: SearchResult }
  > = [
    ...filteredActions.map((a) => ({ type: "action" as const, item: a })),
    ...searchResults.map((r) => ({ type: "result" as const, item: r })),
  ];

  useEffect(() => setSelectedIndex(0), []);

  const runSelected = useCallback(() => {
    const sel = allItems[selectedIndex];
    if (!sel) return;
    if (sel.type === "action") {
      sel.item.run();
    } else {
      openFile(sel.item.path);
      onClose();
    }
  }, [allItems, selectedIndex, openFile, onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        runSelected();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, allItems.length, runSelected, onClose]);

  if (!open) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[400] flex items-start justify-center pt-[18vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-[580px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
        initial={{ scale: 0.94, opacity: 0, y: -8 }}
        animate={{ scale: 1, opacity: 1, y: 0, transition: spring.snappy }}
        exit={{ scale: 0.96, opacity: 0, y: -4, transition: { duration: 0.12 } }}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes or type > for commands…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border"
            >
              Esc
            </button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto py-1">
          {searching && <div className="px-4 py-3 text-xs text-muted-foreground">Searching…</div>}
          {!searching && allItems.length === 0 && query.length > 0 && (
            <div className="px-4 py-3 text-xs text-muted-foreground">No results for "{query}"</div>
          )}
          {!searching && allItems.length === 0 && !query && (
            <div className="px-3 py-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-1 mb-1">
                Actions
              </div>
            </div>
          )}
          {allItems.map((item, i) => (
            <motion.div
              key={item.type === "action" ? item.item.id : `${item.item.path}:${item.item.line}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0, transition: { delay: i * 0.02, duration: 0.12 } }}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-sm",
                i === selectedIndex
                  ? "bg-accent text-foreground"
                  : "text-foreground hover:bg-accent/50"
              )}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => {
                if (item.type === "action") item.item.run();
                else {
                  openFile(item.item.path);
                  onClose();
                }
              }}
            >
              {item.type === "action" ? (
                <>
                  <span className="text-muted-foreground shrink-0">{item.item.icon}</span>
                  <span className="flex-1">{item.item.label}</span>
                  {item.item.detail && (
                    <span className="text-xs text-muted-foreground">{item.item.detail}</span>
                  )}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.item.name}</span>
                      <span className="text-xs text-muted-foreground">line {item.item.line}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.item.preview}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-2 border-t border-border text-[10px] text-muted-foreground/60">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
          <span className="ml-auto">{">"} for commands · type to search notes</span>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
