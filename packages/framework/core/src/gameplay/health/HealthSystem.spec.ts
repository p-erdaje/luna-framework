import { describe, expect, it, vi } from "vitest";
import { Entity } from "../../ecs/Entity";
import { EventBus } from "../../events/EventBus";
import type { HealthComponent } from "./HealthComponent";
import type { HealthChangedEvent, HealthDiedEvent, HealthRevivedEvent } from "./HealthEvents";
import { HealthSystem } from "./HealthSystem";

function createEntityWithHealth(current: number, max: number): Entity {
  const entity = new Entity("entity-0");
  entity.addComponent<HealthComponent>({ type: "health", current, max });
  return entity;
}

describe("HealthSystem — applyDamage", () => {
  it("reduces current health by the given amount", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(100, 100);

    health.applyDamage(entity, 30);

    expect(entity.getComponent<HealthComponent>("health")?.current).toBe(70);
  });

  it("clamps current health at 0, never going negative", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(10, 100);

    health.applyDamage(entity, 999);

    expect(entity.getComponent<HealthComponent>("health")?.current).toBe(0);
  });

  it("ignores zero or negative damage amounts", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(100, 100);

    health.applyDamage(entity, 0);
    health.applyDamage(entity, -10);

    expect(entity.getComponent<HealthComponent>("health")?.current).toBe(100);
  });

  it("does nothing to an entity with no HealthComponent", () => {
    const health = new HealthSystem();
    const entity = new Entity("entity-0");

    expect(() => health.applyDamage(entity, 10)).not.toThrow();
  });

  it("emits health:changed with a negative delta", () => {
    const eventBus = new EventBus();
    const health = new HealthSystem(eventBus);
    const entity = createEntityWithHealth(100, 100);
    const handler = vi.fn();

    eventBus.on<HealthChangedEvent>("health:changed", handler);
    health.applyDamage(entity, 30);

    expect(handler).toHaveBeenCalledWith({ entityId: "entity-0", current: 70, max: 100, delta: -30 });
  });

  it("emits health:died exactly once when health reaches exactly 0", () => {
    const eventBus = new EventBus();
    const health = new HealthSystem(eventBus);
    const entity = createEntityWithHealth(10, 100);
    const handler = vi.fn();

    eventBus.on<HealthDiedEvent>("health:died", handler);
    health.applyDamage(entity, 10);

    expect(handler).toHaveBeenCalledWith({ entityId: "entity-0" });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not re-emit health:died on further damage to an already-dead entity", () => {
    const eventBus = new EventBus();
    const health = new HealthSystem(eventBus);
    const entity = createEntityWithHealth(10, 100);
    const handler = vi.fn();

    health.applyDamage(entity, 10); // dies here
    eventBus.on<HealthDiedEvent>("health:died", handler);
    health.applyDamage(entity, 5); // already dead, current stays 0

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not throw when constructed without an EventBus", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(100, 100);

    expect(() => health.applyDamage(entity, 30)).not.toThrow();
  });
});

describe("HealthSystem — heal", () => {
  it("increases current health by the given amount", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(50, 100);

    health.heal(entity, 20);

    expect(entity.getComponent<HealthComponent>("health")?.current).toBe(70);
  });

  it("clamps current health at max, never exceeding it", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(90, 100);

    health.heal(entity, 999);

    expect(entity.getComponent<HealthComponent>("health")?.current).toBe(100);
  });

  it("ignores zero or negative heal amounts", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(50, 100);

    health.heal(entity, 0);
    health.heal(entity, -5);

    expect(entity.getComponent<HealthComponent>("health")?.current).toBe(50);
  });

  it("does nothing to a dead entity — revive() is required instead", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(0, 100);

    health.heal(entity, 50);

    expect(entity.getComponent<HealthComponent>("health")?.current).toBe(0);
  });

  it("emits health:changed with a positive delta", () => {
    const eventBus = new EventBus();
    const health = new HealthSystem(eventBus);
    const entity = createEntityWithHealth(50, 100);
    const handler = vi.fn();

    eventBus.on<HealthChangedEvent>("health:changed", handler);
    health.heal(entity, 20);

    expect(handler).toHaveBeenCalledWith({ entityId: "entity-0", current: 70, max: 100, delta: 20 });
  });

  it("does not emit health:changed when already at full health", () => {
    const eventBus = new EventBus();
    const health = new HealthSystem(eventBus);
    const entity = createEntityWithHealth(100, 100);
    const handler = vi.fn();

    eventBus.on<HealthChangedEvent>("health:changed", handler);
    health.heal(entity, 20);

    expect(handler).not.toHaveBeenCalled();
  });
});

describe("HealthSystem — revive", () => {
  it("restores a dead entity to full health by default", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(0, 100);

    health.revive(entity);

    expect(entity.getComponent<HealthComponent>("health")?.current).toBe(100);
  });

  it("restores a dead entity to a specific amount when given", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(0, 100);

    health.revive(entity, 25);

    expect(entity.getComponent<HealthComponent>("health")?.current).toBe(25);
  });

  it("clamps the revive amount to max", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(0, 100);

    health.revive(entity, 999);

    expect(entity.getComponent<HealthComponent>("health")?.current).toBe(100);
  });

  it("does nothing to an entity that is still alive", () => {
    const health = new HealthSystem();
    const entity = createEntityWithHealth(50, 100);

    health.revive(entity, 100);

    expect(entity.getComponent<HealthComponent>("health")?.current).toBe(50);
  });

  it("emits health:revived when a dead entity comes back", () => {
    const eventBus = new EventBus();
    const health = new HealthSystem(eventBus);
    const entity = createEntityWithHealth(0, 100);
    const handler = vi.fn();

    eventBus.on<HealthRevivedEvent>("health:revived", handler);
    health.revive(entity, 40);

    expect(handler).toHaveBeenCalledWith({ entityId: "entity-0", current: 40, max: 100 });
  });
});

describe("HealthSystem — queries", () => {
  it("isDead() is true only when current health is exactly 0", () => {
    const health = new HealthSystem();

    expect(health.isDead(createEntityWithHealth(0, 100))).toBe(true);
    expect(health.isDead(createEntityWithHealth(1, 100))).toBe(false);
  });

  it("isDead() is false for an entity with no HealthComponent", () => {
    const health = new HealthSystem();

    expect(health.isDead(new Entity("entity-0"))).toBe(false);
  });

  it("isFullHealth() is true only when current equals max", () => {
    const health = new HealthSystem();

    expect(health.isFullHealth(createEntityWithHealth(100, 100))).toBe(true);
    expect(health.isFullHealth(createEntityWithHealth(99, 100))).toBe(false);
  });

  it("getHealthPercentage() returns a 0-1 fraction of current over max", () => {
    const health = new HealthSystem();

    expect(health.getHealthPercentage(createEntityWithHealth(25, 100))).toBe(0.25);
    expect(health.getHealthPercentage(createEntityWithHealth(100, 100))).toBe(1);
  });

  it("getHealthPercentage() returns 0 for an entity with no HealthComponent", () => {
    const health = new HealthSystem();

    expect(health.getHealthPercentage(new Entity("entity-0"))).toBe(0);
  });
});
