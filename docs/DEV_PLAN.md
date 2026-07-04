=== Plan for Web Game Framework App Development ===

---PRODUCTION--

| Category                    | Technology               |  Status  | Purpose                               | Notes                                    |
| --------------------------- | ------------------------ | :------: | ------------------------------------- | ---------------------------------------- |
| **Language**                | TypeScript               |     ✅    | Main programming language             | Strict Mode enabled                      |
| **Game Engine**             | Phaser 3                 |     ✅    | 2D Web Game Engine                    | WebGL renderer with Canvas fallback      |
| **Rendering**               | WebGL                    |     ✅    | Hardware-accelerated graphics         | Default renderer                         |
| **Build Tool**              | Vite                     |     ✅    | Development server & production build | Fast HMR and optimized builds            |
| **Monorepo Tooling**	      |Turborepo / npm Workspaces |   ⏳      | Framework & Apps Separation	      | (NEW) Separates @framework/core from sample games |
| **Runtime**                 | Node.js (LTS)            |     ✅    | Backend runtime environment           | Use latest LTS version                   |
| **Backend Framework**       | Fastify                  |     ✅    | REST API & backend services           | High performance and TypeScript-friendly |
| **Backend Security**	      |@fastify/cors & @fastify/helmet |   ⏳	 | Secure API headers & CORS          |	(NEW) Crucial since UI/Canvas and Backend might decouple |
| **API Rate Limiting**       | @fastify/rate-limit      |    ⏳    | Prevent abuse on public endpoints     | (NEW) Mandatory before auth/multiplayer endpoints go live |
| **API Documentation**       | @fastify/swagger (OpenAPI) |   ⏳    | Auto-generated REST API docs          | (NEW) Keeps API contract in sync with code, useful once sample games consume it |
| **Package Manager**         | npm                      |     ✅    | Dependency management                 | Lock file committed                      |
| **Database**                | PostgreSQL               |     ✅    | Primary relational database           | Production-ready                         |
| **ORM**                     | Prisma                   |     ✅    | Database ORM                          | Type-safe database access                |
| **Validation**              | Zod                      |     ✅    | Runtime schema validation             | Shared frontend/backend validation       |
| **Authentication**          | JWT (Access + Refresh)   |    🔄    | User authentication                   | Multiplayer or online features. Short-lived access token + rotating refresh token |
| **Real-time Communication** | Socket.IO / Colyseus     |    🔄    | Multiplayer networking                | Depends on game requirements             |
| **Physics Engine**          | Phaser Arcade Physics    |     ✅    | Default physics engine                | Lightweight and fast                     |
| **Advanced Physics**        | Matter.js                | Optional | Complex physics simulation            | Use only if needed                       |
| **UI**                      | HTML5 + CSS3             |     ✅    | Menus, HUD, settings, overlays        | Separate from game canvas                |
| **UI State Bridge**	      |RxJS / Vanilla PubSub Store |	⏳    | Syncs Canvas data to HTML UI         |	(NEW) Lightweight reactive bridge for HUD/Menus |
| **Styling**                 | SCSS                     |     ✅    | Modular styling                       | Better CSS organization                  |
| **Graphics**                | LibreSprite / Aseprite   |     ✅    | Pixel art creation                    | LibreSprite (Free), Aseprite (Paid)      |
| **UI/UX Design**            | Figma                    |     ✅    | Wireframes and interface design       | Collaborative design                     |
| **Audio Editor**            | Audacity                 |     ✅    | Audio editing                         | Music and sound processing               |
| **Sound Effects**           | Bfxr                     |     ✅    | Retro game sound generation           | Quick SFX creation                       |
| **Testing**                 | Vitest                   |     ✅    | Unit testing                          | Fast TypeScript test runner              |
| **Linting**                 | ESLint                   |     ✅    | Static code analysis                  | Enforce coding standards                 |
| **Formatting**              | Prettier                 |     ✅    | Code formatting                       | Consistent code style                    |
| **Git Hooks**               | Husky                    |     ✅    | Pre-commit validation                 | Prevent bad commits                      |
| **Commit Convention**       | Commitlint               |     ✅    | Conventional commits                  | Standardized commit history              |
| **Environment Variables**   | dotenv                   |     ✅    | Configuration management              | Never commit `.env` files                |
| **Documentation**           | Markdown                 |     ✅    | Project documentation                 | README + `/docs` folder                  |
| **Version Control**         | Git                      |     ✅    | Source control                        | Git Flow workflow                        |
| **Repository Hosting**      | GitHub                   |     ✅    | Remote repository                     | CI/CD ready                              |
| **CI/CD Pipeline**          | GitHub Actions           |    ⏳    | Automated lint/test/build/deploy      | (NEW) Runs on every push & PR, see CI/CD section |
| **Deployment (Frontend)**   | Vercel / Netlify         |    🔄    | Web deployment                        | Select per project                       |
| **Deployment (Backend)**    | Docker                   |    🔄    | Containerization                      | Future production deployment             |
| **Monitoring**              | Sentry                   |  Future  | Error tracking                        | Production diagnostics                   |
| **Logging**                 | Pino                     |  Future  | Structured logging                    | High-performance logger                  |
| **Asset Management**        | Vite Asset Pipeline      |     ✅    | Static asset optimization             | Optimized loading                        |
| **Asset Packing**           | Free Texture Packer (CLI) |    ⏳     |Auto-generate Sprite Atlases         | (NEW) Bundles loose sprites into atlases on build |
| **Save System**             | LocalStorage + IndexedDB |     ✅    | Local game saves                      | Offline persistence                      |
| **Localization**            | JSON-based i18n          |  Future  | Multi-language support                | Easily expandable                        |
| **Project License**         | MIT / Apache 2.0 (TBD)   |    ⏳    | Legal usage terms                     | (NEW) Required before first public GitHub push |


