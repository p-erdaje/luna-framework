# Architecture

## Layers

Luna is organized into four layers. Each layer only talks to the one directly below it.

```
Presentation Layer     HTML5 UI, HUD, menus, settings
        |
   UI Bridge Store       (syncs Canvas <-> HTML UI)
        |
Game Layer              Scenes, gameplay, entities, systems
        |
Framework Core           Managers, EventBus, services, utilities
        |
Infrastructure           Fastify, Prisma, PostgreSQL, file system
```

The framework never depends on a specific game. Games depend on the framework.

## Design approach

- **Composition over inheritance** — favored by default; inheritance only for clear "is-a" relationships.
- **Hybrid ECS** — Phaser GameObjects bind to custom components rather than a pure ECS rewrite.
- **Event Bus** — modules communicate through events, not direct references, to stay loosely coupled.
- **Dependency Injection** — dependencies are passed in, not created inside classes.

## Patterns in use

| Pattern | Where |
|---|---|
| Singleton | Managers |
| Factory | Entity creation |
| Builder | Map generation |
| Strategy | Enemy AI |
| Observer | EventBus |
| Command | Input handling |
| State | Character states |
| Facade | Framework's public API |
| Adapter | Third-party library wrappers |
| Object Pool | Bullets, particles, enemies |

## Core principles

1. Framework first — reusability before game-specific need.
2. Performance by design — profile before optimizing.
3. Keep it simple.
4. Separation of concerns — one responsibility per module.
5. Loose coupling via interfaces/events.
6. Testable core logic — framework code should run without a browser.
7. Public APIs stay stable; breaking changes need a migration path.

See [DEV_PLAN.md](./DEV_PLAN.md) for the full technical plan, including performance strategy, error handling, and the complete roadmap.
