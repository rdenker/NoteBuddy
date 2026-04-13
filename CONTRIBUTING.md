# Contributing to NoteBuddy

Thanks for your interest in contributing! This guide covers setup, workflow, and standards.

---

## Prerequisites

| Tool | Version |
|---|---|
| Rust + Cargo | ≥ 1.77 |
| Bun | ≥ 1.0 |
| Node.js | ≥ 18 |
| Xcode (macOS) | latest |

Install Rust: https://rustup.rs  
Install Bun: https://bun.sh

---

## Setup

```bash
git clone https://github.com/yourname/notebuddy
cd notebuddy
bun install        # installs JS deps + sets up husky hooks
```

---

## Development

```bash
bun run tauri dev  # starts Vite + Tauri dev mode with hot reload
```

Frontend only (no Tauri window):

```bash
bun run dev
```

---

## Project structure

```
src/                  # React + TypeScript frontend
src-tauri/            # Rust backend (Tauri commands, file I/O)
src-tauri/src/        # Rust source
docs/                 # User guide, developer guide
public/               # Static assets
```

---

## Code standards

### TypeScript / React

- Formatter + linter: **Biome** (`bun run check`)
- 2-space indent, double quotes, 100-char line width
- No `as any`, no `@ts-ignore`
- React 19, functional components only
- State via **Zustand**; keep stores small and focused

Auto-fix:

```bash
bun run lint:fix   # fix lint issues
bun run format     # format src/
```

### Rust

- Format: `cargo fmt`
- Lint: `cargo clippy -- -D warnings` (zero warnings policy)

### Commit messages

Conventional Commits enforced by commitlint + husky:

```
<type>(<scope>): <subject>
```

Types: `feat` · `fix` · `chore` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `revert`

Rules:
- Subject lowercase
- Subject max 100 chars
- No period at end

Examples:

```
feat(editor): add vim keybindings
fix(preview): correct mermaid re-render on tab switch
docs: update keyboard shortcuts table
```

---

## Testing

```bash
bun run test              # run all frontend tests
bun run test:watch        # watch mode
bun run test:coverage     # coverage report → coverage/
```

Rust:

```bash
cargo test --lib          # run unit tests
```
working-directory: `src-tauri/`

Write tests for:
- New features (happy path + edge cases)
- Bug fixes (regression test)

---

## CI

CI runs on every push and PR to `main` / `develop`:

| Job | Checks |
|---|---|
| Frontend | typecheck · lint · test · coverage |
| Rust | rustfmt · clippy · cargo test |
| Audit | npm audit · cargo audit |

PRs must pass all jobs before merge.

---

## Pull request workflow

1. Fork → branch off `main`
2. Branch naming: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`
3. Keep PRs focused — one concern per PR
4. Add or update tests for changed behavior
5. Run `bun run check` and `cargo clippy` locally before pushing
6. Fill out the PR description: what changed, why, how to test

---

## Reporting bugs

Open an issue with:
- NoteBuddy version
- macOS version
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs (Help → Open Log File)

---

## License

By contributing you agree your code is licensed under [MIT](LICENSE).
