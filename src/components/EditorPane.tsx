import { autocompletion, type Completion, type CompletionContext } from "@codemirror/autocomplete";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { openSearchPanel, search, searchKeymap } from "@codemirror/search";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { getCM, vim } from "@replit/codemirror-vim";
import { aura } from "@uiw/codemirror-theme-aura";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { githubLight } from "@uiw/codemirror-theme-github";
import { gruvboxDark } from "@uiw/codemirror-theme-gruvbox-dark";
import { material } from "@uiw/codemirror-theme-material";
import { monokai } from "@uiw/codemirror-theme-monokai";
import { nord } from "@uiw/codemirror-theme-nord";
import { solarizedDark, solarizedLight } from "@uiw/codemirror-theme-solarized";
import { sublime } from "@uiw/codemirror-theme-sublime";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useEffect, useMemo, useRef } from "react";
import { codeBlockCompletion } from "@/lib/codeBlockCompletion";
import { emojiCompletion } from "@/lib/emojiCompletion";
import { handleImageDrop, handleImagePaste } from "@/lib/imagePaste";
import { editorView } from "@/lib/editorRef";
import { CustomSearchPanel } from "@/lib/searchPanel";
import { useEditorStore } from "@/store/editor";
import { useSettingsStore } from "@/store/settings";
import { EditorToolbar } from "@/components/EditorToolbar";

interface EditorPaneProps {
  onChange: (value: string) => void;
}

export function openFindReplace() {
  const view = editorView.current;
  if (view) openSearchPanel(view);
}

function formatVimModeLabel(event: { mode: string; subMode?: string }) {
  if (event.mode === "visual") {
    if (event.subMode === "linewise") return "VISUAL LINE";
    if (event.subMode === "blockwise") return "VISUAL BLOCK";
    return "VISUAL";
  }

  return event.mode.toUpperCase();
}

