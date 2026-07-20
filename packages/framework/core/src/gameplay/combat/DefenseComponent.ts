import type { IComponent } from "../../ecs/IComponent";

/**
 * DefenseComponent
 *
 * Pure data — flat damage reduction applied to incoming attacks.
 * Entirely optional: a target with no DefenseComponent takes attack
 * damage at full value (see {@link CombatSystem}).
 */
export interface DefenseComponent extends IComponent {
  readonly type: "defense";
  armor: number;
}
