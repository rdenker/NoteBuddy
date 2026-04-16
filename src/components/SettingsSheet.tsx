import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  BookOpen,
  Info,
  Keyboard,
  LayoutTemplate,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TemplatesTab } from "@/components/TemplatesTab";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FileEntry } from "@/lib/commands";
import { readFile } from "@/lib/commands";
import { parseFrontmatter } from "@/lib/frontmatter";
import { HLJS_THEMES as HLJS_THEME_REGISTRY } from "@/lib/hljsTheme";
import { APP_THEMES, CUSTOM_APP_THEME_TEMPLATE } from "@/lib/appThemes";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor";
import type { AppTheme, CustomAppTheme, CustomTheme } from "@/store/settings";
import { type EditorTheme, type HljsTheme, useSettingsStore } from "@/store/settings";
import { PRESET_COLORS, typeColorStyles, useTypeColorsStore } from "@/store/typeColors";

function flattenFiles(entries: FileEntry[]): FileEntry[] {
  const result: FileEntry[] = [];
  for (const entry of entries) {
    if (!entry.is_dir) result.push(entry);
    else if (entry.children) result.push(...flattenFiles(entry.children));
  }
  return result;
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="space-y-0.5 flex-1 min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const EDITOR_THEMES: { value: EditorTheme; label: string }[] = [
  { value: "vscodeDark", label: "VS Code Dark" },
  { value: "oneDark", label: "One Dark" },
  { value: "dracula", label: "Dracula" },
  { value: "nord", label: "Nord" },
  { value: "tokyoNight", label: "Tokyo Night" },
  { value: "material", label: "Material" },
  { value: "sublime", label: "Sublime" },
  { value: "githubLight", label: "GitHub Light" },
  { value: "solarizedDark", label: "Solarized Dark" },
  { value: "solarizedLight", label: "Solarized Light" },
  { value: "gruvboxDark", label: "Gruvbox Dark" },
  { value: "monokai", label: "Monokai" },
  { value: "aura", label: "Aura" },
];

const HLJS_THEMES = HLJS_THEME_REGISTRY.map((t) => ({ value: t.id, label: t.label }));

const SHORTCUTS = [
  { keys: ["⌘", "S"], desc: "Save file" },
  { keys: ["⌘", "O"], desc: "Open file" },
  { keys: ["Ctrl", "Space"], desc: "Trigger autocomplete" },
  { keys: ["Esc"], desc: "Dismiss autocomplete" },
  { keys: ["Tab"], desc: "Accept suggestion" },
];

