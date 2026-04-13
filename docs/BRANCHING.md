# Branching Strategy

## Branches

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Stable, release-ready. Protected. | Production release (on tag) |
| `develop` | Integration branch. All features merge here. | CI only |
| `feat/*` | New features. Branch from `develop`. | — |
| `fix/*` | Bug fixes. Branch from `develop` (hotfixes from `main`). | — |
| `chore/*` | Deps, tooling, refactor. | — |
| `docs/*` | Documentation only. | — |

## Flow

```
feat/my-feature  ──┐
fix/some-bug     ──┤──► develop ──► main ──► tag v1.x.x ──► release
chore/cleanup    ──┘
```

1. Branch from `develop`: `git checkout -b feat/my-feature develop`
2. Commit with conventional commits: `feat: add xyz` / `fix: broken thing`
3. Open PR → `develop`. CI must pass.
4. Squash-merge after review.
5. When ready to release: merge `develop` → `main`, tag `v1.x.x`.
6. Tag push triggers the release workflow → macOS universal build + release notes.

## Commit Convention (enforced by commitlint)

```
<type>(<scope>): <subject>

Types: feat | fix | chore | docs | style | refactor | perf | test | build | ci | revert
```

Examples:
```
feat(editor): add WYSIWYG toolbar
fix(blur): vibrancy not clearing on toggle
chore(deps): bump vitest to 4.2
```

## Hotfixes

```
git checkout -b fix/critical-crash main
# fix it
git checkout main && git merge --no-ff fix/critical-crash
git tag v1.0.1
git checkout develop && git merge main
```

## Protected Branch Rules (configure in GitHub settings)

- `main`: require PR, require CI pass, no force push, require linear history
- `develop`: require PR, require CI pass