function markdownCompletions(context: CompletionContext) {
  const line = context.state.doc.lineAt(context.pos);
  const lineText = line.text;
  const col = context.pos - line.from;
  const textBefore = lineText.slice(0, col);

  const snippets: Completion[] = [
    { label: "# Heading 1", type: "text", apply: "# ", detail: "h1" },
    { label: "## Heading 2", type: "text", apply: "## ", detail: "h2" },
    { label: "### Heading 3", type: "text", apply: "### ", detail: "h3" },
    { label: "**bold**", type: "text", apply: "**bold**", detail: "bold" },
    { label: "*italic*", type: "text", apply: "*italic*", detail: "italic" },
    { label: "~~strikethrough~~", type: "text", apply: "~~strikethrough~~", detail: "strike" },
    { label: "`inline code`", type: "text", apply: "`code`", detail: "inline code" },
    { label: "```code block", type: "text", apply: "```\n\n```", detail: "fenced code block" },
    { label: "```rust", type: "text", apply: "```rust\n\n```", detail: "Rust block" },
    {
      label: "```typescript",
      type: "text",
      apply: "```typescript\n\n```",
      detail: "TypeScript block",
    },
    { label: "```python", type: "text", apply: "```python\n\n```", detail: "Python block" },
    { label: "```bash", type: "text", apply: "```bash\n\n```", detail: "Shell block" },
    { label: "[link](url)", type: "text", apply: "[text](url)", detail: "hyperlink" },
    { label: "![image](url)", type: "text", apply: "![alt](url)", detail: "image" },
    { label: "> blockquote", type: "text", apply: "> ", detail: "blockquote" },
    { label: "- [ ] task", type: "text", apply: "- [ ] ", detail: "task list item" },
    {
      label: "| table |",
      type: "text",
      apply: "| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |",
      detail: "table",
    },
    { label: "---", type: "text", apply: "---", detail: "horizontal rule" },
  ];

  const word = context.matchBefore(/\S*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const prefix = textBefore.trimStart();
  if (
    prefix.startsWith("#") ||
    prefix.startsWith("*") ||
    prefix.startsWith("`") ||
    prefix.startsWith("[") ||
    prefix.startsWith("!") ||
    prefix.startsWith(">") ||
    prefix.startsWith("-") ||
    prefix.startsWith("|") ||
    prefix === ""
  ) {
    return { from: word.from, options: snippets, validFor: /^\S*$/ };
  }

  return null;
}

const THEMES = {
  vscodeDark,
  oneDark,
  githubLight,
  dracula,
  nord,
  tokyoNight,
  material,
  sublime,
  solarizedDark,
  solarizedLight,
  gruvboxDark,
  monokai,
  aura,
};

function applyCustomEditorTheme(css: string | null) {
  let style = document.getElementById("cm-custom-theme") as HTMLStyleElement | null;
  if (!css) {
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = "cm-custom-theme";
    document.head.appendChild(style);
  }
  style.textContent = css;
}

export function EditorPane({ onChange }: EditorPaneProps) {
  const content = useEditorStore((s) => s.content);
  const rootDir = useEditorStore((s) => s.rootDir);
  const {
    editorTheme,
    fontSize,
    lineNumbers,
    lineWrapping,
    vimMode,
    customEditorThemes,
    customEditorThemeId,
  } = useSettingsStore();
  const cmRef = useRef<ReactCodeMirrorRef>(null);

  const activeCustomTheme = customEditorThemes.find((t) => t.id === customEditorThemeId);

  useEffect(() => {
    applyCustomEditorTheme(activeCustomTheme?.css ?? null);
    return () => applyCustomEditorTheme(null);
  }, [activeCustomTheme?.css]);

  useEffect(() => {
    return () => {
      editorView.current = null;
    };
  }, []);

  useEffect(() => {
    const view = cmRef.current?.view;
    const setVimModeLabel = useEditorStore.getState().setVimModeLabel;

    if (!view || !vimMode) {
      setVimModeLabel(null);
      return;
    }

    const cm = getCM(view);
    if (!cm) {
      setVimModeLabel(null);
      return;
    }

    const handleModeChange = (event: { mode: string; subMode?: string }) => {
      setVimModeLabel(formatVimModeLabel(event));
    };

    cm.on("vim-mode-change", handleModeChange);
    setVimModeLabel("NORMAL");

    return () => {
      cm.off("vim-mode-change", handleModeChange);
      setVimModeLabel(null);
    };
  }, [vimMode]);

  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage, codeLanguages: languages, addKeymap: true }),
      search({ createPanel: (view) => new CustomSearchPanel(view) }),
      keymap.of(searchKeymap),
      autocompletion({
        override: [emojiCompletion, codeBlockCompletion, markdownCompletions],
        activateOnTyping: true,
        icons: true,
      }),
      ...(vimMode ? [vim()] : []),
      ...(lineWrapping ? [EditorView.lineWrapping] : []),
      EditorView.domEventHandlers({
        paste: (e) => {
          handleImagePaste(e, rootDir).then((rel) => {
            if (!rel) return;
            const view = cmRef.current?.view;
            if (view) {
              const pos = view.state.selection.main.head;
              view.dispatch({ changes: { from: pos, insert: `\n![image](${rel})\n` } });
            } else {
              const store = useEditorStore.getState();
              store.setContent(`${store.content}\n![image](${rel})\n`);
            }
          });
          return false;
        },
        dragover: (e) => {
          const hasImage = Array.from(e.dataTransfer?.items ?? []).some((i) =>
            i.type.startsWith("image/")
          );
          if (hasImage) e.preventDefault();
          return false;
        },
        drop: (e) => {
          const file = Array.from(e.dataTransfer?.files ?? []).find((f) =>
            f.type.startsWith("image/")
          );
          if (!file) return false;
          e.preventDefault();
          handleImageDrop(file, rootDir).then((rel) => {
            if (!rel) return;
            const view = cmRef.current?.view;
            if (view) {
              const pos =
                view.posAtCoords({ x: e.clientX, y: e.clientY }) ?? view.state.selection.main.head;
              view.dispatch({ changes: { from: pos, insert: `\n![${file.name}](${rel})\n` } });
            }
          });
          return true;
        },
      }),
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: `${fontSize}px`,
          fontFamily: "ui-monospace, 'JetBrains Mono', 'Fira Code', monospace",
        },
        ".cm-scroller": { overflow: "auto", fontFamily: "inherit" },
        ".cm-content": { padding: "1rem", minHeight: "100%" },
        ".cm-gutters": { backgroundColor: "hsl(0 0% 9%)", border: "none", paddingRight: "8px" },
        ".cm-activeLine": { backgroundColor: "hsl(0 0% 12%)" },
        ".cm-activeLineGutter": { backgroundColor: "hsl(0 0% 12%)" },
        ".cm-tooltip.cm-tooltip-autocomplete": {
          backgroundColor: "hsl(0 0% 13%)",
          border: "1px solid hsl(0 0% 20%)",
          borderRadius: "6px",
          overflow: "hidden",
        },
        ".cm-tooltip-autocomplete ul li": {
          padding: "3px 10px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: "0.8rem",
        },
        ".cm-tooltip-autocomplete ul li[aria-selected]": {
          backgroundColor: "hsl(213 94% 68% / 0.2)",
          color: "hsl(0 0% 93%)",
        },
        ".cm-completionDetail": { color: "hsl(0 0% 50%)", marginLeft: "8px", fontSize: "0.75rem" },
        ".cm-completionLabel": { fontFamily: "ui-sans-serif, system-ui, sans-serif" },
      }),
    ],
    [fontSize, lineWrapping, rootDir, vimMode]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <EditorToolbar />
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          ref={cmRef}
          value={content}
          height="100%"
          theme={
            activeCustomTheme ? "none" : (THEMES[editorTheme as keyof typeof THEMES] ?? vscodeDark)
          }
          extensions={extensions}
          onChange={onChange}
          onCreateEditor={(view) => {
            editorView.current = view;
          }}
          style={{ height: "100%" }}
          basicSetup={{
            lineNumbers,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
          }}
        />
      </div>
    </div>
  );
}
