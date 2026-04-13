import { Check, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor";

interface FilterPanelProps {
  allTags: [string, number][];
  fileDates: Map<string, string>;
}

export function FilterPanel({ allTags, fileDates }: FilterPanelProps) {
  const {
    activeTagFilter,
    setActiveTagFilter,
    activeDateFrom,
    setActiveDateFrom,
    activeDateTo,
    setActiveDateTo,
  } = useEditorStore();

  const [open, setOpen] = useState(false);

  const hasActiveFilter = activeTagFilter || activeDateFrom || activeDateTo;

  const clearAll = () => {
    setActiveTagFilter(null);
    setActiveDateFrom(null);
    setActiveDateTo(null);
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-sidebar-border shrink-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 flex-1 h-7 px-2 rounded-md text-[11px] transition-colors border",
              hasActiveFilter
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <SlidersHorizontal className="h-3 w-3 shrink-0" />
            <span className="flex-1 text-left truncate">
              {hasActiveFilter
                ? [
                    activeTagFilter && `#${activeTagFilter}`,
                    activeDateFrom && `from ${activeDateFrom}`,
                    activeDateTo && `to ${activeDateTo}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Filter…"}
            </span>
            {hasActiveFilter && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent side="bottom" align="start" className="w-64">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground">Filter notes</span>
              {hasActiveFilter && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                >
                  <X className="h-2.5 w-2.5" /> Clear all
                </button>
              )}
            </div>

            {allTags.length > 0 && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Tags
                </p>
                <div className="max-h-40 overflow-y-auto space-y-0.5 mb-3">
                  {allTags.map(([tag, count]) => {
                    const active = activeTagFilter === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setActiveTagFilter(active ? null : tag)}
                        className={cn(
                          "flex items-center gap-2 w-full px-2 py-1 rounded-md text-xs transition-colors",
                          active ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0",
                            active ? "bg-primary border-primary" : "border-border"
                          )}
                        >
                          {active && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                        </div>
                        <span className="flex-1 text-left truncate">#{tag}</span>
                        <Badge
                          variant="secondary"
                          className="h-4 px-1.5 text-[9px] border-0 bg-muted-foreground/15 text-muted-foreground"
                        >
                          {count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
                <Separator className="mb-3" />
              </>
            )}

            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
              Date range
            </p>
            <p className="text-[10px] text-muted-foreground mb-2">
              Filter by frontmatter <code className="bg-muted px-0.5 rounded">created</code> date
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-8 shrink-0">From</span>
                <input
                  type="date"
                  value={activeDateFrom ?? ""}
                  onChange={(e) => setActiveDateFrom(e.target.value || null)}
                  className="flex-1 h-7 rounded-md border border-border bg-muted px-2 text-xs text-foreground outline-none focus:border-ring"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-8 shrink-0">To</span>
                <input
                  type="date"
                  value={activeDateTo ?? ""}
                  onChange={(e) => setActiveDateTo(e.target.value || null)}
                  className="flex-1 h-7 rounded-md border border-border bg-muted px-2 text-xs text-foreground outline-none focus:border-ring"
                />
              </div>
            </div>

            {fileDates.size > 0 && (activeDateFrom || activeDateTo) && (
              <p className="text-[10px] text-muted-foreground mt-2">
                {
                  Array.from(fileDates.entries()).filter(([_, d]) => {
                    if (activeDateFrom && d < activeDateFrom) return false;
                    if (activeDateTo && d > activeDateTo) return false;
                    return true;
                  }).length
                }{" "}
                files in range
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