---ARCHITECTURE AND ENGINEERING STANDARD---

| Category              | Standard / Pattern                                                               | Purpose                                               |
| --------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Architecture          | Modular Feature-Based Architecture                                               | Scalable project structure                            |
| Repository Pattern    | Monorepo Structure                                                               | Isolates reusable framework engine from game logic    |
| Programming Paradigm  | Object-Oriented Programming (OOP)                                                | Encapsulation, abstraction, inheritance, polymorphism |
| Design Approach       | Composition over Inheritance                                                     | Flexible and reusable components                      |
| Game Design Pattern   | Hybrid ECS (Entity Component System)                                             | Explicitly maps how Phaser GameObjects bind to custom components |
| Software Principles   | SOLID Principles                                                                 | Maintainable and extensible code                      |
| Code Principles       | DRY, KISS, YAGNI                                                                 | Clean and efficient codebase                          |
| Design Patterns       | Singleton, Factory, Builder, Strategy, Observer, Command, State, Adapter, Facade | Reusable architecture patterns                        |
| Event System          | Event Bus                                                                        | Loose coupling between modules                        |
| Dependency Management | Dependency Injection                                                             | Better testing and flexibility                        |
| Network Architecture  | Authoritative Server / Client Prediction                                         | Standardizes state reconciliation for multiplayer features |
| Data Structures       | Arrays, Maps, Sets, Queues, Stacks, Trees, Graphs, Priority Queues               | Efficient data handling                               |
| Algorithms            | A*, BFS, DFS, Binary Search                                                      | AI, pathfinding, and gameplay logic                   |
| Optimization          | Object Pooling                                                                   | Reduce garbage collection                             |
| Optimization          | Spatial Partitioning                                                             | Faster collision detection                            |
| Optimization          | QuadTree                                                                         | Efficient spatial queries                             |
| Optimization          | Delta Time Movement                                                              | Frame rate independence                               |
| Optimization          | Lazy Loading                                                                     | Faster startup time                                   |
| Optimization          | Sprite Atlas                                                                     | Reduce draw calls                                     |
| Optimization          | Asset Caching                                                                    | Improve loading performance                           |
| Optimization          | Memory Reuse                                                                     | Stable memory consumption                             |
| Versioning            | Semantic Versioning (SemVer)                                                     | (NEW) Prevents breaking sample games when @framework/core updates |


---ENGINEERING PRINCIPLES---

Objective:
Establish core engineering principles that will serve as a guide for all design decisions, architecture, coding standards, and future development of the framework.

*Core Principles

