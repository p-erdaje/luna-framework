import type { IComponent } from "../../ecs/IComponent";

/**
 * AttackComponent
 *
 * Pure data — how hard an entity hits, how often it can attack, and
 * when it's next allowed to. `readyAt` is a timestamp (ms, same clock
 * as {@link ITimeManager}) mutated only by {@link CombatSystem}; never
 * set directly by game code.
 */
export interface AttackComponent extends IComponent {
  readonly type: "attack";
  power: number;
  cooldownMs: number;
  /** Timestamp (ms) when this entity is next allowed to attack. 0 means ready immediately. */
  readyAt: number;
  /** Probability (0-1) of a critical hit. Omit or 0 for an entity that never crits. */
  critChance?: number;
  /** Damage multiplier applied on a critical hit. Defaults to 2 if critChance is set but this isn't. */
  critMultiplier?: number;
}
