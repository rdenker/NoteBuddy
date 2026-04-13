# Developer Guide

## Architecture overview

NoteBuddy is a Tauri v2 app. The architecture follows a strict split:

- **Rust backend** (`src-tauri/src/lib.rs`) — all file I/O, markdown parsing, directory walking, template management, and tag scanning. Never does file operations in JS.
- **React frontend** (`src/`) — all UI rendering, state management, editor logic.
- **IPC bridge** (`src/lib/commands.ts`) — typed `invoke()` wrappers for every Rust command.

---

## Prerequisites

| Tool | Install |
|---|---|
| Rust 1.77+ | https://rustup.rs |
| Bun 1.0+ | https://bun.sh |
| Xcode (macOS) | App Store |
| Tauri CLI | bundled via `@tauri-apps/cli` |

---

## Setup

```bash
git clone https://github.com/yourname/notebuddy
cd notebuddy
bun install
```

---

## Development

```bash
bun run tauri dev
```

This starts Vite on `localhost:1420` and compiles the Rust binary in debug mode. Hot-reload works for the frontend. Rust changes trigger an automatic recompile.

**Port conflict?**
```bash
lsof -ti :1420 | xargs kill -9
```

---

## Build

```bash
bun run tauri build
```

Output: `src-tauri/target/release/bundle/`

---

## Project structure

### Frontend (`src/`)

```
src/
├── App.tsx                 # Root layout, keyboard shortcuts, zen mode
├── components/
│   ├── CommandPalette.tsx  # ⌘K palette with full-text search
│   ├── EditorPane.tsx      # CodeMirror 6 editor with autocomplete
│   ├── FilterPanel.tsx     # Tag + date range filter popover
│   ├── FrontmatterBar.tsx  # YAML frontmatter metadata bar
│   ├── OnboardingModal.tsx # First-run wizard (animated steps)
│   ├── PreviewPane.tsx     # HTML preview + hljs + Mermaid + KaTeX
│   ├── PrintPreview.tsx    # Print/PDF modal
│   ├── SettingsSheet.tsx   # Settings slide-in panel
│   ├── Sidebar.tsx         # File tree + bookmarks + filter
│   ├── StatusBar.tsx       # Word count, reading time
│   ├── TabBar.tsx          # Multi-file tabs
│   ├── Toolbar.tsx         # Top bar with actions
│   └── AppTour.tsx         # Interactive feature tour
├── store/
│   ├── editor.ts           # Active file, content, preview, filters
│   ├── settings.ts         # Persisted user preferences
│   ├── tabs.ts             # Open tabs state
│   └── bookmarks.ts        # Persisted bookmarks
├── hooks/
│   └── useFileOps.ts       # File open/save/watch, tab-aware
└── lib/
    ├── commands.ts         # Typed Tauri invoke() wrappers
    ├── codeBlockCompletion.ts # Per-language autocomplete sources
    ├── emojiCompletion.ts  # Emoji :shortcode: autocomplete
    ├── frontmatter.ts      # YAML frontmatter parser (js-yaml)
    ├── hljsTheme.ts        # Dynamic highlight.js theme switcher
    ├── imagePaste.ts       # Clipboard/drag image → assets/
    ├── motion.ts           # Framer Motion spring/variant presets
    ├── pdfExport.ts        # Print preview builder
    ├── searchPanel.ts      # Custom CodeMirror search panel
    └── welcomeContent.ts   # WELCOME.md template string
```

### Rust backend (`src-tauri/src/lib.rs`)

All commands live in `mod commands {}`. Key groups:

| Command | Description |
|---|---|
| `read_file` | Read + track in recent files |
| `write_file` | Write with parent dir creation |
| `list_directory` | Sorted, dot-files excluded |
| `parse_markdown` | pulldown-cmark with GFM extensions |
| `search_files` | Recursive full-text search |
| `scan_tags` | Recursive frontmatter tag + date extraction |
| `list_templates` | Read `_templates/*.md` |
| `ensure_templates_dir` | Create `_templates/` with starter files |
| `create_file` / `create_directory` | File management |
| `rename_path` / `delete_path` | File management |
| `watch_file` | notify crate → emits `file-changed` event |
| `set_vibrancy` | window-vibrancy macOS blur |
| `export_html` | Render markdown → standalone HTML |
| `write_temp_html` | Write temp file for print |

---

## State management

Four Zustand stores:

### `editor.ts`
Active file, content, preview HTML, frontmatter, active tag/date filters, panel layout.

### `settings.ts`
Persisted (localStorage via `partialize`): color mode, editor/hljs themes, font size, line numbers, auto-save, last folder, window opacity/blur, onboarding state.

