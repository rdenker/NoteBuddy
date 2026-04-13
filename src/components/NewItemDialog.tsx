import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, FileText, FolderPlus, LayoutTemplate } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Template } from "@/lib/commands";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Mode = "file" | "folder";

interface NewItemDialogProps {
  open: boolean;
  mode: Mode;
  parentPath: string;
  templates: Template[];
  onConfirm: (name: string, template: Template | null) => void;
  onCancel: () => void;
}

export function NewItemDialog({
  open,
  mode,
  parentPath,
  templates,
  onConfirm,
  onCancel,
}: NewItemDialogProps) {
  const [name, setName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setSelectedTemplate(null);
      setShowTemplates(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const finalName =
      mode === "file" ? (trimmed.endsWith(".md") ? trimmed : `${trimmed}.md`) : trimmed;
    onConfirm(finalName, selectedTemplate);
  };

  const folderName = parentPath.split("/").pop() ?? parentPath;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[600] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[601] -translate-x-1/2 -translate-y-1/2 w-[420px] focus:outline-none">
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0, transition: spring.snappy }}
            exit={{ scale: 0.96, opacity: 0, transition: { duration: 0.12 } }}
            className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="px-5 pt-5 pb-4">
              <Dialog.Title className="text-sm font-semibold text-foreground mb-0.5">
                {mode === "file" ? "New file" : "New folder"}
              </Dialog.Title>
              <p className="text-[11px] text-muted-foreground mb-4">
                in <span className="text-foreground font-medium">{folderName}/</span>
              </p>

              <div className="flex items-center gap-2">
                {mode === "file" ? (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <FolderPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirm();
                    if (e.key === "Escape") onCancel();
                  }}
                  placeholder={mode === "file" ? "filename.md" : "folder-name"}
                  className="flex-1 h-8 rounded-md border border-border bg-muted px-3 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground"
                />
              </div>

              {mode === "file" && templates.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowTemplates((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showTemplates ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <LayoutTemplate className="h-3 w-3" />
                    {selectedTemplate ? (
                      <span>
                        Template:{" "}
                        <span className="text-primary font-medium">{selectedTemplate.name}</span>
                      </span>
                    ) : (
                      "Start from template (optional)"
                    )}
                  </button>

                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1, transition: spring.snappy }}
                        exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => setSelectedTemplate(null)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors text-left",
                              !selectedTemplate
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-border hover:bg-accent text-muted-foreground"
                            )}
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium">Blank</span>
                          </button>
                          {templates.map((tpl) => (
                            <button
                              key={tpl.path}
                              onClick={() => setSelectedTemplate(tpl)}
                              className={cn(
                                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors text-left",
                                selectedTemplate?.path === tpl.path
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border hover:bg-accent text-muted-foreground"
                              )}
                            >
                              <LayoutTemplate className="h-3.5 w-3.5 shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium truncate">{tpl.name}</div>
                                {tpl.content.includes("{{title}}") && (
                                  <div className="text-[9px] opacity-60">prompts title</div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <Separator />
            <div className="flex items-center justify-end gap-2 px-5 py-3">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleConfirm}
                disabled={!name.trim()}
              >
                {mode === "file" ? "Create file" : "Create folder"}
              </Button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