function CustomThemesSection({
  label,
  description,
  linkHref,
  linkLabel,
  customThemes,
  currentThemeId,
  onAdd,
  onRemove,
}: {
  label: string;
  description: string;
  linkHref: string;
  linkLabel: string;
  customThemes: CustomTheme[];
  currentThemeId: string;
  onAdd: (t: CustomTheme) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [css, setCss] = useState("");

  const handleAdd = () => {
    const trimmedName = name.trim();
    const trimmedCss = css.trim();
    if (!trimmedName || !trimmedCss) return;
    const id = `custom-${trimmedName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    onAdd({ id, label: trimmedName, css: trimmedCss });
    setName("");
    setCss("");
    setOpen(false);
  };

  return (
    <div className="py-3 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {open ? "Cancel" : "+ Add theme"}
        </button>
      </div>

      {open && (
        <div className="space-y-2 mb-3 p-3 rounded-lg border border-border bg-muted/30">
          <div>
            <label
              htmlFor="theme-name-input"
              className="text-[11px] text-muted-foreground mb-1 block"
            >
              Theme name
            </label>
            <input
              id="theme-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dracula"
              className="w-full h-7 rounded-md border border-border bg-muted px-2 text-xs text-foreground outline-none focus:border-ring"
            />
          </div>
          <div>
            <label
              htmlFor="theme-css-input"
              className="text-[11px] text-muted-foreground mb-1 block"
            >
              CSS{" "}
              <a
                href={linkHref}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                ({linkLabel})
              </a>
            </label>
            <textarea
              id="theme-css-input"
              value={css}
              onChange={(e) => setCss(e.target.value)}
              placeholder="/* Paste your highlight.js theme CSS here */"
              rows={6}
              className="w-full rounded-md border border-border bg-muted px-2 py-1.5 text-xs text-foreground font-mono outline-none focus:border-ring resize-none"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!name.trim() || !css.trim()}
            className="w-full h-7 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add theme
          </button>
        </div>
      )}

      {customThemes.length > 0 && (
        <div className="space-y-1.5">
          {customThemes.map((t) => (
            <div
              key={t.id}
              className={cn(
                "flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors",
                currentThemeId === t.id
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-muted/30"
              )}
            >
              <span className="font-medium text-foreground">{t.label}</span>
              <button
                onClick={() => onRemove(t.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomAppThemesSection({
  customAppThemes,
  currentId,
  onAdd,
  onRemove,
  onSelect,
}: {
  customAppThemes: CustomAppTheme[];
  currentId: string;
  onAdd: (t: CustomAppTheme) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [css, setCss] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [showDocs, setShowDocs] = useState(false);

  const handleAdd = () => {
    const trimmedName = name.trim();
    const trimmedCss = css.trim();
    if (!trimmedName || !trimmedCss) return;
    const slug = `theme-${trimmedName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")}`;
    const id = `${slug}-${Date.now()}`;
    onAdd({ id, label: trimmedName, css: trimmedCss, isDark });
    onSelect(id);
    setName("");
    setCss("");
    setIsDark(true);
    setOpen(false);
  };

  return (
    <div className="py-3 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-foreground">Custom app themes</p>
          <p className="text-[11px] text-muted-foreground">Define your own CSS variable palette</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDocs((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Show documentation"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              setShowDocs(false);
            }}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {open ? "Cancel" : "+ Add theme"}
          </button>
        </div>
      </div>

      {showDocs && !open && (
        <div className="mb-3 rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
            <BookOpen className="h-3 w-3 text-primary shrink-0" />
            <span className="text-[11px] font-semibold text-foreground">
              How to create a custom app theme
            </span>
          </div>
          <div className="px-3 py-2.5 space-y-2 text-[11px] text-muted-foreground leading-relaxed">
            <p>
              A custom app theme is a block of CSS that overrides the design token variables used
              across the entire UI. Here's the process:
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                Click <span className="text-foreground font-medium">+ Add theme</span>, then click{" "}
                <span className="text-foreground font-medium">Load template</span> to pre-fill the
                CSS input with a full working example.
              </li>
              <li>
                Change{" "}
                <code className="text-primary bg-primary/10 px-1 rounded">html.theme-my-theme</code>{" "}
                to a unique class name — e.g.{" "}
                <code className="text-primary bg-primary/10 px-1 rounded">
                  html.theme-rose-pine
                </code>
                . The class <strong>must</strong> start with{" "}
                <code className="text-primary bg-primary/10 px-1 rounded">theme-</code>.
              </li>
              <li>Adjust the HSL values. Each variable is documented in the template comments.</li>
              <li>
                Surface colors (
                <code className="text-primary bg-primary/10 px-1 rounded">background</code>,{" "}
                <code className="text-primary bg-primary/10 px-1 rounded">card</code>,{" "}
                <code className="text-primary bg-primary/10 px-1 rounded">muted</code>,{" "}
                <code className="text-primary bg-primary/10 px-1 rounded">sidebar</code>){" "}
                <strong>must</strong> include{" "}
                <code className="text-primary bg-primary/10 px-1 rounded">/ 0.92</code> alpha so the
                window opacity slider and macOS vibrancy work correctly.
              </li>
              <li>
                Toggle <span className="text-foreground font-medium">Dark mode</span> to match your
                theme's brightness — this controls how the editor renders text.
              </li>
            </ol>
            <p className="pt-1 border-t border-border/60">
              The CSS is injected as a{" "}
              <code className="text-primary bg-primary/10 px-1 rounded">&lt;style&gt;</code> tag and
              the matching class is added to{" "}
              <code className="text-primary bg-primary/10 px-1 rounded">&lt;html&gt;</code>,
              overriding the built-in theme entirely. You can paste any valid CSS inside your theme
              block — including custom fonts or additional overrides.
            </p>
          </div>
        </div>
      )}

      {open && (
        <div className="space-y-2 mb-3 p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <label
                htmlFor="app-theme-name"
                className="text-[11px] text-muted-foreground mb-1 block"
              >
                Theme name
              </label>
              <input
                id="app-theme-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rose Pine"
                className="w-full h-7 rounded-md border border-border bg-muted px-2 text-xs text-foreground outline-none focus:border-ring"
              />
            </div>
            <div className="shrink-0 pt-4">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Switch id="app-theme-dark-toggle" checked={isDark} onCheckedChange={setIsDark} />
                <label htmlFor="app-theme-dark-toggle" className="cursor-pointer select-none">
                  Dark mode
                </label>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="app-theme-css" className="text-[11px] text-muted-foreground">
                CSS
              </label>
              <button
                type="button"
                onClick={() => setCss(CUSTOM_APP_THEME_TEMPLATE)}
                className="text-[11px] text-primary hover:text-primary/80 transition-colors"
              >
                Load template
              </button>
            </div>
            <textarea
              id="app-theme-css"
              value={css}
              onChange={(e) => setCss(e.target.value)}
              placeholder={`html.theme-my-theme {\n  --color-background: hsl(222 13% 9% / 0.92);\n  --color-primary: hsl(217 91% 65%);\n  /* ... */\n}`}
              rows={8}
              className="w-full rounded-md border border-border bg-muted px-2 py-1.5 text-xs text-foreground font-mono outline-none focus:border-ring resize-none"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!name.trim() || !css.trim()}
            className="w-full h-7 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add theme
          </button>
        </div>
      )}

      {customAppThemes.length > 0 && (
        <div className="space-y-1.5">
          {customAppThemes.map((t) => (
            <div
              key={t.id}
              className={cn(
                "flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors cursor-pointer",
                currentId === t.id
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-muted/30 hover:bg-accent/50"
              )}
              onClick={() => onSelect(t.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="h-4 w-4 rounded shrink-0 border border-black/10"
                  style={{ background: t.isDark ? "hsl(222 13% 12%)" : "hsl(0 0% 95%)" }}
                />
                <span className="font-medium text-foreground truncate">{t.label}</span>
                <span className="text-muted-foreground">{t.isDark ? "dark" : "light"}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(t.id);
                }}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TypesTab() {
  const { entries, setColor, removeColor } = useTypeColorsStore();
  const [newType, setNewType] = useState("");
  const [newColor, setNewColor] = useState("blue");

  const handleAdd = () => {
    const t = newType.trim().toLowerCase();
    if (!t) return;
    setColor(t, newColor);
    setNewType("");
    setNewColor("blue");
  };

  return (
    <div className="space-y-4 pt-2">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Map frontmatter <code className="text-primary bg-primary/10 px-1 rounded">type:</code>{" "}
        values to pill colors in the preview bar. Works for any type string — not just the built-in
        ones.
      </p>

      <div className="space-y-1.5">
        {entries.map((entry) => (
          <div
            key={entry.type}
            className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
          >
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{
                background: PRESET_COLORS.find((c) => c.value === entry.color)?.preview ?? "#888",
              }}
            />
            <span className="flex-1 text-xs font-medium text-foreground truncate">
              {entry.type}
            </span>

            <div className="flex items-center gap-1 flex-wrap justify-end">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(entry.type, c.value)}
                  className="h-4 w-4 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: c.preview,
                    borderColor:
                      entry.color === c.value ? "hsl(var(--color-foreground))" : "transparent",
                  }}
                />
              ))}
            </div>

            <div
              className="text-[10px] px-2 py-0.5 rounded-full border shrink-0"
              style={{
                borderColor: typeColorStyles(entry.color).border,
                color: typeColorStyles(entry.color).text,
                backgroundColor: typeColorStyles(entry.color).bg,
              }}
            >
              {entry.type}
            </div>

            <button
              type="button"
              onClick={() => removeColor(entry.type)}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0 text-[11px]"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2.5">
        <p className="text-[11px] font-medium text-foreground">Add type</p>
        <div className="flex items-center gap-2">
          <input
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. project, adr, meeting"
            className="flex-1 h-7 rounded-md border border-border bg-muted px-2 text-xs text-foreground outline-none focus:border-ring"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newType.trim()}
            className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setNewColor(c.value)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] transition-colors"
              style={{
                borderColor: newColor === c.value ? c.preview : "transparent",
                background: newColor === c.value ? `${c.preview}18` : "transparent",
                color: newColor === c.value ? c.preview : "hsl(var(--color-muted-foreground))",
              }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: c.preview }}
              />
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsSheet() {
  const {
    settingsOpen,
    setSettingsOpen,
    appTheme,
    setAppTheme,
    customAppThemeId,
    setCustomAppThemeId,
    customAppThemes,
    addCustomAppTheme,
    removeCustomAppTheme,
    editorTheme,
    setEditorTheme,
    hljsTheme,
    setHljsTheme,
    fontSize,
    setFontSize,
    lineNumbers,
    setLineNumbers,
    lineWrapping,
    setLineWrapping,
    vimMode,
    setVimMode,
    autoSave,
    setAutoSave,
    autoSaveDelay,
    setAutoSaveDelay,
    windowOpacity,
    setWindowOpacity,
    windowBlur,
    setWindowBlur,
    windowBlurRadius,
    setWindowBlurRadius,
    textBrightness,
    setTextBrightness,
    setTourActive,
    resetOnboarding,
    customThemes,
    addCustomTheme,
    removeCustomTheme,
    customEditorThemes,
    addCustomEditorTheme,
    removeCustomEditorTheme,
    customEditorThemeId,
    setCustomEditorThemeId,
  } = useSettingsStore();

  const { fileTree, activeTagFilter, setActiveTagFilter } = useEditorStore();
  const [fileTags, setFileTags] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    const mdFiles = flattenFiles(fileTree).filter(
      (f) => f.name.endsWith(".md") || f.name.endsWith(".markdown")
    );
    if (mdFiles.length === 0) return;
    const tagMap = new Map<string, string[]>();
    Promise.all(
      mdFiles.map(async (f) => {
        try {
          const content = await readFile(f.path);
          const { frontmatter } = parseFrontmatter(content);
          if (frontmatter?.tags?.length) tagMap.set(f.path, frontmatter.tags);
        } catch (_e) {
          return;
        }
      })
    ).then(() => setFileTags(new Map(tagMap)));
  }, [fileTree]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tags of fileTags.values())
      for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [fileTags]);

  return (
    <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[291] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <Dialog.Content
          data-tour="settings-panel"
          className={cn(
            "fixed right-0 top-0 h-full w-[420px] z-[292] flex flex-col",
            "bg-card border-l border-border shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            "duration-200"
          )}
        >
          <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
            <Dialog.Title className="text-sm font-semibold text-foreground tracking-tight">
              Settings
            </Dialog.Title>
            <Dialog.Close className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <Tabs defaultValue="appearance" className="flex flex-col flex-1 min-h-0">
            <div className="px-5 pt-4 pb-2 shrink-0">
              <TabsList className="w-full grid grid-cols-6 h-8 text-[11px]">
                <TabsTrigger value="appearance" className="gap-1 text-[11px]">
                  <Palette className="h-3 w-3" />
                  <span className="hidden sm:inline">Look</span>
                </TabsTrigger>
                <TabsTrigger value="editor" className="gap-1 text-[11px]">
                  <SlidersHorizontal className="h-3 w-3" />
                  <span className="hidden sm:inline">Edit</span>
                </TabsTrigger>
                <TabsTrigger value="types" className="gap-1 text-[11px]">
                  <BookOpen className="h-3 w-3" />
                  <span className="hidden sm:inline">Types</span>
                </TabsTrigger>
                <TabsTrigger value="templates" className="gap-1 text-[11px]">
                  <LayoutTemplate className="h-3 w-3" />
                  <span className="hidden sm:inline">Tpl</span>
                </TabsTrigger>
                <TabsTrigger value="tags" className="gap-1 text-[11px]">
                  <Tag className="h-3 w-3" />
                  <span className="hidden sm:inline">Tags</span>
                </TabsTrigger>
                <TabsTrigger value="about" className="gap-1 text-[11px]">
                  <Info className="h-3 w-3" />
                  <span className="hidden sm:inline">About</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-5 pb-8">
                <TabsContent value="appearance">
                  <div className="divide-y divide-border">
                    <SettingRow
                      label="App theme"
                      description="Overall color palette for the entire interface"
                    >
                      <Select
                        value={customAppThemeId || appTheme}
                        onValueChange={(v) => {
                          if (v.startsWith("theme-") || customAppThemes.some((t) => t.id === v)) {
                            setCustomAppThemeId(v);
                          } else {
                            setAppTheme(v as AppTheme);
                          }
                        }}
                      >
                        <SelectTrigger className="w-44 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {APP_THEMES.map((t) => (
                            <SelectItem key={t.id} value={t.id} className="text-xs">
                              {t.label}
                            </SelectItem>
                          ))}
                          {customAppThemes.length > 0 && (
                            <>
                              <div className="mx-1 my-1 h-px bg-border" />
                              {customAppThemes.map((t) => (
                                <SelectItem key={t.id} value={t.id} className="text-xs">
                                  {t.label}{" "}
                                  <span className="text-muted-foreground ml-1">custom</span>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    <CustomAppThemesSection
                      customAppThemes={customAppThemes}
                      currentId={customAppThemeId}
                      onAdd={(t) => addCustomAppTheme(t)}
                      onRemove={(id) => removeCustomAppTheme(id)}
                      onSelect={(id) => setCustomAppThemeId(id)}
                    />

                    <SettingRow
                      label="Editor theme"
                      description="Syntax highlighting theme in the editor"
                    >
                      <Select
                        value={customEditorThemeId || editorTheme}
                        onValueChange={(v) => {
                          if (v.startsWith("custom-")) {
                            setCustomEditorThemeId(v);
                          } else {
                            setCustomEditorThemeId("");
                            setEditorTheme(v as EditorTheme);
                          }
                        }}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EDITOR_THEMES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-xs">
                              {t.label}
                            </SelectItem>
                          ))}
                          {customEditorThemes.length > 0 && (
                            <>
                              <div className="mx-1 my-1 h-px bg-border" />
                              {customEditorThemes.map((t) => (
                                <SelectItem key={t.id} value={t.id} className="text-xs">
                                  {t.label}{" "}
                                  <span className="text-muted-foreground ml-1">custom</span>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    <CustomThemesSection
                      label="Custom editor themes"
                      description="Paste CSS targeting .cm-editor, .cm-content, .cm-line"
                      linkHref="https://codemirror.net/examples/styling/"
                      linkLabel="CodeMirror styling docs"
                      customThemes={customEditorThemes}
                      currentThemeId={customEditorThemeId}
                      onAdd={(t) => {
                        addCustomEditorTheme(t);
                        setCustomEditorThemeId(t.id);
                      }}
                      onRemove={(id) => {
                        removeCustomEditorTheme(id);
                        if (customEditorThemeId === id) setCustomEditorThemeId("");
                      }}
                    />

                    <SettingRow
                      label="Code block theme"
                      description="Syntax highlighting in the preview pane"
                    >
                      <Select value={hljsTheme} onValueChange={(v) => setHljsTheme(v as HljsTheme)}>
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HLJS_THEMES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-xs">
                              {t.label}
                            </SelectItem>
                          ))}
                          {customThemes.length > 0 && (
                            <>
                              <div className="mx-1 my-1 h-px bg-border" />
                              {customThemes.map((t) => (
                                <SelectItem key={t.id} value={t.id} className="text-xs">
                                  {t.label}{" "}
                                  <span className="text-muted-foreground ml-1">custom</span>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    <CustomThemesSection
                      label="Custom code block themes"
                      description="Paste any highlight.js-compatible CSS"
                      linkHref="https://highlightjs.org/examples"
                      linkLabel="find themes at highlightjs.org"
                      customThemes={customThemes}
                      currentThemeId={hljsTheme}
                      onAdd={(t) => {
                        addCustomTheme(t);
                        setHljsTheme(t.id);
                      }}
                      onRemove={(id) => {
                        removeCustomTheme(id);
                        if (hljsTheme === id) setHljsTheme("github-dark");
                      }}
                    />

                    <SettingRow label="Font size" description={`Editor font size: ${fontSize}px`}>
                      <div className="flex items-center gap-3 w-44">
                        <Slider
                          min={11}
                          max={20}
                          step={1}
                          value={[fontSize]}
                          onValueChange={([v]) => setFontSize(v)}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                          {fontSize}px
                        </span>
                      </div>
                    </SettingRow>

                    <SettingRow
                      label="Window opacity"
                      description={`Background opacity: ${windowOpacity}%`}
                    >
                      <div className="flex items-center gap-3 w-44">
                        <Slider
                          min={30}
                          max={100}
                          step={5}
                          value={[windowOpacity]}
                          onValueChange={([v]) => setWindowOpacity(v)}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                          {windowOpacity}%
                        </span>
                      </div>
                    </SettingRow>

                    <SettingRow
                      label="Text brightness"
                      description={`Boost text contrast: ${textBrightness}%`}
                    >
                      <div className="flex items-center gap-3 w-44">
                        <Slider
                          min={100}
                          max={200}
                          step={5}
                          value={[textBrightness]}
                          onValueChange={([v]) => setTextBrightness(v)}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                          {textBrightness}%
                        </span>
                      </div>
                    </SettingRow>

                    <SettingRow
                      label="Vibrancy / blur"
                      description="Apply background blur effect (macOS)"
                    >
                      <Switch checked={windowBlur} onCheckedChange={setWindowBlur} />
                    </SettingRow>

                    {windowBlur && (
                      <SettingRow
                        label="Blur radius"
                        description={`Blur intensity: ${windowBlurRadius}px`}
                      >
                        <div className="flex items-center gap-3 w-44">
                          <Slider
                            min={4}
                            max={40}
                            step={2}
                            value={[windowBlurRadius]}
                            onValueChange={([v]) => setWindowBlurRadius(v)}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                            {windowBlurRadius}px
                          </span>
                        </div>
                      </SettingRow>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="editor">
                  <div className="divide-y divide-border">
                    <SettingRow
                      label="Line numbers"
                      description="Show line numbers in the editor gutter"
                    >
                      <Switch checked={lineNumbers} onCheckedChange={setLineNumbers} />
                    </SettingRow>
                    <SettingRow
                      label="Line wrapping"
                      description="Wrap long lines instead of scrolling"
                    >
                      <Switch checked={lineWrapping} onCheckedChange={setLineWrapping} />
                    </SettingRow>
                    <SettingRow
                      label="Vim keybindings"
                      description="Enable modal editing with normal, insert, and visual modes"
                    >
                      <Switch checked={vimMode} onCheckedChange={setVimMode} />
                    </SettingRow>
                    <SettingRow label="Auto-save" description="Automatically save after a delay">
                      <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                    </SettingRow>
                    {autoSave && (
                      <SettingRow
                        label="Auto-save delay"
                        description={`Save after ${autoSaveDelay / 1000}s of inactivity`}
                      >
                        <div className="flex items-center gap-3 w-44">
                          <Slider
                            min={500}
                            max={5000}
                            step={500}
                            value={[autoSaveDelay]}
                            onValueChange={([v]) => setAutoSaveDelay(v)}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                            {autoSaveDelay / 1000}s
                          </span>
                        </div>
                      </SettingRow>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="types">
                  <TypesTab />
                </TabsContent>

                <TabsContent value="templates">
                  <TemplatesTab onClose={() => setSettingsOpen(false)} />
                </TabsContent>

                <TabsContent value="tags">
                  {tagCounts.length === 0 ? (
                    <div className="py-12 text-center">
                      <Tag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        {fileTree.length === 0
                          ? "Open a folder to see tags"
                          : "No tags found in this folder"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-3">
                        {tagCounts.length} tag{tagCounts.length !== 1 ? "s" : ""} across{" "}
                        {fileTree.length} file{fileTree.length !== 1 ? "s" : ""}. Click to filter
                        the file tree.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tagCounts.map(([tag, count]) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setActiveTagFilter(activeTagFilter === tag ? null : tag);
                              setSettingsOpen(false);
                            }}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                              activeTagFilter === tag
                                ? "bg-primary/15 text-primary border-primary/30"
                                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border/80"
                            )}
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                            <Badge
                              variant="secondary"
                              className="h-4 px-1.5 text-[10px] rounded-full bg-muted border-0 text-muted-foreground ml-0.5"
                            >
                              {count}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="about">
                  <div className="space-y-6">
                    <button
                      onClick={() => {
                        setSettingsOpen(false);
                        setTimeout(() => setTourActive(true), 200);
                      }}
                      className="w-full flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-3.5 text-left transition-colors group"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">Take the tour</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Interactive walkthrough of all features
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary ml-auto transition-colors" />
                    </button>

                    <button
                      onClick={() => {
                        resetOnboarding();
                        setSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 rounded-xl border border-border hover:border-destructive/40 bg-muted/30 hover:bg-destructive/5 px-4 py-3.5 text-left transition-colors group"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          Reset onboarding
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Clear setup state and reopen the welcome wizard
                        </div>
                      </div>
                    </button>

                    <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2.5">
                      {[
                        ["App", "md-editor"],
                        ["Version", "0.1.0"],
                        ["Runtime", "Tauri v2"],
                        ["Frontend", "React 19 + TypeScript"],
                        ["Backend", "Rust + pulldown-cmark"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="text-foreground font-medium">{v}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <Keyboard className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-foreground">
                          Keyboard shortcuts
                        </span>
                      </div>
                      <div className="space-y-2">
                        {SHORTCUTS.map(({ keys, desc }) => (
                          <div key={desc} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{desc}</span>
                            <div className="flex items-center gap-0.5">
                              {keys.map((k, i) => (
                                <kbd
                                  key={i}
                                  className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground shadow-sm"
                                >
                                  {k}
                                </kbd>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