Not persisted: `settingsOpen`, `tourActive`, `zenMode`.

### `tabs.ts`
Array of `Tab` objects — each tab holds its own `content`, `savedContent`, `isDirty`, `previewHtml`, `frontmatter`. Switching tabs syncs the active tab into `editor.ts`.

### `bookmarks.ts`
Persisted array of `{ path, name }`.

---

## Adding a new Rust command

1. Add the function to `mod commands` in `src-tauri/src/lib.rs`
2. Add it to `tauri::generate_handler![]` in `run()`
3. Add a typed wrapper to `src/lib/commands.ts`
4. If it requires new permissions, add them to `src-tauri/capabilities/default.json`

---

## Code block syntax highlighting themes

### Architecture

The theme system lives in `src/lib/hljsTheme.ts`. Each theme is a `HljsThemeDefinition`:

```typescript
export interface HljsThemeDefinition {
  id: string;    // unique key, stored in settings
  label: string; // shown in dropdown
  css: string;   // full CSS string, imported via ?inline
}
```

The active theme CSS is injected into `<head>` as a React portal from `App.tsx`:

```tsx
function HljsThemeStyle() {
  const hljsTheme = useSettingsStore((s) => s.hljsTheme);
  const customThemes = useSettingsStore((s) => s.customThemes);
  const custom = customThemes.find((t) => t.id === hljsTheme);
  const css = getThemeCss(hljsTheme, custom?.css);
  return createPortal(<style id="hljs-theme">{css}</style>, document.head);
}
```

This is a **React-managed portal** — React owns the DOM node. It persists through repaints, compositor changes, and dialog open/close events. Never use `document.createElement("style")` directly.

### Adding a built-in theme (code change)

1. Import the CSS with Vite's `?inline` suffix in `src/lib/hljsTheme.ts`:
   ```typescript
   import dracula from "highlight.js/styles/base16/dracula.css?inline";
   ```

2. Add an entry to `HLJS_THEMES`:
   ```typescript
   { id: "dracula", label: "Dracula", css: dracula },
   ```

That's it. The Settings dropdown auto-reads from `HLJS_THEME_REGISTRY`.

### Adding a theme at runtime (user-facing)

Users can add themes in **Settings → Appearance → Custom themes** by pasting highlight.js CSS. Custom themes are stored in `useSettingsStore.customThemes` (persisted to localStorage).

`getThemeCss(themeId, customCss?)` resolves in this priority:
1. If `customCss` is provided → use it directly
2. Look up `HLJS_THEME_MAP[themeId]` (built-ins)
3. Fall back to `github-dark`

### Re-highlighting after theme change

When `hljsTheme` changes in the store, `App.tsx` has a `useEffect([hljsTheme])` that calls `hljs.highlightElement()` on all `pre code` blocks in the document, after stripping the `data-highlighted` attribute so hljs re-processes them.

---

## Adding a new language to autocomplete

Edit `src/lib/codeBlockCompletion.ts`:

1. Add keyword/snippet arrays following the existing pattern (see `RUST_COMPLETIONS`, etc.)
2. Add an entry to `LANG_SOURCES` mapping the language identifier to a source factory
3. Optionally add symbol extraction patterns to `SYMBOL_PATTERNS`

---

## Animation system

All motion config lives in `src/lib/motion.ts`:

```typescript
spring.snappy   // UI interactions, tab slides
spring.smooth   // Panel open/close
spring.gentle   // Status bar, subtle reveals
spring.bounce   // Success states
```

Use `AnimatePresence` for conditional renders. Prefer `layoutId` for shared element transitions (e.g. tab indicator underline).

---

## Capabilities (permissions)

`src-tauri/capabilities/default.json` controls what the frontend can do. Key permissions:

- `core:webview:allow-print` — `window.print()`
- `fs:allow-read-text-file` / `fs:allow-write-text-file` — file I/O
- `dialog:allow-open` / `dialog:allow-save` — native file pickers
- `opener:allow-open-path` — open files in system browser

---

## Common issues

### Port 1420 in use
```bash
lsof -ti :1420 | xargs kill -9
```

### Rust compile errors after capability changes
Capabilities are read at runtime but changes to `tauri.conf.json` require a restart of `tauri dev`.

### Icon not updating in dev
```bash
sudo rm -rf /Library/Caches/com.apple.iconservices.store
killall Dock
```

### macOS vibrancy not working
Ensure `macOSPrivateApi: true` is in `tauri.conf.json` and `tauri = { features = ["macos-private-api"] }` in `Cargo.toml`.
