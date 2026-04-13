import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { Check, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ALL_ICONS_DEDUPLICATED, ICON_CATEGORIES } from "@/lib/iconData";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

interface IconPickerProps {
  open: boolean;
  currentIcon?: string;
  targetName: string;
  onSelect: (iconName: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export function IconPicker({
  open,
  currentIcon,
  targetName,
  onSelect,
  onReset,
  onClose,
}: IconPickerProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Files & Folders");
  const [hovered, setHovered] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveCategory("Files & Folders");
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const filteredIcons = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return ALL_ICONS_DEDUPLICATED.filter((name) => name.toLowerCase().includes(q));
    }
    const cat = ICON_CATEGORIES.find((c) => c.label === activeCategory);
    return cat ? cat.icons : ALL_ICONS_DEDUPLICATED;
  }, [query, activeCategory]);

  const handleSelect = useCallback(
    (name: string) => {
      onSelect(name);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[700] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[701] -translate-x-1/2 -translate-y-1/2 focus:outline-none w-[600px] max-h-[80vh]">
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0, transition: spring.snappy }}
            exit={{ scale: 0.96, opacity: 0, y: -4, transition: { duration: 0.12 } }}
            className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <div>
                <Dialog.Title className="text-sm font-semibold text-foreground">
                  Choose icon
                </Dialog.Title>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  for <span className="text-foreground font-medium">{targetName}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentIcon && (
                  <button
                    onClick={() => {
                      onReset();
                      onClose();
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 transition-colors"
                  >
                    Reset to default
                  </button>
                )}
                <Dialog.Close className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </Dialog.Close>
              </div>
            </div>

            <div className="px-4 pb-3 shrink-0">
              <div className="flex items-center gap-2 h-8 rounded-md border border-border bg-muted px-3 focus-within:border-ring transition-colors">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                  }}
                  placeholder="Search icons…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {!query && (
              <div className="px-4 pb-2 shrink-0 flex flex-wrap gap-1">
                {ICON_CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => setActiveCategory(cat.label)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                      activeCategory === cat.label
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {query && (
              <p className="px-4 pb-2 text-[11px] text-muted-foreground shrink-0">
                {filteredIcons.length} results for "{query}"
              </p>
            )}

            <ScrollArea className="flex-1 px-4 pb-4">
              <motion.div
                key={query || activeCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.1 } }}
                className="grid grid-cols-8 gap-1"
              >
                {filteredIcons.map((name) => {
                  const isSelected = currentIcon === name;
                  return (
                    <motion.button
                      key={name}
                      onClick={() => handleSelect(name)}
                      onHoverStart={() => setHovered(name)}
                      onHoverEnd={() => setHovered(null)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      transition={spring.snappy}
                      title={name}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-colors",
                        isSelected
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "border-transparent hover:bg-accent hover:border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <DynamicIcon name={name} className="h-4 w-4 shrink-0" />
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1, transition: spring.bounce }}
                          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="h-2 w-2 text-primary-foreground" />
                        </motion.div>
                      )}
                      <AnimatePresence>
                        {hovered === name && !isSelected && (
                          <motion.span
                            initial={{ opacity: 0, y: 2 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground bg-card border border-border rounded px-1 py-0.5 whitespace-nowrap z-10 pointer-events-none"
                          >
                            {name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </motion.div>
              {filteredIcons.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No icons matching "{query}"
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
