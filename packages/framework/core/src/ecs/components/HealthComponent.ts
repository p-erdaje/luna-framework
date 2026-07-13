import type { IComponent } from "../IComponent";

/**
 * HealthComponent
 *
 * Pure data: current/max hit points for an entity. Never mutated
 * directly by game code — {@link HealthSystem} owns all changes to
 * `current` so damage/heal is always clamped and always goes through
 * the same event-emitting path.
 */
export interface HealthComponent extends IComponent {
  readonly type: "health";
  current: number;
  max: number;
}

/**
 * Creates a HealthComponent, defaulting `current` to full health.
 * A small factory instead of hand-writing the object literal everywhere
 * — guards against typo'ing the `type` discriminator.
 */
export function createHealthComponent(max: number, current: number = max): HealthComponent {
  return { type: "health", max, current };
}
