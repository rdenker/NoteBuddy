import { Annotation, EditorSelection, type TransactionSpec } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

const ToolbarChange = Annotation.define<boolean>();

function run(view: EditorView, spec: TransactionSpec) {
  view.dispatch(view.state.update({ ...spec, annotations: ToolbarChange.of(true) }));
}

function toggleInline(view: EditorView, marker: string, close = marker) {
  const spec = view.state.changeByRange((range) => {
    const selected = view.state.sliceDoc(range.from, range.to);
    if (
      selected.startsWith(marker) &&
      selected.endsWith(close) &&
      selected.length >= marker.length + close.length
    ) {
      const inner = selected.slice(marker.length, selected.length - close.length);
      return {
        changes: { from: range.from, to: range.to, insert: inner },
        range: EditorSelection.range(range.from, range.from + inner.length),
      };
    }
    const insert = marker + selected + close;
    return {
      changes: { from: range.from, to: range.to, insert },
      range:
        selected.length === 0
          ? EditorSelection.cursor(range.from + marker.length)
          : EditorSelection.range(
              range.from + marker.length,
              range.from + marker.length + selected.length
            ),
    };
  });
  run(view, { ...spec, scrollIntoView: true, userEvent: "input" });
}

function toggleLinePrefix(view: EditorView, prefix: string) {
  const state = view.state;
  const changes: { from: number; to: number; insert: string }[] = [];
  const seen = new Set<number>();
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from);
    const endLine = state.doc.lineAt(range.to);
    for (let ln = startLine.number; ln <= endLine.number; ln++) {
      if (seen.has(ln)) continue;
      seen.add(ln);
      const line = state.doc.line(ln);
      if (line.text.startsWith(prefix)) {
        changes.push({ from: line.from, to: line.from + prefix.length, insert: "" });
      } else {
        changes.push({ from: line.from, to: line.from, insert: prefix });
      }
    }
  }
  run(view, { changes, scrollIntoView: true, userEvent: "input" });
}

function toggleHeading(view: EditorView, level: 1 | 2 | 3) {
  const prefix = "#".repeat(level) + " ";
  const state = view.state;
  const line = state.doc.lineAt(state.selection.main.from);
  const stripped = line.text.replace(/^#{1,6}\s/, "");
  const insert = line.text === prefix + stripped ? stripped : prefix + stripped;
  run(view, {
    changes: { from: line.from, to: line.to, insert },
    scrollIntoView: true,
    userEvent: "input",
  });
}

export const editorCmd = {
  bold: (v: EditorView) => toggleInline(v, "**"),
  italic: (v: EditorView) => toggleInline(v, "*"),
  strikethrough: (v: EditorView) => toggleInline(v, "~~"),
  inlineCode: (v: EditorView) => toggleInline(v, "`"),
  h1: (v: EditorView) => toggleHeading(v, 1),
  h2: (v: EditorView) => toggleHeading(v, 2),
  h3: (v: EditorView) => toggleHeading(v, 3),
  blockquote: (v: EditorView) => toggleLinePrefix(v, "> "),
  bulletList: (v: EditorView) => toggleLinePrefix(v, "- "),
  orderedList: (v: EditorView) => toggleLinePrefix(v, "1. "),
  taskList: (v: EditorView) => toggleLinePrefix(v, "- [ ] "),

  codeBlock: (v: EditorView) => {
    const state = v.state;
    const spec = state.changeByRange((range) => {
      const sel = state.sliceDoc(range.from, range.to);
      const insert = "```\n" + sel + "\n```";
      return {
        changes: { from: range.from, to: range.to, insert },
        range: EditorSelection.cursor(range.from + 4 + sel.length),
      };
    });
    run(v, { ...spec, scrollIntoView: true, userEvent: "input" });
  },

  link: (v: EditorView) => {
    const state = v.state;
    const spec = state.changeByRange((range) => {
      const sel = state.sliceDoc(range.from, range.to);
      const insert = sel ? `[${sel}](url)` : "[text](url)";
      return {
        changes: { from: range.from, to: range.to, insert },
        range: sel
          ? EditorSelection.range(range.from + 1, range.from + 1 + sel.length)
          : EditorSelection.range(range.from + 1, range.from + 5),
      };
    });
    run(v, { ...spec, scrollIntoView: true, userEvent: "input" });
  },

  image: (v: EditorView) => {
    const state = v.state;
    const spec = state.changeByRange((range) => {
      const sel = state.sliceDoc(range.from, range.to);
      const insert = sel ? `![${sel}](url)` : "![alt](url)";
      return {
        changes: { from: range.from, to: range.to, insert },
        range: EditorSelection.range(range.from + 2, range.from + 2 + (sel || "alt").length),
      };
    });
    run(v, { ...spec, scrollIntoView: true, userEvent: "input" });
  },

  table: (v: EditorView) => {
    const state = v.state;
    const pos = state.selection.main.to;
    const insert =
      "\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n";
    run(v, {
      changes: { from: pos, insert },
      selection: EditorSelection.cursor(pos + insert.length),
      scrollIntoView: true,
      userEvent: "input",
    });
  },

  hr: (v: EditorView) => {
    const state = v.state;
    const line = state.doc.lineAt(state.selection.main.from);
    const insert = (line.text.trim() === "" ? "" : "\n") + "\n---\n\n";
    const pos = line.to;
    run(v, {
      changes: { from: pos, insert },
      selection: EditorSelection.cursor(pos + insert.length),
      scrollIntoView: true,
      userEvent: "input",
    });
  },
} as const;
