import { motion } from "framer-motion";
import { Calendar, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor";
import { typeColorStyles, useTypeColorsStore } from "@/store/typeColors";

export function FrontmatterBar() {
  const frontmatter = useEditorStore((s) => s.frontmatter);
  const activeTagFilter = useEditorStore((s) => s.activeTagFilter);
  const setActiveTagFilter = useEditorStore((s) => s.setActiveTagFilter);
  const getColor = useTypeColorsStore((s) => s.getColor);

  if (!frontmatter) return null;

  const { title, type, tags, created, updated } = frontmatter;
  const titleStr = title != null ? String(title) : null;
  const typeStr = type != null ? String(type) : null;
  const createdStr = created ? String(created).slice(0, 10) : null;
  const updatedStr = updated ? String(updated).slice(0, 10) : null;

  const typeStyles = typeStr ? typeColorStyles(getColor(typeStr) ?? "slate") : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0, transition: spring.snappy }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
      className="shrink-0 border-b border-border bg-card/60 px-5 py-3"
    >
      {titleStr && (
        <h1 className="text-sm font-semibold text-foreground leading-snug mb-2 truncate">
          {titleStr}
        </h1>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {typeStr && typeStyles && (
          <Badge
            variant="outline"
            className={cn("text-[11px] border")}
            style={{
              borderColor: typeStyles.border,
              color: typeStyles.text,
              backgroundColor: typeStyles.bg,
            }}
          >
            {typeStr}
          </Badge>
        )}
        {tags && tags.length > 0 && (
          <>
            {type && <Separator orientation="vertical" className="h-3 mx-0.5" />}
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                  activeTagFilter === tag
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-accent"
                )}
              >
                #{tag}
              </button>
            ))}
          </>
        )}
        {(createdStr || updatedStr) && (
          <>
            <Separator orientation="vertical" className="h-3 mx-0.5 ml-auto" />
            {createdStr && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {createdStr}
              </span>
            )}
            {updatedStr && updatedStr !== createdStr && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                {updatedStr}
              </span>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
