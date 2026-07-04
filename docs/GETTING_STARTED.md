# Getting Started

## Prerequisites

- **Node.js 20 LTS or newer** — check with `node -v`
- **npm** (comes with Node.js) — check with `npm -v`
- **Git**

## Clone and install

```bash
git clone https://github.com/p-erdaje/luna-framework.git
cd luna-framework
npm install
```

This installs dependencies for every package in the monorepo (root, all `packages/framework/*`, and `apps/*`) in one pass — that's what npm Workspaces does.

## Common commands

Run these from the **repo root**, not inside individual package folders. Turborepo will fan them out to every package that defines the matching script.

| Command | What it does |
|---|---|
| `npm run dev` | Starts dev servers for all packages (watch mode) |
| `npm run build` | Builds every package, in dependency order |
| `npm run test` | Runs unit tests (Vitest) |
| `npm run test:coverage` | Runs tests with coverage report |
| `npm run lint` | Lints all packages (ESLint) |
| `npm run lint:fix` | Lints and auto-fixes what it can |
| `npm run typecheck` | Type-checks all packages without emitting files |
| `npm run format` | Formats the whole repo with Prettier |
| `npm run clean` | Removes build output and `node_modules` |

## Working on a single package

You can also run a script for just one package using its workspace name:

```bash
npm run build --workspace=@luna/core
npm run dev --workspace=sample-platformer
```

## Environment variables

Copy `.env.example` to `.env` and fill in real values. Never commit `.env` — it's already in `.gitignore`.

```bash
cp .env.example .env
```

## Troubleshooting

**"Cannot find package X" during lint/build** — run `npm install` again; a dependency may be missing from `package.json`.

**Vite build fails with "Could not resolve entry module index.html"** — the app package needs an `index.html` at its root; Vite uses it as the build entry point.

**Turborepo cache seems stale** — run `npm run clean` then reinstall and rebuild.
