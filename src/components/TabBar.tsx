import { AnimatePresence, motion } from "framer-motion";
import { Circle, FileText, Plus, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useTabsStore } from "@/store/tabs";

export function TabBar() {
  const { tabs, activeTabId, closeTab, switchTab, newTab } = useTabsStore();
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, []);

  const handleClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const tab = tabs.find((t) => t.id === id);
    if (tab?.isDirty) {
      if (!confirm(`"${tab.name}" has unsaved changes. Close anyway?`)) return;
    }
    closeTab(id);
  };

  const handleMiddleClick = (e: React.MouseEvent, id: string) => {
    if (e.button === 1) {
      e.preventDefault();
      handleClose(e, id);
    }
  };

  return (
    <div className="flex items-stretch h-9 border-b border-border bg-card/50 overflow-hidden shrink-0">
      <div className="flex items-stretch flex-1 overflow-x-auto scrollbar-none min-w-0">
        <AnimatePresence initial={false}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <motion.button
                key={tab.id}
                ref={isActive ? activeRef : undefined}
                onClick={() => switchTab(tab.id)}
                onMouseDown={(e) => handleMiddleClick(e, tab.id)}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1, transition: spring.snappy }}
                exit={{ width: 0, opacity: 0, transition: { duration: 0.15 } }}
                className={cn(
                  "group flex items-center gap-1.5 px-3 h-full border-r border-border text-xs shrink-0",
                  "max-w-[180px] min-w-0 select-none relative overflow-hidden",
                  isActive
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px bg-primary"
                    transition={spring.snappy}
                  />
                )}
                <FileText
                  className={cn(
                    "h-3 w-3 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground/50"
                  )}
                />
                <span className="truncate min-w-0">{tab.name}</span>
                {tab.isDirty && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={spring.bounce}
                  >
                    <Circle className="h-1.5 w-1.5 fill-primary text-primary shrink-0" />
                  </motion.span>
                )}
                <span
                  onClick={(e) => handleClose(e, tab.id)}
                  className={cn(
                    "shrink-0 flex items-center justify-center w-4 h-4 rounded transition-colors",
                    "hover:bg-muted text-muted-foreground hover:text-foreground",
                    tab.isDirty ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <X className="h-2.5 w-2.5" />
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      <motion.button
        onClick={newTab}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flex items-center justify-center w-8 shrink-0 border-l border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        title="New tab"
      >
        <Plus className="h-3.5 w-3.5" />
      </motion.button>
    </div>
  );
}
