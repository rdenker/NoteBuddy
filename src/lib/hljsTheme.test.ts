import { describe, expect, it, vi } from "vitest";

vi.mock("highlight.js/styles/github-dark.css?inline", () => ({
  default: ".hljs{background:#0d1117}",
}));
vi.mock("highlight.js/styles/github.css?inline", () => ({ default: ".hljs{background:#ffffff}" }));
vi.mock("highlight.js/styles/atom-one-dark.css?inline", () => ({
  default: ".hljs{background:#282c34}",
}));
vi.mock("highlight.js/styles/monokai.css?inline", () => ({ default: ".hljs{background:#272822}" }));
vi.mock("highlight.js/styles/tokyo-night-dark.css?inline", () => ({
  default: ".hljs{background:#1a1b26}",
}));

import { HLJS_THEMES, HLJS_THEME_MAP, getThemeCss } from "@/lib/hljsTheme";

describe("hljsTheme", () => {
  it("HLJS_THEMES has 5 built-in entries", () => {
    expect(HLJS_THEMES).toHaveLength(5);
  });

  it("every theme has id, label, and non-empty css", () => {
    for (const t of HLJS_THEMES) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.css.length).toBeGreaterThan(0);
    }
  });

  it("HLJS_THEME_MAP contains all theme ids", () => {
    for (const t of HLJS_THEMES) {
      expect(HLJS_THEME_MAP[t.id]).toBe(t.css);
    }
  });

  it("getThemeCss returns correct css for known theme", () => {
    expect(getThemeCss("github-dark")).toContain("#0d1117");
    expect(getThemeCss("monokai")).toContain("#272822");
  });

  it("getThemeCss falls back to github-dark for unknown theme", () => {
    expect(getThemeCss("unknown-theme")).toContain("#0d1117");
  });

  it("getThemeCss returns customCss when provided", () => {
    const custom = ".hljs{background:red}";
    expect(getThemeCss("github-dark", custom)).toBe(custom);
  });

  it("getThemeCss prefers customCss over built-in", () => {
    const custom = ".hljs{background:purple}";
    expect(getThemeCss("monokai", custom)).toBe(custom);
    expect(getThemeCss("monokai", custom)).not.toContain("#272822");
  });

  it("theme ids are kebab-case strings", () => {
    for (const t of HLJS_THEMES) {
      expect(t.id).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
