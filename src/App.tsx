import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppTour } from "@/components/AppTour";
import { CommandPalette } from "@/components/CommandPalette";
import { DragGhost } from "@/components/DragGhost";
import { EditorPane, openFindReplace } from "@/components/EditorPane";
import { OnboardingModal } from "@/components/OnboardingModal";
import { PreviewPane } from "@/components/PreviewPane";
import { PrintPreview } from "@/components/PrintPreview";
import { SettingsSheet } from "@/components/SettingsSheet";
import { Sidebar } from "@/components/Sidebar";
import { StatusBar } from "@/components/StatusBar";
import { TabBar } from "@/components/TabBar";
import { Toolbar } from "@/components/Toolbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFileOps } from "@/hooks/useFileOps";
import {
  listDirectory,
  setTextBrightnessCss,
  setVibrancy,
  setWindowBlurCss,
  setWindowOpacityCss,
} from "@/lib/commands";
import { spring } from "@/lib/motion";
import { useDragStore } from "@/store/drag";
import { useEditorStore } from "@/store/editor";
import { useSettingsStore } from "@/store/settings";
import { useTabsStore } from "@/store/tabs";

function App() {
  const { handleContentChange, openFile, saveFile, syncTabToEditor } = useFileOps();
  const { activePanel, setRootDir, setFileTree, previewHtml, currentFileName } = useEditorStore();
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const { dragging: isDraggingFile } = useDragStore();
  const {
    appTheme,
    customAppThemeId,
    customAppThemes,
    autoSave,
    autoSaveDelay,
    lastFolder,
    setLastFolder,
    lastFilePath,
    windowOpacity,
    windowBlur,
    windowBlurRadius,
    textBrightness,
    hasOnboarded,
    zenMode,
    setZenMode,
    sidebarWidth,
    setSidebarWidth,
  } = useSettingsStore();

  const [splitPct, setSplitPct] = useState(50);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const dragging = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    syncTabToEditor();
  }, [activeTabId, syncTabToEditor]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove(
      "light",
      "solarized-dark",
      "solarized-light",
      "catppuccin-mocha",
      "dracula",
      "tokyo-night"
    );
    if (customAppThemeId) {
      const custom = customAppThemes.find((t) => t.id === customAppThemeId);
      if (custom) {
        const slug = customAppThemeId.startsWith("theme-")
          ? customAppThemeId
          : `theme-${customAppThemeId}`;
        html.classList.add(slug);
      }
    } else if (appTheme !== "dark") {
      html.classList.add(appTheme);
    }
  }, [appTheme, customAppThemeId, customAppThemes]);

  useEffect(() => {
    let style = document.getElementById("custom-app-theme") as HTMLStyleElement | null;
    const custom = customAppThemeId ? customAppThemes.find((t) => t.id === customAppThemeId) : null;
    if (custom) {
      if (!style) {
        style = document.createElement("style");
        style.id = "custom-app-theme";
        document.head.appendChild(style);
      }
      style.textContent = custom.css;
    } else {
      style?.remove();
    }
  }, [customAppThemeId, customAppThemes]);

  useEffect(() => {
    setWindowOpacityCss(windowOpacity);
  }, [windowOpacity]);

  useEffect(() => {
    setTextBrightnessCss(textBrightness);
  }, [textBrightness]);

  useEffect(() => {
    setVibrancy(windowBlur).catch((e) => console.error("[vibrancy]", e));
    setWindowBlurCss(windowBlur, windowBlurRadius);
  }, [windowBlur, windowBlurRadius]);

  useEffect(() => {
    if (!hasOnboarded || !lastFolder) return;
    listDirectory(lastFolder)
      .then((tree) => {
        setRootDir(lastFolder);
        setFileTree(tree);
        if (lastFilePath) openFile(lastFilePath).catch(() => null);
      })
      .catch(() => setLastFolder(null));
  }, [hasOnboarded, setRootDir, setLastFolder, setFileTree, lastFolder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveFile();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        openFindReplace();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        setPrintOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        setZenMode(!zenMode);
      }
      if (e.key === "Escape" && zenMode) {
        setZenMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveFile, zenMode, setZenMode]);

  useEffect(() => {
    if (!autoSave) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveFile(), autoSaveDelay);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [autoSave, autoSaveDelay, saveFile]);

  const handleOpenFolder = useCallback(
    async (dir: string) => {
      const tree = await listDirectory(dir);
      setRootDir(dir);
      setFileTree(tree);
      setLastFolder(dir);
    },
    [setRootDir, setFileTree, setLastFolder]
  );

  const handleOnboardingComplete = useCallback(
    async (folder: string) => {
      const welcomePath = `${folder}/WELCOME.md`;
      await openFile(welcomePath);
    },
    [openFile]
  );

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      setSplitPct(Math.min(85, Math.max(15, ((ev.clientX - rect.left) / rect.width) * 100)));
    };

    const onMouseUp = () => {
      dragging.current = false;
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  const sidebarDragging = useRef(false);

  const onSidebarDividerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      sidebarDragging.current = true;
      setIsSidebarDragging(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (ev: MouseEvent) => {
        if (!sidebarDragging.current) return;
        setSidebarWidth(Math.min(480, Math.max(140, ev.clientX)));
      };

      const onMouseUp = () => {
        sidebarDragging.current = false;
        setIsSidebarDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [setSidebarWidth]
  );

  const isSplit = activePanel === "split";

  return (
    <TooltipProvider delayDuration={500}>
      <div className="flex flex-col h-full bg-background text-foreground">
        <div data-tour="toolbar">
          <Toolbar
            onOpenFolder={handleOpenFolder}
            onCmdK={() => setCmdPaletteOpen(true)}
            zenMode={zenMode}
            onZenToggle={() => setZenMode(!zenMode)}
          />
        </div>
        {!zenMode && <TabBar />}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {isDraggingFile && (
            <div
              className="fixed inset-0 z-[9999] cursor-grabbing"
              style={{ pointerEvents: "none" }}
            />
          )}
          <AnimatePresence initial={false}>
            {!zenMode && (
              <motion.div
                key="sidebar"
                data-tour="sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: sidebarWidth, opacity: 1, transition: spring.smooth }}
                exit={{ width: 0, opacity: 0, transition: { duration: 0.22 } }}
                className="overflow-hidden shrink-0 flex relative"
                style={{ pointerEvents: isSidebarDragging ? "none" : undefined }}
              >
                <Sidebar onFileOpen={openFile} onOpenFolder={handleOpenFolder} />
                <div
                  onMouseDown={onSidebarDividerMouseDown}
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 transition-colors group z-10"
                >
                  <motion.div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-border group-hover:bg-primary/60 transition-colors"
                    whileHover={{ scaleY: 1.5 }}
                    transition={spring.snappy}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <main ref={mainRef} className="flex flex-1 overflow-hidden">
            <AnimatePresence initial={false}>
              {(activePanel === "editor" || isSplit) && (
                <motion.div
                  key="editor"
                  data-tour="editor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  className="h-full overflow-hidden"
                  style={{
                    width: isSplit ? `${splitPct}%` : "100%",
                    pointerEvents: isDragging ? "none" : undefined,
                  }}
                >
                  <EditorPane onChange={handleContentChange} />
                </motion.div>
              )}
            </AnimatePresence>
            {isSplit && (
              <div
                onMouseDown={onDividerMouseDown}
                className="w-1.5 shrink-0 hover:bg-primary/40 cursor-col-resize transition-colors group relative"
              >
                <div className="absolute inset-y-0 -left-1 -right-1" />
              </div>
            )}
            <AnimatePresence initial={false}>
              {(activePanel === "preview" || isSplit) && (
                <motion.div
                  key="preview"
                  data-tour="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  className="h-full overflow-hidden"
                  style={{
                    width: isSplit ? `${100 - splitPct}%` : "100%",
                    pointerEvents: isDragging ? "none" : undefined,
                  }}
                >
                  <PreviewPane />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
        <StatusBar />
      </div>

      <AnimatePresence>
        {!hasOnboarded && <OnboardingModal onComplete={handleOnboardingComplete} />}
      </AnimatePresence>
      <SettingsSheet />
      <AppTour />
      <CommandPalette
        open={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onPrint={() => {
          setCmdPaletteOpen(false);
          setPrintOpen(true);
        }}
      />
      <PrintPreview
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        bodyHtml={previewHtml}
        title={currentFileName ?? "document"}
      />
      <DragGhost />
    </TooltipProvider>
  );
}

export default App;
