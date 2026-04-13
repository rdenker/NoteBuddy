# Developer Guide

> For user-facing features see the [User Guide](USER_GUIDE.md). For theming see the [Theming Guide](THEMING.md).

---

## Contents

1. [Architecture overview](#1-architecture-overview)
2. [Prerequisites & setup](#2-prerequisites--setup)
3. [Project structure](#3-project-structure)
4. [State management](#4-state-management)
5. [IPC bridge (Rust ↔ React)](#5-ipc-bridge-rust--react)
6. [Adding a Rust command](#6-adding-a-rust-command)
7. [Code block themes](#7-code-block-themes)
8. [Editor themes](#8-editor-themes)
9. [App themes](#9-app-themes)
10. [Autocomplete: new language](#10-autocomplete-new-language)
11. [Animation system](#11-animation-system)
12. [Capabilities (permissions)](#12-capabilities-permissions)
13. [Common issues](#13-common-issues)

---

## 1. Architecture overview

NoteBuddy is a Tauri v2 desktop app with a strict frontend/backend split.

```
┌───────────────────────────────────────┐
│  React frontend (src/)                │
│  Zustand state · CodeMirror · Vite    │
├───────────────────────────────────────┤
│  IPC bridge (src/lib/commands.ts)     │
│  typed invoke() wrappers              │
├───────────────────────────────────────┤
│  Rust backend (src-tauri/src/lib.rs)  │
│  file I/O · markdown · search · tags  │
└───────────────────────────────────────┘
```

**Rule:** All file I/O, markdown parsing, directory walking, template management, and tag scanning happen in Rust. The frontend never touches the filesystem directly.

---

## 2. Prerequisites & setup

| Tool | Version | Install |
|---|---|---|
| Rust + Cargo | ≥ 1.77 | https://rustup.rs |
| Bun | ≥ 1.0 | https://bun.sh |
| Xcode (macOS) | latest | App Store |

```bash
git clone https://github.com/yourname/notebuddy
cd notebuddy
bun install
bun run tauri dev   # starts Vite on :1420 + Rust binary in debug mode
```

Frontend hot-reloads. Rust changes trigger automatic recompile.

```bash
bun run tauri build
# Output: src-tauri/target/release/bundle/
```

---

## 3. Project structure

### Frontend (`src/`)

```
src/
├── App.tsx                   # Root layout, shortcuts, theme application, hljs portal
├── components/
│   ├── AppTour.tsx           # Interactive feature tour (react-joyride)
│   ├── CommandPalette.tsx    # ⌘K palette — full-text search + commands
│   ├── EditorPane.tsx        # CodeMirror 6 — themes, autocomplete, search
│   ├── FilterPanel.tsx       # Tag + date range filter popover
│   ├── FrontmatterBar.tsx    # YAML metadata bar above preview
│   ├── OnboardingModal.tsx   # First-run wizard (animated steps)
│   ├── PreviewPane.tsx       # HTML preview — hljs, Mermaid, KaTeX, wikilinks
│   ├── PrintPreview.tsx      # Print/PDF modal
│   ├── SettingsSheet.tsx     # Settings slide-in panel (all tabs)
│   ├── Sidebar.tsx           # File tree, bookmarks, filter
│   ├── StatusBar.tsx         # Word/char count, reading time
│   ├── TabBar.tsx            # Multi-file tab strip
│   ├── TemplatesTab.tsx      # Template manager inside settings
│   └── Toolbar.tsx           # Top bar — new/open/palette/panels/settings
├── store/
│   ├── bookmarks.ts          # Persisted bookmarks array
│   ├── customIcons.ts        # Per-file emoji icons (persisted)
│   ├── editor.ts             # Active file, content, preview HTML, filters
│   ├── settings.ts           # All user preferences (persisted)
│   ├── sortOrder.ts          # Per-directory sort order (persisted)
│   ├── tabs.ts               # Open tabs — content, dirty state, frontmatter
│   └── typeColors.ts         # Frontmatter type → badge color mappings
├── hooks/
│   └── useFileOps.ts         # File open/save/watch, tab-aware
└── lib/
    ├── appThemes.ts          # Built-in app theme metadata + custom theme template
    ├── codeBlockCompletion.ts# Per-language autocomplete keyword/snippet sources
    ├── commands.ts           # Typed Tauri invoke() wrappers
    ├── emojiCompletion.ts    # Emoji :shortcode: source
    ├── frontmatter.ts        # YAML frontmatter parser (js-yaml)
    ├── hljsTheme.ts          # highlight.js theme registry + CSS resolver
    ├── imagePaste.ts         # Clipboard/drag image → assets/ folder
    ├── motion.ts             # Framer Motion spring/variant presets
    ├── pdfExport.ts          # Print preview HTML builder
    ├── searchPanel.ts        # Custom CodeMirror find & replace panel
    └── welcomeContent.ts     # WELCOME.md starter content
```

### Rust backend (`src-tauri/src/lib.rs`)

All commands live in `mod commands {}` and are registered in `tauri::generate_handler![]`.

| Command | Description |
|---|---|
| `read_file` | Read file + track in recent files |
| `write_file` | Write with parent dir creation |
| `list_directory` | Sorted directory listing, dot-files excluded |
| `parse_markdown` | pulldown-cmark with GFM extensions → HTML |
| `search_files` | Recursive full-text search |
| `scan_tags` | Recursive frontmatter tag + date extraction |
| `list_templates` | Read `_templates/*.md` |
| `ensure_templates_dir` | Create `_templates/` with starters |
| `create_file` / `create_directory` | File management |
| `rename_path` / `delete_path` | File management |
| `watch_file` | notify crate → emits `file-changed` event |
| `set_vibrancy` | window-vibrancy — macOS blur |
| `export_html` | Render markdown → standalone HTML |
| `write_temp_html` | Write temp file for print/PDF |

---

## 4. State management

Four Zustand stores. All persisted stores use the `persist` middleware writing to localStorage.

### `settings.ts` — key: `md-editor-settings`

All user preferences. Persisted fields include: themes (app/editor/hljs + custom CSS), font size, line numbers, line wrapping, auto-save, last folder/file, window opacity/blur, onboarding state.

Not persisted (ephemeral): `settingsOpen`, `tourActive`, `zenMode`.

### `editor.ts` — not persisted

Active file path, raw content, rendered preview HTML, parsed frontmatter, active tag/date filters, panel layout (editor/split/preview).

### `tabs.ts` — not persisted

Array of `Tab` objects. Each tab holds its own `content`, `savedContent`, `isDirty`, `previewHtml`, `frontmatter`. Switching tabs syncs active tab into `editor.ts`.

### `bookmarks.ts` — key: `md-editor-bookmarks`

Persisted array of `{ path, name }`.

---

## 5. IPC bridge (Rust ↔ React)

All Rust commands are called via typed wrappers in `src/lib/commands.ts`:

```typescript
// Example wrapper
export async function readFile(path: string): Promise<string> {
  return invoke<string>("read_file", { path });
}
```

Never call `invoke()` directly from components — always go through `commands.ts`. This keeps the type surface in one place and makes mocking in tests straightforward.

---

## 6. Adding a Rust command

1. Add function to `mod commands` in `src-tauri/src/lib.rs`
2. Register it in `tauri::generate_handler![]`
3. Add typed wrapper to `src/lib/commands.ts`
4. If it needs filesystem access, add permissions to `src-tauri/capabilities/default.json`

---

## 7. Code block themes

Full architecture documented in [Theming Guide → Code block themes](THEMING.md#3-code-block-themes).

**Adding a built-in theme (2 steps):**

1. Import CSS with Vite's `?inline` in `src/lib/hljsTheme.ts`:
   ```typescript
   import dracula from "highlight.js/styles/base16/dracula.css?inline";
   ```

2. Add to `HLJS_THEMES`:
   ```typescript
   { id: "dracula", label: "Dracula", css: dracula },
   ```

Settings dropdown reads `HLJS_THEMES` automatically — no other changes.

**Theme injection:** `App.tsx` uses a React portal (`createPortal`) to render `<style id="hljs-theme">` into `<head>`. React owns this node — never create it manually with `document.createElement`. After CSS update, `App.tsx` re-runs `hljs.highlightElement()` on all `pre code` blocks.

---

## 8. Editor themes

Full architecture in [Theming Guide → Editor themes](THEMING.md#2-editor-themes).

**Adding a built-in theme (3 steps):**

1. Import theme object (from `@uiw/codemirror-themes-all` or similar) in `EditorPane.tsx`
2. Add to `THEMES` map in `EditorPane.tsx`
3. Add `{ value, label }` to `EDITOR_THEMES` in `SettingsSheet.tsx` and the value to `EditorTheme` union in `settings.ts`

**Custom theme injection:** `applyCustomEditorTheme(css)` in `EditorPane.tsx` manages a `<style id="cm-custom-theme">` tag directly (not via React portal, because it's tied to the editor lifecycle). When a custom theme is active, the CodeMirror `theme` prop is set to `"none"`.

---

## 9. App themes

Full architecture in [Theming Guide → App themes](THEMING.md#1-app-themes).

**Adding a built-in theme (3 steps):**

1. Add ID to `AppTheme` union in `src/lib/appThemes.ts`
2. Add `AppThemeMeta` entry to `APP_THEMES` with swatch colors
3. Add CSS variable block to `src/index.css` under `html.<theme-id>` — use `var(--bg-alpha, 0.92)` for all surface alphas

`App.tsx` handles class switching on `document.documentElement` and `<style id="custom-app-theme">` injection for custom themes.

---

## 10. Autocomplete: new language

Edit `src/lib/codeBlockCompletion.ts`:

1. Add keyword/snippet arrays following existing patterns (see `RUST_COMPLETIONS`, `PYTHON_COMPLETIONS`, etc.)
2. Add entry to `LANG_SOURCES` mapping the language fence identifier to a source factory
3. Optionally add symbol extraction patterns to `SYMBOL_PATTERNS`

---

## 11. Animation system

All motion config in `src/lib/motion.ts`:

```typescript
spring.snappy   // UI interactions, tab slides
spring.smooth   // Panel open/close (settings sheet, command palette)
spring.gentle   // Status bar updates, subtle reveals
spring.bounce   // Success states
```

Use `AnimatePresence` for conditional mounts. Use `layoutId` for shared element transitions (e.g. tab indicator underline).

---

## 12. Capabilities (permissions)

Permissions live in `src-tauri/capabilities/default.json`.

| Permission | Used for |
|---|---|
| `core:webview:allow-print` | `window.print()` for PDF export |
| `fs:allow-read-text-file` | Reading note files |
| `fs:allow-write-text-file` | Saving note files |
| `dialog:allow-open` | Native file/folder pickers |
| `dialog:allow-save` | Native save dialog |
| `opener:allow-open-path` | Open files in system default app |

---

## 13. Common issues

**Port 1420 in use:**
```bash
lsof -ti :1420 | xargs kill -9
```

**Rust compile errors after `tauri.conf.json` changes:**
Capabilities are read at build time. Changes require restarting `tauri dev`.

**Icon not updating in dev (macOS):**
```bash
sudo rm -rf /Library/Caches/com.apple.iconservices.store
killall Dock
```

**macOS vibrancy not working:**
Ensure `tauri.conf.json` has `"macOSPrivateApi": true` and `Cargo.toml` has `tauri = { features = ["macos-private-api"] }`.

**LSP shows Tailwind errors in `index.css`:**
CSS language server doesn't understand Tailwind v4 `@theme` / `@custom-variant` directives. Safe to ignore — Vite processes them correctly.
