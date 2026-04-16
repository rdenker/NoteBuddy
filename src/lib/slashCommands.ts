import {
  type Completion,
  type CompletionContext,
  type CompletionResult,
  snippetCompletion,
} from "@codemirror/autocomplete";

function snip(label: string, template: string, detail: string): Completion {
  return snippetCompletion(template, { label, detail, type: "function" });
}

const COMMANDS: Completion[] = [
  snip("/heading 1", "# ${Heading}", "h1"),
  snip("/heading 2", "## ${Heading}", "h2"),
  snip("/heading 3", "### ${Heading}", "h3"),
  snip("/heading 4", "#### ${Heading}", "h4"),
  { label: "/bold", apply: "**bold**", detail: "bold", type: "text" },
  { label: "/italic", apply: "*italic*", detail: "italic", type: "text" },
  { label: "/strikethrough", apply: "~~strikethrough~~", detail: "strike", type: "text" },
  { label: "/inline code", apply: "`code`", detail: "inline code", type: "text" },
  snip("/code block", "```\n${}\n```", "fenced code block"),
  snip("/code block (lang)", "```${lang}\n${}\n```", "fenced code block"),
  snip("/quote", "> ${Quote}", "blockquote"),
  snip("/callout", "> **Note:** ${Callout}", "callout"),
  snip("/todo", "- [ ] ${Task}", "task list"),
  snip("/bulleted list", "- ${Item}\n- ${Item}", "list"),
  snip("/numbered list", "1. ${Item}\n2. ${Item}", "list"),
  snip("/link", "[${Text}](https://)", "link"),
  snip("/image", "![${Alt}](path/to/image)", "image"),
  snip("/table", "| Column 1 | Column 2 |\n| --- | --- |\n| ${Cell} | ${Cell} |", "table"),
  {
    label: "/toc",
    apply: "## Table of Contents\n- [Section](#section)\n- [Section](#section)",
    detail: "table of contents",
    type: "text",
  },
  {
    label: "/divider",
    apply: "---",
    detail: "horizontal rule",
    type: "text",
  },
  snip("/details", "<details>\n<summary>${Summary}</summary>\n\n${Content}\n</details>", "details"),
  snip("/mermaid", "```mermaid\n${graph TD}\n```", "mermaid diagram"),
  snip("/math", "$$\n${x^2 + y^2 = z^2}\n$$", "block math"),
  snip(
    "/frontmatter",
    "---\ntitle: ${Title}\ntags: [${tag}]\ncreated: ${YYYY-MM-DD}\n---\n\n",
    "frontmatter"
  ),
];

export function slashCommandCompletion(context: CompletionContext): CompletionResult | null {
  const line = context.state.doc.lineAt(context.pos);
  const lineText = line.text;
  const col = context.pos - line.from;
  const textBefore = lineText.slice(0, col);

  const word = context.matchBefore(/\/[a-zA-Z0-9_-]*/);
  if (!word) return null;
  if (word.from === word.to && !context.explicit) return null;

  const slashIndex = word.from - line.from;
  const charBefore = slashIndex > 0 ? lineText[slashIndex - 1] : "";
  if (slashIndex > 0 && charBefore && !/\s/.test(charBefore)) return null;

  const trimmed = textBefore.trimStart();
  if (!trimmed.startsWith("/")) return null;

  return {
    from: word.from,
    options: COMMANDS,
    validFor: /^\/[a-zA-Z0-9_-]*$/,
  };
}
