import type { Entity } from "../../ecs/Entity";
import type { IEventBus } from "../../events/IEventBus";
import type { HealthComponent } from "./HealthComponent";
import type { HealthChangedEvent, HealthDiedEvent, HealthRevivedEvent } from "./HealthEvents";

const HEALTH_COMPONENT_TYPE = "health";
const HEALTH_CHANGED_EVENT = "health:changed";
const HEALTH_DIED_EVENT = "health:died";
const HEALTH_REVIVED_EVENT = "health:revived";

const MIN_HEALTH = 0;

/**
 * HealthSystem
 *
 * Applies damage and healing to entities carrying a {@link HealthComponent},
 * clamping values and emitting EventBus notifications so combat feedback,
 * UI health bars (via UIBridgeStore), and death handling can all react
 * without polling. Unlike a per-frame {@link ISystem}, health changes are
 * action-driven — triggered by an attack, a potion, a trap — not something
 * that needs continuous processing every frame, so this is a plain service
 * class rather than something registered with a World.
 *
 * Framework-agnostic and fully unit testable: no Phaser or DOM dependency.
 */
export class HealthSystem {
  private readonly _eventBus?: IEventBus;

  public constructor(eventBus?: IEventBus) {
    this._eventBus = eventBus;
  }

  /**
   * Reduce an entity's current health by `amount`, clamped to 0. Negative
   * or zero amounts are ignored (use heal() to restore health instead).
   * No-ops silently if the entity has no HealthComponent.
   */
  public applyDamage(entity: Entity, amount: number): void {
    if (amount <= 0) {
      return;
    }

    const health = this._getHealth(entity);
    if (!health) {
      return;
    }

    const previous = health.current;
    health.current = Math.max(MIN_HEALTH, health.current - amount);

    if (health.current === previous) {
      return;
    }

    this._emitChanged(entity.id, health, health.current - previous);

    if (previous > MIN_HEALTH && health.current === MIN_HEALTH) {
      this._eventBus?.emit<HealthDiedEvent>(HEALTH_DIED_EVENT, { entityId: entity.id });
    }
  }

  /**
   * Increase an entity's current health by `amount`, clamped to max.
   * Negative or zero amounts are ignored. Does nothing to a dead entity —
   * use revive() to bring a dead entity back instead. No-ops silently if
   * the entity has no HealthComponent.
   */
  public heal(entity: Entity, amount: number): void {
    if (amount <= 0) {
      return;
    }

    const health = this._getHealth(entity);
    if (!health || health.current === MIN_HEALTH) {
      return;
    }

    const previous = health.current;
    health.current = Math.min(health.max, health.current + amount);

    if (health.current !== previous) {
      this._emitChanged(entity.id, health, health.current - previous);
    }
  }

  /**
   * Bring a dead entity (0 health) back to `amount` health (defaults to
   * full max health). Does nothing if the entity is still alive — heal()
   * is the correct call for a living entity.
   */
  public revive(entity: Entity, amount?: number): void {
    const health = this._getHealth(entity);
    if (!health || health.current > MIN_HEALTH) {
      return;
    }

    health.current = Math.min(health.max, Math.max(MIN_HEALTH, amount ?? health.max));

    if (health.current > MIN_HEALTH) {
      this._eventBus?.emit<HealthRevivedEvent>(HEALTH_REVIVED_EVENT, {
        entityId: entity.id,
        current: health.current,
        max: health.max
      });
    }
  }

  /** Whether the entity's current health is exactly 0. Entities with no HealthComponent are never "dead" — they're simply not tracked. */
  public isDead(entity: Entity): boolean {
    const health = this._getHealth(entity);
    return health !== undefined && health.current === MIN_HEALTH;
  }

  /** Whether the entity's current health equals its max. False for an entity with no HealthComponent. */
  public isFullHealth(entity: Entity): boolean {
    const health = this._getHealth(entity);
    return health !== undefined && health.current === health.max;
  }

  /** Current health as a 0-1 fraction of max. Returns 0 for an entity with no HealthComponent or a max of 0. */
  public getHealthPercentage(entity: Entity): number {
    const health = this._getHealth(entity);
    if (!health || health.max === MIN_HEALTH) {
      return 0;
    }
    return health.current / health.max;
  }

  private _getHealth(entity: Entity): HealthComponent | undefined {
    return entity.getComponent<HealthComponent>(HEALTH_COMPONENT_TYPE);
  }

  private _emitChanged(entityId: string, health: HealthComponent, delta: number): void {
    this._eventBus?.emit<HealthChangedEvent>(HEALTH_CHANGED_EVENT, {
      entityId,
      current: health.current,
      max: health.max,
      delta
    });
  }
}
