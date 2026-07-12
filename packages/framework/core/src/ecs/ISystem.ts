import type { Entity } from "./Entity";

/**
 * ISystem
 *
 * Contract for ECS systems — pure logic that runs once per frame
 * against every entity that has all of `requiredComponents`. A System
 * never queries entities itself; {@link World} does the matching and
 * hands the filtered list in, which is what keeps systems trivially
 * unit testable (just call update() with a hand-built entity array).
 *
 * @example
 * class MovementSystem implements ISystem {
 *   readonly requiredComponents = ["position", "velocity"] as const;
 *
 *   update(entities: readonly Entity[], deltaSeconds: number): void {
 *     for (const entity of entities) {
 *       const position = entity.getComponent<PositionComponent>("position")!;
 *       const velocity = entity.getComponent<VelocityComponent>("velocity")!;
 *       position.x += velocity.dx * deltaSeconds;
 *       position.y += velocity.dy * deltaSeconds;
 *     }
 *   }
 * }
 */
export interface ISystem {
  /** Component types an entity must have for this system to process it. */
  readonly requiredComponents: readonly string[];

  /** Process every entity that has all of requiredComponents. Called once per World.update(). */
  update(entities: readonly Entity[], deltaSeconds: number): void;
}