| #  | Principle                         | Description                                                                                                 |
| -- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1  | **Framework First**               | Every feature should be designed for reusability before being designed for a specific game.                 |
| 2  | **Performance by Design**         | Consider performance during architecture and optimize based on profiling and measurement.                   |
| 3  | **Keep It Simple (KISS)**         | Prefer simple, readable, and maintainable solutions over unnecessary complexity.                            |
| 4  | **Separation of Concerns**        | Each module should have one clear responsibility and avoid mixing unrelated logic.                          |
| 5  | **Loose Coupling**                | Modules should communicate through interfaces or events rather than direct dependencies whenever practical. |
| 6  | **High Cohesion**                 | Keep related functionality together to improve readability and maintainability.                             |
| 7  | **Composition Over Inheritance**  | Favor composition by default. Use inheritance only when there is a clear "is-a" relationship.               |
| 8  | **Configuration Over Hardcoding** | Store configurable values in centralized configuration rather than embedding them directly in code.         |
| 9  | **Convention Over Configuration** | Use sensible defaults to reduce unnecessary setup while still allowing customization when needed.           |
| 10 | **Developer Experience (DX)**     | APIs should be intuitive, consistent, and easy to understand.                                               |
| 11 | **Testable Core Logic**           | Core systems should be designed so they can be tested independently from Phaser or the browser.             |
| 12 | **Documentation First**           | Significant architectural decisions should be documented before implementation.                             |
| 13 | **Incremental Development**       | Deliver small, complete milestones instead of large unfinished features.                                    |
| 14 | **Backward Compatibility**        | Avoid breaking public APIs unless there is a compelling reason and a migration path.                        |
| 15 | **Consistency Over Cleverness**   | Favor predictable, consistent code over overly clever or complex solutions.                                 |

*Engineering Rules

| Rule  | Guideline                                                                           |
| ----  | ----------------------------------------------------------------------------------- |
| ✅    | No duplicated business logic (DRY).                                                 |
| ✅    | No magic numbers or hardcoded strings.                                              |
| ✅    | Avoid global mutable state unless intentionally managed (e.g., singleton managers). |
| ✅    | Every public class and method should have a clear responsibility.                   |
| ✅    | Prefer dependency injection over creating dependencies inside classes.              |
| ✅    | Prefer interfaces for contracts between modules.                                    |
| ✅    | Avoid circular dependencies.                                                        |
| ✅    | Optimize only after identifying real bottlenecks through profiling.                 |
| ✅    | Every new module should be reusable unless intentionally game-specific.             |
| ✅    | Public APIs should remain stable whenever possible.                                 |


---SOFTWARE ARCHITECTURE---

Objective:
Create a highly modular, reusable, scalable, and maintainable framework where game-specific code is completely separated from engine/framework code.

Architecture Layers

┌───────────────────────────────────────────────┐
│                  Presentation Layer           │
│ HTML5 UI • CSS • HUD • Menus • Settings       │
└───────────────────────────────────────────────┘
                    ▲
                    │
              UI Bridge Store
                    │
                    ▼
┌───────────────────────────────────────────────┐
│                  Game Layer                   │
│ Scenes • Gameplay • Entities • Systems        │
└───────────────────────────────────────────────┘
                    ▲
                    │
                    ▼
┌───────────────────────────────────────────────┐
│              Framework Core                   │
│ Managers • EventBus • Services • Utilities    │
└───────────────────────────────────────────────┘
                    ▲
                    │
                    ▼
┌───────────────────────────────────────────────┐
│              Infrastructure                   │
│ Fastify • Prisma • PostgreSQL • File System   │
└───────────────────────────────────────────────┘

---PROJECT STRUCTURE---

Root

apps/
    sample-platformer/
    sample-rpg/
    sample-survival/

packages/
    framework/
        core/
        physics/
        ui/
        networking/
        utilities/

docs/

assets/

scripts/

tools/

.github/


---FOLDER STRUCTURE (Framework Core)---

framework/

core/
    game/
    scene/
    events/
    input/
    audio/
    assets/
    save/
    network/
    config/
    time/

ecs/
    entity/
    component/
    system/

graphics/

physics/

ui/

utils/

types/

interfaces/

constants/

tests/


---CODING STANDARDS---

| Rule | Standard |
|------|----------|
| ✅ | TypeScript Strict Mode only |
| ✅ | No "any" unless unavoidable |
| ✅ | One class = One responsibility |
| ✅ | Prefer const over let |
| ✅ | No magic numbers |
| ✅ | Maximum file length ≈300 lines (recommended) |
| ✅ | Maximum function length ≈40 lines (recommended) |
| ✅ | Public APIs fully documented |
| ✅ | Comments explain WHY, not WHAT |
| ✅ | Reusable before game-specific |


---NAMING CONVENTIONS---

Files
PlayerController.ts

Classes
PlayerController

Interfaces
IPlayer
ISaveSystem

Enums
PlayerState

Functions
movePlayer()

Variables
playerSpeed

Constants
MAX_PLAYER_SPEED

Private Members
_playerHealth

Boolean
isAlive
hasWeapon
canJump


---OOP GUIDELINES---

