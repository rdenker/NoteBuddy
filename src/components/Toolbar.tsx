import {
  Circle,
  Columns2,
  Eye,
  FilePlus,
  FolderOpen,
  Maximize2,
  Minimize2,
  PanelLeft,
  Save,
  SaveAll,
  Search,
  Settings,
} from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFileOps } from "@/hooks/useFileOps";
import { openDirectory } from "@/lib/commands";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor";
import { useSettingsStore } from "@/store/settings";
import { useTabsStore } from "@/store/tabs";

interface ToolbarProps {
  onOpenFolder: (dir: string) => void;
  onCmdK: () => void;
  zenMode: boolean;
  onZenToggle: () => void;
}

export function Toolbar({ onOpenFolder, onCmdK, zenMode, onZenToggle }: ToolbarProps) {
  const { saveFile, saveFileAs, openFile } = useFileOps();
  const { activePanel, setActivePanel, currentFileName, isDirty } = useEditorStore();
  const { newTab } = useTabsStore();
  const { setSettingsOpen } = useSettingsStore();

  const handleOpenFolderClick = useCallback(async () => {
    const dir = await openDirectory();
    if (dir) onOpenFolder(dir);
  }, [onOpenFolder]);

  const panelButtons: {
    panel: "editor" | "split" | "preview";
    icon: React.ReactNode;
    label: string;
  }[] = [
    { panel: "editor", icon: <PanelLeft className="h-3.5 w-3.5" />, label: "Editor only" },
    { panel: "split", icon: <Columns2 className="h-3.5 w-3.5" />, label: "Split view" },
    { panel: "preview", icon: <Eye className="h-3.5 w-3.5" />, label: "Preview only" },
  ];

  return (
    <div className="relative flex items-center h-11 px-3 shrink-0 gap-1 select-none">
      <div
        className="absolute inset-0 pointer-events-none"
        data-tauri-drag-region
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      />
      <div
        className="relative flex items-center gap-0.5 pl-[70px]"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <ToolbarBtn onClick={newTab} label="New file">
          <FilePlus className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => openFile()} label="Open file">
          <FolderOpen className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleOpenFolderClick} label="Open folder">
          <FolderOpen className="h-3.5 w-3.5 text-primary" />
        </ToolbarBtn>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <ToolbarBtn onClick={saveFile} label="Save (⌘S)">
          <Save className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={saveFileAs} label="Save as">
          <SaveAll className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <button
          data-tour="cmd-k"
          onClick={onCmdK}
          className="flex items-center gap-1.5 h-7 px-2 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border/40"
        >
          <Search className="h-3 w-3" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="text-[10px] opacity-50">⌘K</kbd>
        </button>
      </div>

      <div
        className="relative flex-1 flex items-center justify-center"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {currentFileName && (
          <div className="flex items-center gap-1.5 pointer-events-none">
            <span className="text-xs text-muted-foreground/80 font-medium">{currentFileName}</span>
            {isDirty && <Circle className="h-1.5 w-1.5 fill-primary text-primary" />}
          </div>
        )}
      </div>

      <div
        className="relative flex items-center gap-0.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <div className="flex items-center p-0.5 rounded-md bg-muted/60 gap-0.5">
          {panelButtons.map(({ panel, icon, label }) => (
            <Tooltip key={panel}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActivePanel(panel)}
                  className={cn(
                    "p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground",
                    activePanel === panel && "bg-card text-foreground shadow-sm"
                  )}
                >
                  {icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onZenToggle}
              className={cn(
                "p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground",
                zenMode && "bg-primary/15 text-primary"
              )}
            >
              {zenMode ? (
                <Maximize2 className="h-3.5 w-3.5" />
              ) : (
                <Minimize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {zenMode ? "Exit zen mode (⌘⇧Z)" : "Zen mode (⌘⇧Z)"}
          </TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-4 mx-1" />
        <div data-tour="settings-btn">
          <ToolbarBtn onClick={() => setSettingsOpen(true)} label="Settings">
            <Settings className="h-3.5 w-3.5" />
          </ToolbarBtn>
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
