# NoteBuddy

A fast, beautiful, local-first markdown editor built with **Tauri v2**, **React 19**, and **Rust**.

Your notes live on your machine — no cloud, no accounts, no subscriptions.

---

## Features

- **Live split preview** — editor and rendered markdown side by side with draggable divider
- **Tabs** — open multiple files simultaneously, middle-click to close
- **Syntax highlighting** — 20+ languages in code blocks via highlight.js
- **Smart autocomplete** — markdown snippets, language keywords, local symbols, and emoji (`:smile:`)
- **Mermaid diagrams** — rendered live in the preview
- **KaTeX math** — inline `$` and display `$$` blocks
- **Wikilinks** — `[[Note Name]]` creates clickable cross-note links
- **Frontmatter metadata** — YAML frontmatter rendered as a metadata bar with clickable tag chips
- **Tag filtering + date range** — filter the file tree by tags or `created` date
- **Bookmarks** — pin files to the top of the sidebar
- **Templates** — `_templates/` folder for reusable note structures with `{{date}}` substitution
- **Command palette** (`⌘K`) — full-text search across all notes + command launcher
- **Find & replace** (`⌘F`) — built-in CodeMirror search panel
- **Export** — print / save as PDF (`⌘P`) or export as HTML
- **Zen mode** (`⌘⇧Z`) — distraction-free writing
- **Themes** — VS Code Dark, One Dark, GitHub Light for the editor; 5 highlight.js themes for code blocks
- **Window vibrancy** — macOS native blur/transparency
- **Guided onboarding** — first-run wizard + interactive feature tour

---

## Getting started

### Prerequisites

| Tool | Version |
|---|---|
| Rust + Cargo | ≥ 1.77 |
| Bun | ≥ 1.0 |
| Node.js | ≥ 18 |
| Xcode (macOS) | latest |

Install Rust: https://rustup.rs  
Install Bun: https://bun.sh

### Development

```bash
git clone https://github.com/yourname/notebuddy
cd notebuddy
bun install
bun run tauri dev
```

### Build

```bash
bun run tauri build
```

The app bundle is output to `src-tauri/target/release/bundle/`.

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘S` | Save |
| `⌘K` | Command palette |
| `⌘F` | Find & replace |
| `⌘P` | Print / Export PDF |
| `⌘⇧Z` | Toggle zen mode |
| `Ctrl+Space` | Trigger autocomplete |
| `Tab` | Accept suggestion |
| `Esc` | Dismiss / exit zen mode |

---

## Tech stack

| Layer | Technology |
|---|---|
| Desktop runtime | Tauri v2 |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix) |
| Editor | CodeMirror 6 |
| Markdown parsing | pulldown-cmark (Rust) |
| State | Zustand |
| Animations | Framer Motion |
| Diagrams | Mermaid.js |
| Math | KaTeX |

---

## Docs

- [User Guide](docs/USER_GUIDE.md)
- [Developer Guide](docs/DEVELOPER.md)

---

## License

MIT