Manager
Global system ownership

Service
Business logic provider

Controller
Coordinates multiple systems

Factory
Object creation

Builder
Complex object creation

Component
Stores data only

System
Processes components

Entity
Unique game object

Utility
Stateless helper methods


---DESIGN PATTERN USAGE---

Singleton
Managers

Factory
Entity creation

Builder
Map generation

Strategy
Enemy AI

Observer
EventBus

Command
Input handling

State
Character states

Facade
Framework API

Adapter
Third-party libraries

Object Pool
Bullets
Particles
Enemies


---DATA STRUCTURE STRATEGY---

Array
Ordered collections

Map
Entity lookup

Set
Active objects

Queue
Loading pipeline

Stack
Scene navigation

Priority Queue
AI tasks

Graph
Dialogue
Pathfinding

Tree
UI hierarchy

QuadTree
Collision optimization

Spatial Grid
Large worlds


---PERFORMANCE STRATEGY---

Target FPS
60 FPS

Frame Time Budget
16.67 ms

Garbage Collection
Minimize allocations

Object Pooling
Reusable objects

Texture Atlases
Reduce draw calls

Lazy Loading
Load assets on demand

Delta Time
Frame-independent movement

Profiling First
Optimize only after measurement


---PUBLIC API DESIGN PRINCIPLES---

Goals

Simple

Predictable

Discoverable

Consistent

Example

engine.scene.create()

engine.assets.load()

engine.audio.play()

engine.entity.spawn()

engine.events.emit()

engine.network.connect()

engine.save.write()


---ERROR HANDLING STRATEGY---

Validation Error
Return Result

Recoverable Error
Retry

Fatal Error
Throw Exception

Network Error
Reconnect

Asset Error
Fallback Asset

Unexpected Error
Log + Report


---FRAMEWORK PHILOSOPHY---

The framework should never depend on a game.

Games depend on the framework.

Every module should be reusable.

Every feature should be testable.

Everything should be replaceable.

Prefer composition over inheritance.

Simple solutions first.

Performance is measured, not assumed.

Public APIs remain stable whenever possible.

Documentation is part of development.


---CI/CD PIPELINE STRATEGY--- (NEW)

Objective:
Every push and pull request should be automatically verified before merge, so quality gates are enforced from the first commit, not added later.

| Stage           | Tool / Action                     | Trigger                | Purpose                                  |
| ---------------- | ---------------------------------- | ----------------------- | ----------------------------------------- |
| Lint             | ESLint + Prettier check            | On push / PR            | Enforce coding standards                  |
| Type Check       | tsc --noEmit                       | On push / PR            | Catch type errors before runtime          |
| Unit Test        | Vitest                             | On push / PR            | Verify core logic correctness             |
| Build            | Vite / Turborepo build             | On push / PR            | Ensure framework & apps compile cleanly   |
| Commit Lint      | Commitlint                         | On commit (Husky)       | Enforce conventional commit messages      |
| Deploy (Preview) | Vercel/Netlify preview deploy      | On PR                   | QA review before merging                  |
| Deploy (Prod)    | Vercel/Netlify + Docker            | On merge to `main`      | Ship to production                        |

Branch Protection Rules (recommended):
- `main` requires passing CI + at least 1 review before merge
- No direct pushes to `main` or `develop`
- Squash merge preferred for clean history


---TESTING STRATEGY--- (EXPANDED)

| Layer            | Approach                                              | Notes                                              |
| ----------------- | ------------------------------------------------------ | --------------------------------------------------- |
| Unit Tests        | Vitest, isolated per class/function                    | Core framework logic tested independent of Phaser   |
| Integration Tests | Vitest + test DB (Prisma)                              | Validates API + DB interactions                     |
| ECS Component Tests | Test components/systems as plain TS classes           | Decouple logic from Phaser GameObject where possible so it's testable without a browser/canvas |
| Coverage Target   | ≥ 80% for `packages/framework/*`                        | Sample game apps can have lower coverage priority   |
| Test Location     | Co-located `*.spec.ts` next to source file             | Easier discovery and maintenance                     |


---DATABASE MIGRATION & ENVIRONMENT STRATEGY--- (NEW)

| Environment | Purpose                        | Migration Approach                     |
| ------------ | -------------------------------- | ---------------------------------------- |
| Development  | Local iteration                  | `prisma migrate dev`                     |
| Staging      | Pre-production QA                | `prisma migrate deploy` via CI/CD        |
| Production   | Live environment                 | `prisma migrate deploy`, backup before run |

