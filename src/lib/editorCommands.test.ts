import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, it, expect, afterEach } from "vitest";
import { editorCmd } from "./editorCommands";

function makeView(doc: string, from = doc.length, to = from): EditorView {
  const state = EditorState.create({
    doc,
    selection: { anchor: from, head: to },
  });
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  return new EditorView({ state, parent });
}

function text(view: EditorView) {
  return view.state.doc.toString();
}

function sel(view: EditorView) {
  const { from, to } = view.state.selection.main;
  return { from, to };
}

let view: EditorView;
afterEach(() => {
  view?.destroy();
});

describe("toggleInline — bold", () => {
  it("wraps empty cursor with ** and places cursor inside", () => {
    view = makeView("hello", 5);
    editorCmd.bold(view);
    expect(text(view)).toBe("hello****");
    expect(sel(view).from).toBe(7);
    expect(sel(view).to).toBe(7);
  });

  it("wraps selection", () => {
    view = makeView("hello world", 6, 11);
    editorCmd.bold(view);
    expect(text(view)).toBe("hello **world**");
    expect(sel(view)).toEqual({ from: 8, to: 13 });
  });

  it("unwraps already-bold selection", () => {
    view = makeView("**world**", 0, 9);
    editorCmd.bold(view);
    expect(text(view)).toBe("world");
  });
});

describe("toggleInline — italic", () => {
  it("wraps selection", () => {
    view = makeView("text", 0, 4);
    editorCmd.italic(view);
    expect(text(view)).toBe("*text*");
  });

  it("unwraps italic", () => {
    view = makeView("*text*", 0, 6);
    editorCmd.italic(view);
    expect(text(view)).toBe("text");
  });
});

describe("toggleInline — strikethrough", () => {
  it("wraps selection", () => {
    view = makeView("abc", 0, 3);
    editorCmd.strikethrough(view);
    expect(text(view)).toBe("~~abc~~");
  });
});

describe("toggleInline — inlineCode", () => {
  it("wraps selection", () => {
    view = makeView("foo", 0, 3);
    editorCmd.inlineCode(view);
    expect(text(view)).toBe("`foo`");
  });

  it("unwraps", () => {
    view = makeView("`foo`", 0, 5);
    editorCmd.inlineCode(view);
    expect(text(view)).toBe("foo");
  });
});

describe("toggleHeading", () => {
  it("h1 — adds prefix to plain line", () => {
    view = makeView("My heading", 0);
    editorCmd.h1(view);
    expect(text(view)).toBe("# My heading");
  });

  it("h2 — adds prefix", () => {
    view = makeView("My heading", 0);
    editorCmd.h2(view);
    expect(text(view)).toBe("## My heading");
  });

  it("h3 — adds prefix", () => {
    view = makeView("My heading", 0);
    editorCmd.h3(view);
    expect(text(view)).toBe("### My heading");
  });

  it("h1 — removes prefix when already h1", () => {
    view = makeView("# My heading", 0);
    editorCmd.h1(view);
    expect(text(view)).toBe("My heading");
  });

  it("h1 — replaces h2 prefix", () => {
    view = makeView("## My heading", 0);
    editorCmd.h1(view);
    expect(text(view)).toBe("# My heading");
  });

  it("h2 — replaces h3 prefix", () => {
    view = makeView("### My heading", 0);
    editorCmd.h2(view);
    expect(text(view)).toBe("## My heading");
  });
});

describe("toggleLinePrefix — blockquote", () => {
  it("adds > prefix", () => {
    view = makeView("line", 0);
    editorCmd.blockquote(view);
    expect(text(view)).toBe("> line");
  });

  it("removes > prefix", () => {
    view = makeView("> line", 0);
    editorCmd.blockquote(view);
    expect(text(view)).toBe("line");
  });
});

describe("toggleLinePrefix — bulletList", () => {
  it("adds - prefix", () => {
    view = makeView("item", 0);
    editorCmd.bulletList(view);
    expect(text(view)).toBe("- item");
  });

  it("removes - prefix", () => {
    view = makeView("- item", 0);
    editorCmd.bulletList(view);
    expect(text(view)).toBe("item");
  });
});

describe("toggleLinePrefix — orderedList", () => {
  it("adds 1. prefix", () => {
    view = makeView("item", 0);
    editorCmd.orderedList(view);
    expect(text(view)).toBe("1. item");
  });
});

describe("toggleLinePrefix — taskList", () => {
  it("adds - [ ] prefix", () => {
    view = makeView("todo", 0);
    editorCmd.taskList(view);
    expect(text(view)).toBe("- [ ] todo");
  });
});

describe("codeBlock", () => {
  it("wraps selection in fenced block", () => {
    view = makeView("const x = 1", 0, 11);
    editorCmd.codeBlock(view);
    expect(text(view)).toBe("```\nconst x = 1\n```");
  });

  it("inserts empty block at cursor", () => {
    view = makeView("", 0);
    editorCmd.codeBlock(view);
    expect(text(view)).toBe("```\n\n```");
  });
});

describe("link", () => {
  it("wraps selection as link text", () => {
    view = makeView("Google", 0, 6);
    editorCmd.link(view);
    expect(text(view)).toBe("[Google](url)");
  });

  it("inserts placeholder at cursor", () => {
    view = makeView("", 0);
    editorCmd.link(view);
    expect(text(view)).toBe("[text](url)");
  });
});

describe("image", () => {
  it("wraps selection as alt text", () => {
    view = makeView("logo", 0, 4);
    editorCmd.image(view);
    expect(text(view)).toBe("![logo](url)");
  });

  it("inserts placeholder", () => {
    view = makeView("", 0);
    editorCmd.image(view);
    expect(text(view)).toBe("![alt](url)");
  });
});

describe("table", () => {
  it("inserts table after cursor position", () => {
    view = makeView("text", 4);
    editorCmd.table(view);
    const result = text(view);
    expect(result).toContain("| Column 1 |");
    expect(result).toContain("| --- |");
    expect(result).toContain("| Cell |");
  });
});

describe("hr", () => {
  it("inserts --- after non-empty line", () => {
    view = makeView("text", 4);
    editorCmd.hr(view);
    expect(text(view)).toBe("text\n\n---\n\n");
  });

  it("inserts --- without extra newline on empty line", () => {
    view = makeView("", 0);
    editorCmd.hr(view);
    expect(text(view)).toBe("\n---\n\n");
  });
});
