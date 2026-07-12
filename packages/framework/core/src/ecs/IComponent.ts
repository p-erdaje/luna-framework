/**
 * IComponent
 *
 * Base contract every ECS component implements. A component is pure
 * data — no behavior, no lifecycle hooks. `type` is the string key an
 * Entity stores it under and a System declares as a requirement (see
 * docs/ARCHITECTURE.md -> Game Design Pattern: Hybrid ECS).
 *
 * @example
 * interface PositionComponent extends IComponent {
 *   readonly type: "position";
 *   x: number;
 *   y: number;
 * }
 */
export interface IComponent {
  readonly type: string;
}
