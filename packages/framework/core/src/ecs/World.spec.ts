import { describe, expect, it, vi } from "vitest";
import type { IComponent } from "./IComponent";
import type { ISystem } from "./ISystem";
import { World } from "./World";

interface PositionComponent extends IComponent {
  readonly type: "position";
  x: number;
  y: number;
}

interface VelocityComponent extends IComponent {
  readonly type: "velocity";
  dx: number;
  dy: number;
}

describe("World — entity lifecycle", () => {
  it("createEntity() returns an entity with a unique id", () => {
    const world = new World();

    const first = world.createEntity();
    const second = world.createEntity();

    expect(first.id).not.toBe(second.id);
  });

  it("createEntity() registers the entity so getEntity() can find it", () => {
    const world = new World();

    const entity = world.createEntity();

    expect(world.getEntity(entity.id)).toBe(entity);
  });

  it("getEntity() returns undefined for an id that was never created", () => {
    const world = new World();

    expect(world.getEntity("nonexistent")).toBeUndefined();
  });

  it("destroyEntity() removes the entity so getEntity() no longer finds it", () => {
    const world = new World();
    const entity = world.createEntity();

    world.destroyEntity(entity.id);

    expect(world.getEntity(entity.id)).toBeUndefined();
  });

  it("destroyEntity() does not throw for an id that doesn't exist", () => {
    const world = new World();

    expect(() => world.destroyEntity("nonexistent")).not.toThrow();
  });

  it("getAllEntities() returns every entity created so far", () => {
    const world = new World();

    const first = world.createEntity();
    const second = world.createEntity();

    expect(world.getAllEntities()).toEqual([first, second]);
  });

  it("getAllEntities() excludes entities that were destroyed", () => {
    const world = new World();

    const first = world.createEntity();
    const second = world.createEntity();
    world.destroyEntity(first.id);

    expect(world.getAllEntities()).toEqual([second]);
  });
});

describe("World — queries", () => {
  it("queryEntities() returns only entities that have every required component type", () => {
    const world = new World();

    const withBoth = world.createEntity();
    withBoth.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });
    withBoth.addComponent<VelocityComponent>({ type: "velocity", dx: 1, dy: 0 });

    const positionOnly = world.createEntity();
    positionOnly.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });

    const result = world.queryEntities(["position", "velocity"]);

    expect(result).toEqual([withBoth]);
  });

  it("queryEntities() returns an empty array when nothing matches", () => {
    const world = new World();
    world.createEntity();

    expect(world.queryEntities(["position"])).toEqual([]);
  });
});

describe("World — systems", () => {
  function createFakeSystem(requiredComponents: readonly string[]): ISystem & { update: ReturnType<typeof vi.fn> } {
    return {
      requiredComponents,
      update: vi.fn()
    };
  }

  it("update() calls a registered system's update() with matching entities", () => {
    const world = new World();
    const entity = world.createEntity();
    entity.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });

    const system = createFakeSystem(["position"]);
    world.registerSystem(system);
    world.update(0.016);

    expect(system.update).toHaveBeenCalledWith([entity], 0.016);
  });

  it("update() skips calling a system entirely when no entities match its requirements", () => {
    const world = new World();
    world.createEntity(); // no components

    const system = createFakeSystem(["position"]);
    world.registerSystem(system);
    world.update(0.016);

    expect(system.update).not.toHaveBeenCalled();
  });

  it("update() gives each system only the entities matching its own requirements", () => {
    const world = new World();

    const mover = world.createEntity();
    mover.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });
    mover.addComponent<VelocityComponent>({ type: "velocity", dx: 1, dy: 0 });

    const staticEntity = world.createEntity();
    staticEntity.addComponent<PositionComponent>({ type: "position", x: 5, y: 5 });

    const movementSystem = createFakeSystem(["position", "velocity"]);
    const renderSystem = createFakeSystem(["position"]);
    world.registerSystem(movementSystem);
    world.registerSystem(renderSystem);

    world.update(0.016);

    expect(movementSystem.update).toHaveBeenCalledWith([mover], 0.016);
    expect(renderSystem.update).toHaveBeenCalledWith([mover, staticEntity], 0.016);
  });

  it("unregisterSystem() stops the system from being processed on future update() calls", () => {
    const world = new World();
    const entity = world.createEntity();
    entity.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });

    const system = createFakeSystem(["position"]);
    world.registerSystem(system);
    world.unregisterSystem(system);
    world.update(0.016);

    expect(system.update).not.toHaveBeenCalled();
  });

  it("unregisterSystem() does not throw for a system that was never registered", () => {
    const world = new World();
    const system = createFakeSystem(["position"]);

    expect(() => world.unregisterSystem(system)).not.toThrow();
  });

  it("does not throw when update() is called with no registered systems", () => {
    const world = new World();

    expect(() => world.update(0.016)).not.toThrow();
  });

  it("reflects entity destruction immediately in the next update() call", () => {
    const world = new World();
    const entity = world.createEntity();
    entity.addComponent<PositionComponent>({ type: "position", x: 0, y: 0 });

    const system = createFakeSystem(["position"]);
    world.registerSystem(system);

    world.destroyEntity(entity.id);
    world.update(0.016);

    expect(system.update).not.toHaveBeenCalled();
  });
});
