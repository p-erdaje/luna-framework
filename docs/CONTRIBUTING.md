# Contributing

## Before you start

- Node.js 20 LTS or newer required.
- Run `npm install` at the repo root (not inside individual packages).

## Coding standards

- TypeScript strict mode. No `any` unless truly unavoidable.
- One class = one responsibility.
- No magic numbers or hardcoded strings — use named constants.
- Max file length ~300 lines, max function length ~40 lines (soft limit).
- Comments explain **why**, not what the code already says.
- New framework code should be reusable, not game-specific, unless explicitly building a sample app.

## Naming

| Type | Convention | Example |
|---|---|---|
| File | PascalCase | `PlayerController.ts` |
| Class | PascalCase | `PlayerController` |
| Interface | `I` prefix | `IPlayer` |
| Enum | PascalCase | `PlayerState` |
| Function | camelCase | `movePlayer()` |
| Constant | UPPER_SNAKE_CASE | `MAX_PLAYER_SPEED` |
| Private member | `_` prefix | `_playerHealth` |
| Boolean | is/has/can prefix | `isAlive`, `hasWeapon` |

## Commit messages

This repo uses [Conventional Commits](https://www.conventionalcommits.org/), enforced by Commitlint via a Husky hook.

```
feat: add EventBus priority queue
fix: correct sprite atlas path resolution
docs: update architecture notes
chore: bump turbo version
```

Commits that don't follow this format will be rejected at commit time.

## Before committing

Husky runs lint and typecheck automatically on `pre-commit`. If either fails, the commit is blocked — fix the reported issue and try again.

You can also run these manually:

```bash
npm run lint
npm run typecheck
npm run test
```

## Branching

- No direct pushes to `main` or `develop`.
- Open a PR; CI (lint, typecheck, test, build) must pass before merge.
- Squash merge preferred for a clean history.

## Versioning

Framework packages (`@luna/*`) follow Semantic Versioning. Breaking API changes require a MAJOR bump and a documented migration path — see [DEV_PLAN.md](./DEV_PLAN.md#framework-versioning-strategy-new).
