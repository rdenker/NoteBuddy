import { motion } from "framer-motion";
import { useMemo } from "react";
import { spring } from "@/lib/motion";
import { useEditorStore } from "@/store/editor";

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function readingTime(words: number): string {
  const mins = Math.ceil(words / 200);
  return mins < 1 ? "< 1 min" : `${mins} min read`;
}

export function StatusBar() {
  const content = useEditorStore((s) => s.content);
  const currentFilePath = useEditorStore((s) => s.currentFilePath);
  const isDirty = useEditorStore((s) => s.isDirty);

  const stats = useMemo(() => {
    const words = countWords(content);
    const chars = content.length;
    const lines = content === "" ? 0 : content.split("\n").length;
    return { words, chars, lines, readTime: readingTime(words) };
  }, [content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0, transition: spring.gentle }}
      className="flex items-center justify-between h-6 px-4 border-t border-border bg-card/60 shrink-0 select-none"
    >
      <div className="flex items-center gap-3">
        {currentFilePath && (
          <span className="text-[10px] text-muted-foreground/70 truncate max-w-[280px]">
            {currentFilePath}
            {isDirty && " •"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Stat label="words" value={stats.words} />
        <Stat label="chars" value={stats.chars} />
        <Stat label="lines" value={stats.lines} />
        <span className="text-[10px] text-muted-foreground/60">{stats.readTime}</span>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-[10px] text-muted-foreground/60">
      <span className="text-muted-foreground">{value.toLocaleString()}</span> {label}
    </span>
  );
}
