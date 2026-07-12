import { Entity } from "./Entity";
import type { ISystem } from "./ISystem";

const ENTITY_ID_PREFIX = "entity-";

/**
 * World
 *
 * Central ECS registry (also known as an EntityManager). Owns every
 * entity and every registered system, matches entities against each
 * system's requiredComponents, and drives the per-frame update loop.
 *
 * Framework-agnostic: no dependency on Phaser or the DOM, so a World
 * with plain data components and systems is fully unit testable
 * without a browser (see World.spec.ts).
 *
 * @example
 * const world = new World();
 * const player = world.createEntity();
 * player.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });
 * player.addComponent<VelocityComponent>({ type: "velocity", dx: 1, dy: 0 });
 *
 * world.registerSystem(new MovementSystem());
 *
 * // In the game loop:
 * world.update(deltaSeconds);
 */
export class World {
  private readonly _entities = new Map<string, Entity>();
  private readonly _systems: ISystem[] = [];
  private _nextEntityId = 0;

  /** Create a new entity with an auto-generated unique id and register it with the World. */
  public createEntity(): Entity {
    const entity = new Entity(`${ENTITY_ID_PREFIX}${this._nextEntityId}`);
    this._nextEntityId += 1;
    this._entities.set(entity.id, entity);
    return entity;
  }

  /** Remove an entity from the World. Safe to call even if the id doesn't exist. */
  public destroyEntity(id: string): void {
    this._entities.delete(id);
  }

  /** Look up an entity by id, or undefined if it doesn't exist (or was already destroyed). */
  public getEntity(id: string): Entity | undefined {
    return this._entities.get(id);
  }

  /** Read-only snapshot of every entity currently in the World. */
  public getAllEntities(): readonly Entity[] {
    return Array.from(this._entities.values());
  }

  /** Register a system. Its requiredComponents are matched against entities on every update(). */
  public registerSystem(system: ISystem): void {
    this._systems.push(system);
  }

  /** Unregister a system so it stops being processed on future update() calls. */
  public unregisterSystem(system: ISystem): void {
    const index = this._systems.indexOf(system);
    if (index !== -1) {
      this._systems.splice(index, 1);
    }
  }

  /** Every entity that has all of the given component types. */
  public queryEntities(componentTypes: readonly string[]): Entity[] {
    return this.getAllEntities().filter((entity) => entity.hasComponents(componentTypes));
  }

  /**
   * Advance one frame: for every registered system, find the entities
   * matching its requiredComponents and call system.update() with them.
   * A system with zero matching entities is skipped entirely for that
   * frame — no update() call, no unnecessary work (see docs/DEV_PLAN.md
   * -> Performance Strategy: Minimize allocations).
   */
  public update(deltaSeconds: number): void {
    for (const system of this._systems) {
      const matchingEntities = this.queryEntities(system.requiredComponents);
      if (matchingEntities.length > 0) {
        system.update(matchingEntities, deltaSeconds);
      }
    }
  }
}
