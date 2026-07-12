import type { IComponent } from "./IComponent";

/**
 * Entity
 *
 * A lightweight container identified by a unique id, holding at most
 * one component per type (adding a component with a type already
 * present overwrites the old one). Entities carry no game logic of
 * their own — that lives in Systems, which query entities by the
 * component types they need (see docs/ARCHITECTURE.md -> Hybrid ECS).
 *
 * Entities are framework-agnostic: nothing here depends on Phaser or
 * the DOM, so ECS logic is fully unit testable in isolation.
 *
 * @example
 * const entity = new Entity("entity-0");
 * entity.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });
 * entity.hasComponent("position"); // true
 */
export class Entity {
  private readonly _components = new Map<string, IComponent>();

  public constructor(public readonly id: string) {}

  /** Add a component, keyed by its `type`. Overwrites any existing component of the same type. */
  public addComponent<T extends IComponent>(component: T): void {
    this._components.set(component.type, component);
  }

  /** Get the component stored under a type, or undefined if the entity doesn't have one. */
  public getComponent<T extends IComponent>(type: string): T | undefined {
    return this._components.get(type) as T | undefined;
  }

  /** Whether the entity currently has a component of this type. */
  public hasComponent(type: string): boolean {
    return this._components.has(type);
  }

  /** Whether the entity has every one of the given component types. Used by World to match entities against a System's requirements. */
  public hasComponents(types: readonly string[]): boolean {
    return types.every((type) => this._components.has(type));
  }

  /** Remove the component of this type, if present. Safe to call even if the entity never had one. */
  public removeComponent(type: string): void {
    this._components.delete(type);
  }

  /** Read-only list of every component type currently attached to this entity. */
  public getComponentTypes(): readonly string[] {
    return Array.from(this._components.keys());
  }
}
