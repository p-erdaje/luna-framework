import { describe, expect, it } from "vitest";
import { Entity } from "./Entity";
import type { IComponent } from "./IComponent";

interface PositionComponent extends IComponent {
  readonly type: "position";
  x: number;
  y: number;
}

interface HealthComponent extends IComponent {
  readonly type: "health";
  current: number;
  max: number;
}

describe("Entity", () => {
  it("exposes the id it was constructed with", () => {
    const entity = new Entity("entity-0");

    expect(entity.id).toBe("entity-0");
  });

  it("reports hasComponent as false for a type that was never added", () => {
    const entity = new Entity("entity-0");

    expect(entity.hasComponent("position")).toBe(false);
  });

  it("reports hasComponent as true after addComponent()", () => {
    const entity = new Entity("entity-0");

    entity.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });

    expect(entity.hasComponent("position")).toBe(true);
  });

  it("getComponent() returns the exact component that was added", () => {
    const entity = new Entity("entity-0");
    const position: PositionComponent = { type: "position", x: 5, y: 10 };

    entity.addComponent(position);

    expect(entity.getComponent<PositionComponent>("position")).toBe(position);
  });

  it("getComponent() returns undefined for a type the entity doesn't have", () => {
    const entity = new Entity("entity-0");

    expect(entity.getComponent<PositionComponent>("position")).toBeUndefined();
  });

  it("addComponent() overwrites an existing component of the same type", () => {
    const entity = new Entity("entity-0");

    entity.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });
    entity.addComponent<PositionComponent>({ type: "position", x: 99, y: 99 });

    expect(entity.getComponent<PositionComponent>("position")).toEqual({
      type: "position",
      x: 99,
      y: 99
    });
  });

  it("removeComponent() removes the component so hasComponent() reports false", () => {
    const entity = new Entity("entity-0");

    entity.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });
    entity.removeComponent("position");

    expect(entity.hasComponent("position")).toBe(false);
  });

  it("removeComponent() does not throw for a type the entity never had", () => {
    const entity = new Entity("entity-0");

    expect(() => entity.removeComponent("position")).not.toThrow();
  });

  it("hasComponents() returns true only when every given type is present", () => {
    const entity = new Entity("entity-0");

    entity.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });
    entity.addComponent<HealthComponent>({ type: "health", current: 100, max: 100 });

    expect(entity.hasComponents(["position", "health"])).toBe(true);
    expect(entity.hasComponents(["position", "velocity"])).toBe(false);
  });

  it("hasComponents() returns true for an empty list of types", () => {
    const entity = new Entity("entity-0");

    expect(entity.hasComponents([])).toBe(true);
  });

  it("getComponentTypes() lists every currently attached component type", () => {
    const entity = new Entity("entity-0");

    entity.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });
    entity.addComponent<HealthComponent>({ type: "health", current: 100, max: 100 });

    expect(entity.getComponentTypes().sort()).toEqual(["health", "position"]);
  });

  it("keeps components of different entities independent", () => {
    const first = new Entity("entity-0");
    const second = new Entity("entity-1");

    first.addComponent<PositionComponent>({ type: "position", x: 1, y: 1 });

    expect(first.hasComponent("position")).toBe(true);
    expect(second.hasComponent("position")).toBe(false);
  });
});
