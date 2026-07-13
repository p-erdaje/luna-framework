import type { IComponent } from "../../ecs/IComponent";

/**
 * HealthComponent
 *
 * Pure data — current and max hit points for an entity. Mutated only
 * through {@link HealthSystem}, never set directly by game code, so
 * every change goes through clamping and event emission consistently.
 */
export interface HealthComponent extends IComponent {
  readonly type: "health";
  current: number;
  max: number;
}
