import atomOneDark from "highlight.js/styles/atom-one-dark.css?inline";
import github from "highlight.js/styles/github.css?inline";
import githubDark from "highlight.js/styles/github-dark.css?inline";
import monokai from "highlight.js/styles/monokai.css?inline";
import tokyoNightDark from "highlight.js/styles/tokyo-night-dark.css?inline";

export interface HljsThemeDefinition {
  id: string;
  label: string;
  css: string;
}

export const HLJS_THEMES: HljsThemeDefinition[] = [
  { id: "github-dark", label: "GitHub Dark", css: githubDark },
  { id: "github", label: "GitHub Light", css: github },
  { id: "atom-one-dark", label: "Atom One Dark", css: atomOneDark },
  { id: "monokai", label: "Monokai", css: monokai },
  { id: "tokyo-night-dark", label: "Tokyo Night", css: tokyoNightDark },
];

export const HLJS_THEME_MAP: Record<string, string> = Object.fromEntries(
  HLJS_THEMES.map((t) => [t.id, t.css])
);

export function getThemeCss(themeId: string, customCss?: string): string {
  if (customCss) return customCss;
  return HLJS_THEME_MAP[themeId] ?? githubDark;
}
