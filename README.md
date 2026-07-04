# Luna

A modular, reusable web game framework built with **Phaser 3**, **TypeScript**, **Fastify**, and **Prisma**.

Luna separates reusable framework code from game-specific code, so you can build multiple games on top of the same core engine without duplicating logic.

![Build](https://github.com/p-erdaje/luna-framework/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)

---

## What's inside

This is a monorepo (npm Workspaces + Turborepo) with two kinds of packages:

| Path | What it is |
|---|---|
| `packages/framework/core` | Managers, EventBus, services — the engine's foundation |
| `packages/framework/physics` | Physics helpers on top of Phaser Arcade / Matter.js |
| `packages/framework/ui` | HTML5 UI layer (HUD, menus, settings) |
| `packages/framework/networking` | Multiplayer / API networking abstraction |
| `packages/framework/utilities` | Stateless helpers shared across packages |
| `apps/sample-platformer` | A sample game that consumes the framework |

The framework packages never depend on any specific game. Games depend on the framework — never the other way around.

---

## Getting started

**Requirements:** Node.js 20 LTS or newer.

```bash
git clone https://github.com/p-erdaje/luna-framework.git
cd luna-framework
npm install
```

Run everything:

```bash
npm run dev        # start all dev servers
npm run build       # build all packages
npm run test        # run unit tests
npm run lint         # lint all packages
npm run typecheck   # type-check all packages
```

Turborepo handles the build order automatically — `@luna/core` builds before anything that depends on it.

---

## Project structure

```
apps/
  sample-platformer/     # demo game

packages/
  framework/
    core/
    physics/
    ui/
    networking/
    utilities/

docs/                    # architecture, contributing, roadmap
```

---

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — layers, patterns, and how modules talk to each other
- [Getting Started](./docs/GETTING_STARTED.md) — local setup in more detail
- [Contributing](./docs/CONTRIBUTING.md) — coding standards, commit conventions, branch rules
- [Dev Plan](./docs/DEV_PLAN.md) — the full technical plan and roadmap

---

## Engineering principles (short version)

- Framework first — build for reuse before building for one game.
- Composition over inheritance.
- No public API breaks without a migration path.
- Every core system should be testable outside the browser.

Full list in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## License

MIT — see [LICENSE](./LICENSE).
