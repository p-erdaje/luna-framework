import type { ISystem } from "../ISystem";

/** Emitted on the EventBus whenever an entity's health actually changes (after clamping). */
export interface HealthChangedEvent {
  readonly entityId: string;
  readonly previous: number;
  readonly current: number;
  readonly max: number;
}

/** Emitted on the EventBus the frame an entity's health reaches 0. Fires once per death, not repeatedly while at 0. */
export interface EntityDiedEvent {
  readonly entityId: string;
}

/**
 * IHealthSystem
 *
 * Command-queue system for health/damage. Damage and healing are never
 * applied directly to a HealthComponent — they're queued via
 * queueDamage()/queueHeal() (callable any time, from any system or
 * game code) and applied all at once in update(), clamped to
 * [0, max], with events emitted for the results.
 */
export interface IHealthSystem extends ISystem {
  /** Queue damage for an entity. Amounts <= 0 are ignored. Multiple calls in the same frame accumulate before being applied. */
  queueDamage(entityId: string, amount: number): void;

  /** Queue healing for an entity. Amounts <= 0 are ignored. */
  queueHeal(entityId: string, amount: number): void;
}
