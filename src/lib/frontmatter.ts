import { load } from "js-yaml";

export interface Frontmatter {
  title?: string;
  type?: string;
  tags?: string[];
  created?: string;
  updated?: string;
  sources?: string[];
  [key: string]: unknown;
}

export interface ParsedDocument {
  frontmatter: Frontmatter | null;
  body: string;
}

export function parseFrontmatter(raw: string): ParsedDocument {
  if (!raw.startsWith("---")) {
    return { frontmatter: null, body: raw };
  }

  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: null, body: raw };
  }

  const yamlBlock = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, "");

  try {
    const parsed = load(yamlBlock);
    if (parsed && typeof parsed === "object") {
      const fm = parsed as Frontmatter;

      if (fm.title != null && typeof fm.title !== "string") {
        const raw = fm.title as unknown;
        fm.title = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw);
      }
      if (fm.type != null && typeof fm.type !== "string") {
        fm.type = String(fm.type);
      }

      if (fm.tags && !Array.isArray(fm.tags)) {
        fm.tags = [String(fm.tags)];
      } else if (Array.isArray(fm.tags)) {
        fm.tags = fm.tags.map((t) => String(t));
      }

      if (fm.created && typeof fm.created !== "string") {
        const raw = fm.created as unknown;
        fm.created =
          raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
      }
      if (fm.updated && typeof fm.updated !== "string") {
        const raw = fm.updated as unknown;
        fm.updated =
          raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
      }

      if (Array.isArray(fm.sources)) {
        fm.sources = fm.sources.map((s) => String(s));
      }

      return { frontmatter: fm, body };
    }
  } catch (_e) {
    return { frontmatter: null, body: raw };
  }

  return { frontmatter: null, body: raw };
}
