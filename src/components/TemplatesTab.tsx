import { AnimatePresence, motion } from "framer-motion";
import { FileText, Info, LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useFileOps } from "@/hooks/useFileOps";
import {
  deleteTemplate,
  ensureTemplatesDir,
  listTemplates,
  saveAsTemplate,
  type Template,
  writeFile,
} from "@/lib/commands";
import { spring } from "@/lib/motion";
import { useEditorStore } from "@/store/editor";

const VARIABLES = [
  { key: "{{date}}", desc: "Today's date (YYYY-MM-DD)" },
  { key: "{{time}}", desc: "Current time (HH:MM)" },
  { key: "{{title}}", desc: "Prompted when creating" },
  { key: "{{datetime}}", desc: "Full ISO datetime" },
];

interface TemplatesTabProps {
  onClose: () => void;
}

export function TemplatesTab({ onClose }: TemplatesTabProps) {
  const rootDir = useEditorStore((s) => s.rootDir);
  const content = useEditorStore((s) => s.content);
  const currentFileName = useEditorStore((s) => s.currentFileName);
  const { openFile } = useFileOps();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [savingCurrent, setSavingCurrent] = useState(false);
  const [saveCurrentName, setSaveCurrentName] = useState("");

  const reload = useCallback(async () => {
    if (!rootDir) return;
    await ensureTemplatesDir(rootDir);
    const tpls = await listTemplates(rootDir);
    setTemplates(tpls);
  }, [rootDir]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleCreate = async () => {
    if (!rootDir || !newName.trim()) return;
    setLoading(true);
    try {
      const starter = `---\ntitle: {{title}}\ntype: concept\ntags: []\ncreated: {{date}}\n---\n\n# {{title}}\n\n`;
      await saveAsTemplate(rootDir, newName.trim(), starter);
      await reload();
      setNewName("");
      setShowNewForm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrent = async () => {
    if (!rootDir || !saveCurrentName.trim()) return;
    setLoading(true);
    try {
      await saveAsTemplate(rootDir, saveCurrentName.trim(), content);
      await reload();
      setSaveCurrentName("");
      setSavingCurrent(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tpl: Template) => {
    if (!confirm(`Delete template "${tpl.name}"?`)) return;
    await deleteTemplate(tpl.path);
    await reload();
  };

  const handleEdit = async (tpl: Template) => {
    await openFile(tpl.path);
    onClose();
  };

  const handleUse = async (tpl: Template) => {
    if (!rootDir) return;
    const today = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 5);
    const datetime = new Date().toISOString();

    let processed = tpl.content
      .replace(/\{\{date\}\}/g, today)
      .replace(/\{\{time\}\}/g, time)
      .replace(/\{\{datetime\}\}/g, datetime);

    let fileName = `${tpl.name} ${today}.md`;

    if (processed.includes("{{title}}")) {
      const title = prompt(`Title for new "${tpl.name}" note:`, tpl.name);
      if (!title) return;
      processed = processed.replace(/\{\{title\}\}/g, title);
      fileName = `${title}.md`;
    }

    const path = `${rootDir}/${fileName}`;
    await writeFile(path, processed);
    await openFile(path);
    onClose();
  };

  if (!rootDir) {
    return (
      <div className="py-12 text-center">
        <LayoutTemplate className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Open a folder to manage templates</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Info className="h-3.5 w-3.5 text-primary" />
          Available variables
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {VARIABLES.map(({ key, desc }) => (
            <div key={key} className="flex items-baseline gap-1.5">
              <code className="text-[10px] text-primary bg-primary/10 px-1 rounded">{key}</code>
              <span className="text-[10px] text-muted-foreground truncate">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5 flex-1"
          onClick={() => {
            setShowNewForm(true);
            setSavingCurrent(false);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Blank template
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5 flex-1"
          onClick={() => {
            setSavingCurrent(true);
            setSaveCurrentName(currentFileName?.replace(".md", "") ?? "");
            setShowNewForm(false);
          }}
          disabled={!content}
        >
          <FileText className="h-3.5 w-3.5" /> Save current note
        </Button>
      </div>

      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: spring.snappy }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 pt-1">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setShowNewForm(false);
                }}
                placeholder="Template name…"
                className="flex-1 h-7 rounded-md border border-border bg-muted px-2 text-xs text-foreground outline-none focus:border-ring"
              />
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleCreate}
                disabled={!newName.trim() || loading}
              >
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setShowNewForm(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
        {savingCurrent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: spring.snappy }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 pt-1">
              <input
                autoFocus
                value={saveCurrentName}
                onChange={(e) => setSaveCurrentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveCurrent();
                  if (e.key === "Escape") setSavingCurrent(false);
                }}
                placeholder="Template name…"
                className="flex-1 h-7 rounded-md border border-border bg-muted px-2 text-xs text-foreground outline-none focus:border-ring"
              />
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSaveCurrent}
                disabled={!saveCurrentName.trim() || loading}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setSavingCurrent(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Separator />

      {templates.length === 0 ? (
        <div className="py-6 text-center">
          <LayoutTemplate className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No templates yet</p>
        </div>
      ) : (
        <ScrollArea className="max-h-64">
          <div className="space-y-1 pr-1">
            {templates.map((tpl) => (
              <motion.div
                key={tpl.path}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0, transition: spring.snappy }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
                className="group flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 hover:bg-accent/50 transition-colors"
              >
                <LayoutTemplate className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{tpl.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {tpl.content.split("\n").length} lines
                    {tpl.content.includes("{{title}}") && (
                      <span className="ml-1.5 text-primary/70">prompts title</span>
                    )}
                    {tpl.content.includes("{{date}}") && (
                      <span className="ml-1.5 text-muted-foreground/60">auto-date</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" className="h-6 px-2 text-[10px]" onClick={() => handleUse(tpl)}>
                    Use
                  </Button>
                  <button
                    onClick={() => handleEdit(tpl)}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit template"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl)}
                    className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
