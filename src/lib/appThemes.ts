export type AppTheme =
  | "dark"
  | "light"
  | "solarized-dark"
  | "solarized-light"
  | "catppuccin-mocha"
  | "dracula"
  | "tokyo-night";

export interface AppThemeMeta {
  id: AppTheme;
  label: string;
  isDark: boolean;
  swatchBg: string;
  swatchAccent: string;
  swatchFg: string;
}

export interface CustomAppTheme {
  id: string;
  label: string;
  css: string;
  isDark: boolean;
}

export const APP_THEMES: AppThemeMeta[] = [
  {
    id: "dark",
    label: "Dark",
    isDark: true,
    swatchBg: "hsl(222 13% 9%)",
    swatchAccent: "hsl(217 91% 65%)",
    swatchFg: "hsl(210 17% 92%)",
  },
  {
    id: "light",
    label: "Light",
    isDark: false,
    swatchBg: "hsl(0 0% 98%)",
    swatchAccent: "hsl(217 91% 52%)",
    swatchFg: "hsl(222 13% 12%)",
  },
  {
    id: "solarized-dark",
    label: "Solarized Dark",
    isDark: true,
    swatchBg: "hsl(192 100% 11%)",
    swatchAccent: "hsl(205 69% 49%)",
    swatchFg: "hsl(186 8% 55%)",
  },
  {
    id: "solarized-light",
    label: "Solarized Light",
    isDark: false,
    swatchBg: "hsl(44 87% 94%)",
    swatchAccent: "hsl(205 69% 49%)",
    swatchFg: "hsl(192 81% 14%)",
  },
  {
    id: "catppuccin-mocha",
    label: "Catppuccin Mocha",
    isDark: true,
    swatchBg: "hsl(240 21% 15%)",
    swatchAccent: "hsl(267 84% 81%)",
    swatchFg: "hsl(226 64% 88%)",
  },
  {
    id: "dracula",
    label: "Dracula",
    isDark: true,
    swatchBg: "hsl(231 15% 18%)",
    swatchAccent: "hsl(265 89% 78%)",
    swatchFg: "hsl(60 30% 96%)",
  },
  {
    id: "tokyo-night",
    label: "Tokyo Night",
    isDark: true,
    swatchBg: "hsl(225 27% 13%)",
    swatchAccent: "hsl(217 92% 76%)",
    swatchFg: "hsl(220 24% 85%)",
  },
];

export const CUSTOM_APP_THEME_TEMPLATE = `/* ─── Custom App Theme Template ──────────────────────────────────────────────
 *
 * How to use:
 *   1. Copy this entire block into the CSS input below.
 *   2. Replace "my-theme" in the class name with a unique slug (lowercase,
 *      hyphens only — e.g. "rose-pine", "gruvbox-light").
 *      The class MUST start with "theme-".
 *   3. Adjust the HSL values to your liking.
 *   4. Toggle "Dark mode" if your theme has a light background.
 *   5. Click "Add theme".
 *
 * ─── Opacity & vibrancy ────────────────────────────────────────────────────
 *
 * ALL surface colors (background, card, muted, sidebar) must use
 *   hsl(H S% L% / 0.92)  ← note the alpha value
 * so that the window opacity slider and macOS vibrancy/blur work correctly.
 * Text, borders, and interactive colors should stay fully opaque (no alpha).
 *
 * ─── Variable reference ────────────────────────────────────────────────────
 *
 *  --color-background          Main window fill
 *  --color-foreground          Body text
 *  --color-muted               Subtle fills (inputs, rows, gutters)
 *  --color-muted-foreground    Dimmed labels, placeholders, secondary text
 *  --color-border              Dividers, outlines
 *  --color-input               Input field backgrounds
 *  --color-ring                Focus ring / keyboard-nav highlight
 *  --color-primary             Brand accent: links, active states, CTA buttons
 *  --color-primary-foreground  Text ON primary-colored surfaces
 *  --color-secondary           Secondary action fills
 *  --color-secondary-foreground
 *  --color-accent              Hover highlights, subtle interactive fills
 *  --color-accent-foreground
 *  --color-destructive         Error / delete action color
 *  --color-destructive-foreground
 *  --color-card                Panel / card / sheet backgrounds
 *  --color-card-foreground
 *  --color-popover             Dropdown / tooltip / popover backgrounds
 *  --color-popover-foreground
 *  --color-sidebar             Sidebar column background
 *  --color-sidebar-border      Sidebar right-edge divider
 *
 * ─────────────────────────────────────────────────────────────────────────── */

html.theme-my-theme {
  --color-background:             hsl(222 13% 9% / 0.92);
  --color-foreground:             hsl(210 17% 92%);
  --color-muted:                  hsl(220 10% 14% / 0.92);
  --color-muted-foreground:       hsl(215 10% 52%);
  --color-border:                 hsl(220 10% 18%);
  --color-input:                  hsl(220 10% 14% / 0.92);
  --color-ring:                   hsl(217 91% 65%);
  --color-primary:                hsl(217 91% 65%);
  --color-primary-foreground:     hsl(222 13% 9%);
  --color-secondary:              hsl(220 10% 14% / 0.92);
  --color-secondary-foreground:   hsl(210 17% 92%);
  --color-accent:                 hsl(220 10% 17% / 0.92);
  --color-accent-foreground:      hsl(210 17% 92%);
  --color-destructive:            hsl(0 62% 54%);
  --color-destructive-foreground: hsl(210 17% 92%);
  --color-card:                   hsl(220 12% 11% / 0.92);
  --color-card-foreground:        hsl(210 17% 92%);
  --color-popover:                hsl(220 12% 11% / 0.95);
  --color-popover-foreground:     hsl(210 17% 92%);
  --color-sidebar:                hsl(222 14% 7% / 0.92);
  --color-sidebar-border:         hsl(220 10% 14%);
}`;
