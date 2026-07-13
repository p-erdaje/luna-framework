import type { IEventBus } from "../../events/IEventBus";
import type { HealthComponent } from "../components/HealthComponent";
import type { Entity } from "../Entity";
import type { EntityDiedEvent, HealthChangedEvent, IHealthSystem } from "./IHealthSystem";

const HEALTH_CHANGED_EVENT = "health:changed";
const ENTITY_DIED_EVENT = "entity:died";
const MIN_HEALTH = 0;

/**
 * HealthSystem
 *
 * Default framework implementation of {@link IHealthSystem}. Queued
 * damage/heal amounts accumulate per entity in an internal map;
 * update() drains that map once per frame, applies the net change to
 * each entity's HealthComponent clamped to [0, max], and emits
 * "health:changed" (and "entity:died" the frame health first reaches
 * 0) on the EventBus if one was provided.
 *
 * Batching this way means ten damage instances landing on the same
 * entity in one frame produce one clamp and one event, not ten.
 *
 * Framework-agnostic and testable with plain Entity/HealthComponent
 * objects — no Phaser or browser involved (see HealthSystem.spec.ts).
 */
export class HealthSystem implements IHealthSystem {
  public readonly requiredComponents = ["health"] as const;

  private readonly _eventBus?: IEventBus;
  private readonly _pendingDeltas = new Map<string, number>();

  public constructor(eventBus?: IEventBus) {
    this._eventBus = eventBus;
  }

  public queueDamage(entityId: string, amount: number): void {
    if (amount <= 0) {
      return;
    }
    this._accumulate(entityId, -amount);
  }

  public queueHeal(entityId: string, amount: number): void {
    if (amount <= 0) {
      return;
    }
    this._accumulate(entityId, amount);
  }

  public update(entities: readonly Entity[]): void {
    if (this._pendingDeltas.size === 0) {
      return;
    }

    for (const entity of entities) {
      const delta = this._pendingDeltas.get(entity.id);
      if (delta === undefined || delta === 0) {
        continue;
      }

      const health = entity.getComponent<HealthComponent>("health");
      if (!health) {
        continue;
      }

      this._applyDelta(entity.id, health, delta);
    }

    // Cleared unconditionally: any delta queued for an id that wasn't
    // in this frame's matching entities (already destroyed, or never
    // had a health component) is silently dropped rather than
    // lingering forever.
    this._pendingDeltas.clear();
  }

  private _accumulate(entityId: string, delta: number): void {
    this._pendingDeltas.set(entityId, (this._pendingDeltas.get(entityId) ?? 0) + delta);
  }

  private _applyDelta(entityId: string, health: HealthComponent, delta: number): void {
    const previous = health.current;
    const clamped = Math.min(health.max, Math.max(MIN_HEALTH, previous + delta));

    if (clamped === previous) {
      return;
    }

    health.current = clamped;

    this._eventBus?.emit<HealthChangedEvent>(HEALTH_CHANGED_EVENT, {
      entityId,
      previous,
      current: clamped,
      max: health.max
    });

    if (clamped === MIN_HEALTH && previous > MIN_HEALTH) {
      this._eventBus?.emit<EntityDiedEvent>(ENTITY_DIED_EVENT, { entityId });
    }
  }
}
