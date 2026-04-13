import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, FileText, FolderOpen, MoveRight } from "lucide-react";
import { createPortal } from "react-dom";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useDragStore } from "@/store/drag";

export function DragGhost() {
  const { dragging, overPath, dropPosition, cursorX, cursorY } = useDragStore();

  const getOverName = () => {
    if (!overPath) return null;
    if (dropPosition === "root") return "root";
    try {
      const el = document.querySelector(
        `[data-filepath="${CSS.escape(overPath)}"]`
      ) as HTMLElement | null;
      return el?.querySelector(".truncate")?.textContent ?? overPath.split("/").pop() ?? null;
    } catch {
      return overPath.split("/").pop() ?? null;
    }
  };

  const getDropLabel = () => {
    if (!overPath || !dropPosition) return null;
    if (dropPosition === "root")
      return { icon: <ArrowUp className="h-3 w-3 text-primary" />, text: "root" };
    if (dropPosition === "into")
      return { icon: <MoveRight className="h-3 w-3 text-primary" />, text: getOverName() };
    if (dropPosition === "before")
      return {
        icon: <span className="text-primary text-[10px] font-bold leading-none">↑</span>,
        text: getOverName(),
      };
    if (dropPosition === "after")
      return {
        icon: <span className="text-primary text-[10px] font-bold leading-none">↓</span>,
        text: getOverName(),
      };
    return null;
  };

  const dropLabel = getDropLabel();

  return createPortal(
    <AnimatePresence>
      {dragging && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1, transition: spring.snappy }}
          exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.1 } }}
          className="fixed z-[9999] pointer-events-none select-none"
          style={{ left: cursorX + 14, top: cursorY - 10 }}
        >
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border shadow-2xl px-3 py-2 text-xs font-medium",
              "bg-card/95 backdrop-blur-sm border-border text-foreground max-w-[220px]"
            )}
          >
            {dragging.isDir ? (
              <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="truncate">{dragging.name}</span>
            <AnimatePresence mode="wait">
              {dropLabel && (
                <motion.div
                  key={`${overPath}-${dropPosition}`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0, transition: spring.snappy }}
                  exit={{ opacity: 0, transition: { duration: 0.08 } }}
                  className="flex items-center gap-1.5 border-l border-border pl-2 shrink-0"
                >
                  {dropLabel.icon}
                  <span className="text-primary truncate max-w-[70px]">{dropLabel.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!overPath && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1 text-[10px] text-muted-foreground/60 text-center"
            >
              drop on folder · between items · or root
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