Rules:
- Never run `prisma migrate dev` against staging/production.
- Every migration must be reviewed in PR before merge.
- Rollback plan required for destructive migrations (column drops, type changes).
- Separate `.env` per environment; never commit any of them.


---FRAMEWORK VERSIONING STRATEGY--- (NEW)

- `@framework/core` and other framework packages follow Semantic Versioning (MAJOR.MINOR.PATCH).
- MAJOR: breaking public API change.
- MINOR: new backward-compatible feature.
- PATCH: bug fix, no API change.
- Sample games (`apps/*`) pin exact framework versions; upgrades are deliberate, not automatic.
- Changelog maintained per package (`CHANGELOG.md`), following Conventional Commits to auto-generate entries.


---BROWSER & DEVICE COMPATIBILITY--- (NEW)

| Target             | Support Level                          |
| ------------------- | ----------------------------------------- |
| Desktop Chrome/Edge | Full support (primary target)             |
| Desktop Firefox     | Full support                              |
| Desktop Safari      | Full support, verify WebGL quirks         |
| Mobile Chrome/Safari| Supported, touch input required           |
| Legacy browsers (IE11, old Edge) | Not supported, Canvas fallback only as best-effort |

Minimum requirements: WebGL-capable browser recommended; Canvas fallback ensures broader reach but reduced performance.


---LICENSE--- (NEW)

- A `LICENSE` file must be added before the first public push to GitHub.
- Recommended: MIT (permissive, simple) unless there's a reason to restrict reuse (e.g. Apache 2.0 for patent grant clauses).
- Decision should be finalized during Phase 1 before repository goes public.


---DEVELOPMENT ROADMAP---

***PHASE 1: Planning & Architecture (Current)***

#    | Task                                                   | Status
1    | Project Vision                                         | ✅
2    | Production Tech Stack                                  | ✅
3    | Engineering Principles                                 | ✅
3.5  | Monorepo Strategy & Package Boundaries                 | ⏳ (NEW)
4    | Software Architecture                                  | ⏳
4.5  | Phaser-to-HTML UI Communication Bridge Design          | ⏳ (NEW)
5    | Project Structure                                      | ⏳
6    | Folder Structure                                       | ⏳
7    | Coding Standards                                       | ⏳
8    | Naming Conventions                                     | ⏳
9    | OOP Guidelines                                         | ⏳
10   | SOLID Principles                                       | ⏳
11   | Design Patterns                                        | ⏳
11.5 | Multiplayer State-Sync & Reconciliation Spec           | ⏳ (NEW)
12   | DSA Strategy                                           | ⏳
13   | Performance Strategy                                   | ⏳
13.5 | Automated Sprite Packing Build Pipeline Spec           | ⏳ (NEW)
14   | Public API Design Guidelines                           | ⏳ (NEW)
15   | Error Handling Strategy                                | ⏳ (NEW)
15.5 | CI/CD Pipeline Definition                              | ⏳ (NEW)
15.6 | Testing Strategy (Coverage & ECS test approach)        | ⏳ (NEW)
15.7 | Database Migration & Environment Strategy              | ⏳ (NEW)
15.8 | Framework Versioning Strategy (SemVer)                 | ⏳ (NEW)
15.9 | Browser & Device Compatibility Targets                 | ⏳ (NEW)
16   | Git Workflow                                           | ⏳
17   | Development Workflow                                   | ⏳
18   | Documentation Structure                                | ⏳
19   | Framework Philosophy                                   | ⏳
20   | License Selection                                      | ⏳ (NEW)
21   | Roadmap                                                | ⏳


***PHASE 2: Framework Foundation***

Example:
Core
├── Game
├── SceneManager
├── AssetManager (with Auto-Atlas Loader) [UPDATED]
├── AudioManager
├── InputManager
├── EventBus
├── UIBridgeStore (Phaser <-> HTML5 Link) [NEW]
├── NetworkManager (HTTP/WebSocket Abstraction) [NEW]
├── SaveManager
├── ConfigManager
└── TimeManager


***PHASE 3: Core Gameplay Systems***

Reusable Systems:

Entity System

Component System

Inventory

Combat

Dialogue

Quest

NPC

AI

Animation

Effects

Camera

Collision

Save

Achievements


***PHASE 4: Optimization***

Target (stable 60 FPS):

Object Pool

Spatial Grid

QuadTree

Asset Streaming

Texture Atlas

Animation Cache

Memory Pool

Performance Profiler


***PHASE 5: Sample Game***

Framework Demo


***PHASE 6: More Games***
