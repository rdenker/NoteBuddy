# Theming Guide

NoteBuddy has three independent, composable theme systems:

| System | Controls | Configured in |
|---|---|---|
| **App theme** | Entire UI color palette | Settings → Appearance → App theme |
| **Editor theme** | CodeMirror syntax highlighting | Settings → Appearance → Editor theme |
| **Code block theme** | Highlight.js in the preview pane | Settings → Appearance → Code block theme |

Each system has built-in presets and accepts fully custom CSS at runtime — no code changes required.

---

## Table of contents

1. [App themes](#1-app-themes)
   - [Built-in presets](#11-built-in-presets)
   - [How theme application works](#12-how-theme-application-works)
   - [CSS variable reference](#13-css-variable-reference)
   - [Opacity & vibrancy rules](#14-opacity--vibrancy-rules)
   - [Creating a custom app theme](#15-creating-a-custom-app-theme)
   - [Full starter template](#16-full-starter-template)
2. [Editor themes](#2-editor-themes)
   - [Built-in presets](#21-built-in-presets)
   - [How editor theme application works](#22-how-editor-theme-application-works)
   - [Creating a custom editor theme](#23-creating-a-custom-editor-theme)
   - [CodeMirror selector reference](#24-codemirror-selector-reference)
3. [Code block themes](#3-code-block-themes)
   - [Built-in presets](#31-built-in-presets)
   - [How code block theme application works](#32-how-code-block-theme-application-works)
   - [Creating a custom code block theme](#33-creating-a-custom-code-block-theme)
4. [Persistence & storage](#4-persistence--storage)
5. [Adding a built-in theme (code change)](#5-adding-a-built-in-theme-code-change)
6. [Tips & common mistakes](#6-tips--common-mistakes)

---

## 1. App themes

The app theme controls every color in the UI — backgrounds, text, borders, buttons, sidebars, popovers, inputs, and focus rings. It works via a set of CSS custom properties defined on the `html` element.

### 1.1 Built-in presets

| ID | Label | Mode |
|---|---|---|
| `dark` | Dark | Dark |
| `light` | Light | Light |
| `solarized-dark` | Solarized Dark | Dark |
| `solarized-light` | Solarized Light | Light |
| `catppuccin-mocha` | Catppuccin Mocha | Dark |
| `dracula` | Dracula | Dark |
| `tokyo-night` | Tokyo Night | Dark |

### 1.2 How theme application works

Theme selection is stored in the `useSettingsStore` Zustand store (keys `appTheme` and `customAppThemeId`). `App.tsx` reacts to changes and applies them to `document.documentElement` (the `<html>` element):

1. All existing `html.light`, `html.solarized-dark`, `html.dracula`, etc. classes are stripped.
2. For a **built-in** theme: the theme's CSS class (e.g. `light`, `tokyo-night`) is added to `<html>`.
3. For a **custom** theme: the theme's slug (e.g. `theme-rose-pine`) is added to `<html>`, and the theme's CSS string is injected as `<style id="custom-app-theme">` in `<head>`. When the theme changes, the old `<style>` tag is replaced or removed.

The `colorMode` flag (`"dark"` | `"light"`) stored alongside the theme drives CodeMirror's light/dark rendering mode.

### 1.3 CSS variable reference

All variables are defined on `html` (dark defaults) and overridden per-theme. Custom themes must define all of them.

| Variable | Purpose |
|---|---|
| `--color-background` | Main window fill |
| `--color-foreground` | Body text |
| `--color-muted` | Subtle fills — input backgrounds, row alternates, gutters |
| `--color-muted-foreground` | Dimmed labels, placeholders, secondary text |
| `--color-border` | Dividers, input outlines, separator lines |
| `--color-input` | Input field background (usually same as `--color-muted`) |
| `--color-ring` | Focus ring — keyboard navigation highlight |
| `--color-primary` | Brand accent — links, active states, CTA buttons |
| `--color-primary-foreground` | Text rendered on `--color-primary` surfaces |
| `--color-secondary` | Secondary action button fill |
| `--color-secondary-foreground` | Text on secondary surfaces |
| `--color-accent` | Hover highlights, subtle interactive fills |
| `--color-accent-foreground` | Text on accent surfaces |
| `--color-destructive` | Error / delete action color |
| `--color-destructive-foreground` | Text on destructive surfaces |
| `--color-card` | Panel, card, settings sheet backgrounds |
| `--color-card-foreground` | Text on card surfaces |
| `--color-popover` | Dropdown, tooltip, and popover backgrounds |
| `--color-popover-foreground` | Text inside popovers |
| `--color-sidebar` | Sidebar column background |
| `--color-sidebar-border` | Sidebar right-edge divider |

Additionally, two runtime variables are controlled by the UI — **do not set these in theme CSS**:

| Variable | Set by |
|---|---|
| `--bg-alpha` | Window opacity slider (default `0.92`) |
| `--text-brightness` | Text brightness slider (applied as `filter: brightness(...)` on `html`) |

### 1.4 Opacity & vibrancy rules

NoteBuddy supports macOS vibrancy (native window blur) and a window opacity slider. For these to work, **all surface colors must carry an alpha channel**:

```css
/* ✅ correct — alpha allows the blur to show through */
--color-background: hsl(222 13% 9% / 0.92);

/* ❌ wrong — fully opaque, vibrancy invisible */
--color-background: hsl(222 13% 9%);
```

**Rule:** Apply the `/ 0.92` alpha (or similar) to every surface token:
`background`, `card`, `muted`, `input`, `secondary`, `accent`, `sidebar`, `popover`.

Text, borders, and interactive colors (ring, primary, destructive) must stay **fully opaque** — no alpha.

The `/ 0.92` value you write is a baseline. The window opacity slider multiplies it at runtime via `--bg-alpha`. Writing a fixed `/ 1` will prevent the slider from working.

### 1.5 Creating a custom app theme

1. Open **Settings → Appearance → App theme section → "+ Add theme"**.
2. Enter a display name (e.g. `Rose Pine`).
3. Click **Load template** to prefill the CSS input with the full variable set.
4. Edit the class name in the CSS from `html.theme-my-theme` to your unique slug — must start with `theme-`, lowercase, hyphens only (e.g. `html.theme-rose-pine`).
5. Adjust the HSL values to taste.
6. Toggle **Dark mode** to match your theme's brightness — this controls how the CodeMirror editor renders.
7. Click **Add theme**. Your theme appears in the App theme dropdown immediately.

Custom themes are stored in localStorage and survive restarts.

### 1.6 Full starter template

```css
/* ─── Custom App Theme Template ──────────────────────────────────────────────
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
}
```

---

## 2. Editor themes

The editor theme controls syntax highlighting inside the CodeMirror 6 writing pane. It does **not** affect the preview pane — that is covered by the code block theme system.

### 2.1 Built-in presets

| ID | Label |
|---|---|
| `vscodeDark` | VS Code Dark |
| `oneDark` | One Dark |
| `dracula` | Dracula |
| `nord` | Nord |
| `tokyoNight` | Tokyo Night |
| `material` | Material |
| `sublime` | Sublime |
| `githubLight` | GitHub Light |
| `solarizedDark` | Solarized Dark |
| `solarizedLight` | Solarized Light |
| `gruvboxDark` | Gruvbox Dark |
| `monokai` | Monokai |
| `aura` | Aura |

All are provided by the [`@uiw/codemirror-themes-all`](https://github.com/uiwjs/react-codemirror/tree/master/themes/all) package.

### 2.2 How editor theme application works

`EditorPane.tsx` maintains a `THEMES` map from `EditorTheme` string keys to CodeMirror theme extension objects:

```typescript
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
```

When a built-in theme is active, it is passed directly to the CodeMirror `<ReactCodeMirror theme={...}>` prop.

When a **custom** editor theme is active, the CodeMirror `theme` prop is set to `"none"` (no built-in theme object), and the custom CSS is injected via a `<style id="cm-custom-theme">` tag in `<head>`. The `applyCustomEditorTheme` function manages this tag — it creates, updates, or removes it as the selection changes.

```typescript
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
```

### 2.3 Creating a custom editor theme

1. Open **Settings → Appearance → Custom editor themes → "+ Add theme"**.
2. Enter a display name.
3. Paste your CodeMirror-compatible CSS. Your CSS must target the CodeMirror DOM structure (see selector reference below).
4. Click **Add theme**. Select it from the Editor theme dropdown.

**Finding theme CSS:** The [CodeMirror theme playground](https://codemirror.net/examples/styling/) and community repositories like [ddietr/codemirror-themes](https://github.com/ddietr/codemirror-themes) are good sources.

### 2.4 CodeMirror selector reference

Target these selectors in your custom editor CSS:

| Selector | What it styles |
|---|---|
| `.cm-editor` | Editor wrapper — background, border |
| `.cm-content` | The editable text area |
| `.cm-line` | Individual text lines |
| `.cm-cursor` | Text cursor |
| `.cm-selectionBackground` | Text selection highlight |
| `.cm-gutters` | Line number gutter background |
| `.cm-lineNumbers .cm-gutterElement` | Line number text |
| `.cm-activeLine` | Currently focused line highlight |
| `.cm-activeLineGutter` | Gutter of the active line |
| `.cm-matchingBracket` | Matched bracket highlight |
| `.tok-keyword` | Keyword tokens |
| `.tok-string` | String tokens |
| `.tok-comment` | Comment tokens |
| `.tok-number` | Number tokens |
| `.tok-operator` | Operator tokens |
| `.tok-variableName` | Variable names |
| `.tok-typeName` | Type names |
| `.tok-heading` | Markdown headings |
| `.tok-emphasis` | Italic text |
| `.tok-strong` | Bold text |
| `.tok-link` | Markdown links |
| `.tok-url` | URLs |

**Minimal example — plain background swap:**

```css
.cm-editor {
  background: hsl(240 21% 15%);
}

.cm-content {
  color: hsl(226 64% 88%);
  caret-color: hsl(267 84% 81%);
}

.cm-gutters {
  background: hsl(240 21% 13%);
  color: hsl(228 24% 40%);
  border-right: 1px solid hsl(237 16% 22%);
}

.cm-activeLine {
  background: hsl(237 16% 20% / 0.5);
}

.tok-keyword  { color: hsl(267 84% 81%); }
.tok-string   { color: hsl(116 22% 75%); }
.tok-comment  { color: hsl(228 24% 50%); font-style: italic; }
.tok-number   { color: hsl(31 100% 75%); }
```

---

## 3. Code block themes

The code block theme controls syntax highlighting rendered by [highlight.js](https://highlightjs.org) inside the **preview pane** — fenced code blocks in your markdown.

### 3.1 Built-in presets

| ID | Label |
|---|---|
| `github-dark` | GitHub Dark |
| `github` | GitHub Light |
| `atom-one-dark` | Atom One Dark |
| `monokai` | Monokai |
| `tokyo-night-dark` | Tokyo Night |

### 3.2 How code block theme application works

Each built-in theme is a full CSS string imported at build time via Vite's `?inline` suffix:

```typescript
import githubDark from "highlight.js/styles/github-dark.css?inline";
```

The active theme CSS is resolved by `getThemeCss(themeId, customCss?)` in `src/lib/hljsTheme.ts`:

```typescript
export function getThemeCss(themeId: string, customCss?: string): string {
  if (customCss) return customCss;           // custom theme wins
  return HLJS_THEME_MAP[themeId] ?? githubDark; // built-in or fallback
}
```

`App.tsx` renders the resolved CSS as a React portal into `<head>`:

```tsx
function HljsThemeStyle() {
  const hljsTheme = useSettingsStore((s) => s.hljsTheme);
  const customThemes = useSettingsStore((s) => s.customThemes);
  const custom = customThemes.find((t) => t.id === hljsTheme);
  const css = getThemeCss(hljsTheme, custom?.css);
  return createPortal(<style id="hljs-theme">{css}</style>, document.head);
}
```

This is a **React-managed portal** — React owns the `<style>` node. When the selected theme changes, React diffs the CSS content and updates the existing tag in place. Do not manually create a second `<style id="hljs-theme">` tag.

After the CSS is swapped, `App.tsx` re-runs `hljs.highlightElement()` on all rendered `pre code` blocks (after stripping `data-highlighted`) so the new token colors apply immediately without a page reload.

### 3.3 Creating a custom code block theme

1. Find a highlight.js-compatible CSS file. The [official themes browser](https://highlightjs.org/examples) and [cdnjs highlight.js](https://cdnjs.com/libraries/highlight.js) are good sources. Any `.css` file from the `highlight.js/styles/` directory works.
2. Open **Settings → Appearance → Custom code block themes → "+ Add theme"**.
3. Enter a display name.
4. Paste the full CSS content.
5. Click **Add theme**. Select it from the Code block theme dropdown.

**Key hljs selectors:**

| Selector | Token type |
|---|---|
| `.hljs` | Base — code block background and default text color |
| `.hljs-keyword` | Keywords (`if`, `for`, `return`, …) |
| `.hljs-string` | String literals |
| `.hljs-comment` | Comments |
| `.hljs-number` | Numeric literals |
| `.hljs-built_in` | Built-in names |
| `.hljs-type` | Type names |
| `.hljs-function` | Function declarations |
| `.hljs-variable` | Variables |
| `.hljs-title` | Function/class name |
| `.hljs-params` | Parameter lists |
| `.hljs-attr` | HTML/JSON attribute names |
| `.hljs-tag` | HTML tags |
| `.hljs-name` | HTML tag names |
| `.hljs-meta` | Preprocessor/meta directives |
| `.hljs-operator` | Operators |
| `.hljs-punctuation` | Brackets, punctuation |
| `.hljs-literal` | Boolean/null literals |
| `.hljs-emphasis` | Italic |
| `.hljs-strong` | Bold |

**Minimal example:**

```css
.hljs {
  background: hsl(231 15% 18%);
  color: hsl(60 30% 96%);
}

.hljs-keyword   { color: hsl(265 89% 78%); }
.hljs-string    { color: hsl(65 92% 76%); }
.hljs-comment   { color: hsl(233 14% 50%); font-style: italic; }
.hljs-number    { color: hsl(191 97% 77%); }
.hljs-built_in  { color: hsl(191 97% 77%); }
.hljs-function  { color: hsl(65 92% 76%); }
.hljs-title     { color: hsl(135 94% 65%); }
```

---

## 4. Persistence & storage

All theme selections and custom theme CSS are persisted in **localStorage** via the Zustand `persist` middleware, under the key `md-editor-settings`.

| Field | Type | Description |
|---|---|---|
| `appTheme` | `AppTheme` string | Selected built-in app theme ID |
| `customAppThemeId` | `string` | Selected custom app theme slug (empty = none) |
| `customAppThemes` | `CustomAppTheme[]` | Array of `{ id, label, css, isDark }` |
| `editorTheme` | `EditorTheme` string | Selected built-in editor theme ID |
| `customEditorThemeId` | `string` | Selected custom editor theme ID (empty = none) |
| `customEditorThemes` | `CustomTheme[]` | Array of `{ id, label, css }` |
| `hljsTheme` | `string` | Selected code block theme ID |
| `customThemes` | `CustomTheme[]` | Array of `{ id, label, css }` for code block themes |
| `colorMode` | `"dark"` \| `"light"` | Derived from active app/custom theme's `isDark` flag |

To **export** your custom themes: open DevTools → Application → Local Storage → `md-editor-settings` → copy the value.

To **reset** theming: open **Settings → About → Reset onboarding**, or manually delete the relevant keys from localStorage.

---

## 5. Adding a built-in theme (code change)

### New app theme

1. Add the theme ID to the `AppTheme` union in `src/lib/appThemes.ts`.
2. Add an `AppThemeMeta` entry to `APP_THEMES` with `swatchBg`, `swatchAccent`, `swatchFg`.
3. Add the CSS variable block to `src/index.css` under a new `html.<theme-id>` selector, following the pattern of existing themes. Use `var(--bg-alpha, 0.92)` for all surface alphas.

### New editor theme

1. Install or confirm the theme package is available in `@uiw/codemirror-themes-all`.
2. Import the theme object at the top of `src/components/EditorPane.tsx`.
3. Add it to the `THEMES` map.
4. Add `{ value: "themeId", label: "Theme Label" }` to the `EDITOR_THEMES` array in `src/components/SettingsSheet.tsx`.
5. Add `"themeId"` to the `EditorTheme` union in `src/store/settings.ts`.

### New code block theme

1. Import the CSS with Vite's `?inline` suffix in `src/lib/hljsTheme.ts`:
   ```typescript
   import dracula from "highlight.js/styles/base16/dracula.css?inline";
   ```
2. Add an entry to `HLJS_THEMES`:
   ```typescript
   { id: "dracula", label: "Dracula", css: dracula },
   ```
The Settings dropdown reads from `HLJS_THEMES` automatically — no other changes needed.

---

## 6. Tips & common mistakes

**Surface colors must have alpha.**
Forgetting the `/ 0.92` alpha on `background`, `card`, `muted`, `input`, `sidebar` makes the window opacity slider and macOS vibrancy do nothing. Always include it.

**Custom app theme class must start with `theme-`.**
The app strips known built-in classes on theme change. Any class not prefixed `theme-` may conflict with existing Tailwind or UI library classes.

**Custom editor theme disables the built-in theme entirely.**
When `customEditorThemeId` is set, the CodeMirror `theme` prop is `"none"`. You must define all token styles yourself — there's no layering on top of a built-in.

**App theme vs. editor theme are independent.**
A dark app theme does not automatically make the editor dark. If you create a light custom app theme, set `isDark: false` so CodeMirror switches its rendering mode accordingly.

**Code block theme only affects the preview pane.**
The editor pane uses the editor theme. The two are completely separate.

**Custom themes survive the Reset onboarding action.**
"Reset onboarding" clears `hasOnboarded`, `lastFolder`, and `lastFilePath` — it does **not** wipe custom theme data. To fully reset themes, delete the `md-editor-settings` key from localStorage.

**hljs re-highlighting is automatic.**
After switching code block themes, `App.tsx` automatically re-highlights all `pre code` blocks. You do not need to reload the file or reopen the preview.
