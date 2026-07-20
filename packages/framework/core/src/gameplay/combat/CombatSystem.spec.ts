import { describe, expect, it, vi } from "vitest";
import { Entity } from "../../ecs/Entity";
import { EventBus } from "../../events/EventBus";
import type { HealthComponent } from "../health/HealthComponent";
import { HealthSystem } from "../health/HealthSystem";
import type { AttackComponent } from "./AttackComponent";
import type { AttackOnCooldownEvent, AttackResolvedEvent } from "./CombatEvents";
import { CombatSystem } from "./CombatSystem";
import type { DefenseComponent } from "./DefenseComponent";

function createAttacker(power: number, cooldownMs: number, extra: Partial<AttackComponent> = {}): Entity {
  const entity = new Entity("attacker");
  entity.addComponent<AttackComponent>({
    type: "attack",
    power,
    cooldownMs,
    readyAt: 0,
    ...extra
  });
  return entity;
}

function createTarget(current: number, max: number, armor?: number): Entity {
  const entity = new Entity("target");
  entity.addComponent<HealthComponent>({ type: "health", current, max });
  if (armor !== undefined) {
    entity.addComponent<DefenseComponent>({ type: "defense", armor });
  }
  return entity;
}

describe("CombatSystem — attack", () => {
  it("applies the attacker's power as damage to the target's real HealthSystem-backed health", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(20, 1000);
    const target = createTarget(100, 100);

    combat.attack(attacker, target, 0);

    expect(target.getComponent<HealthComponent>("health")?.current).toBe(80);
  });

  it("reduces damage by the target's armor", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(20, 1000);
    const target = createTarget(100, 100, 5);

    combat.attack(attacker, target, 0);

    expect(target.getComponent<HealthComponent>("health")?.current).toBe(85);
  });

  it("always deals at least 1 damage, even when armor exceeds power", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(10, 1000);
    const target = createTarget(100, 100, 999);

    combat.attack(attacker, target, 0);

    expect(target.getComponent<HealthComponent>("health")?.current).toBe(99);
  });

  it("treats a target with no DefenseComponent as having zero armor", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(15, 1000);
    const target = createTarget(100, 100);

    const result = combat.attack(attacker, target, 0);

    expect(result.damage).toBe(15);
  });

  it("fails when the attacker has no AttackComponent", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = new Entity("attacker");
    const target = createTarget(100, 100);

    const result = combat.attack(attacker, target, 0);

    expect(result).toEqual({ success: false, damage: 0, isCritical: false });
    expect(target.getComponent<HealthComponent>("health")?.current).toBe(100);
  });

  it("fails and deals no damage while the attacker is still on cooldown", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(20, 5000);
    const target = createTarget(100, 100);

    combat.attack(attacker, target, 0); // first attack, sets readyAt = 5000
    const result = combat.attack(attacker, target, 1000); // too soon

    expect(result.success).toBe(false);
    expect(target.getComponent<HealthComponent>("health")?.current).toBe(80); // only first hit landed
  });

  it("succeeds again once the cooldown has fully elapsed", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(20, 5000);
    const target = createTarget(100, 100);

    combat.attack(attacker, target, 0);
    const result = combat.attack(attacker, target, 5000);

    expect(result.success).toBe(true);
    expect(target.getComponent<HealthComponent>("health")?.current).toBe(60);
  });

  it("sets readyAt to currentTimeMs + cooldownMs after a successful attack", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(20, 3000);
    const target = createTarget(100, 100);

    combat.attack(attacker, target, 1000);

    expect(attacker.getComponent<AttackComponent>("attack")?.readyAt).toBe(4000);
  });

  it("rolls a critical hit when randomFn is below critChance, multiplying damage", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(10, 1000, { critChance: 0.5, critMultiplier: 3 });
    const target = createTarget(100, 100);

    const result = combat.attack(attacker, target, 0, { randomFn: () => 0.1 });

    expect(result.isCritical).toBe(true);
    expect(result.damage).toBe(30);
  });

  it("does not crit when randomFn is at or above critChance", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(10, 1000, { critChance: 0.5, critMultiplier: 3 });
    const target = createTarget(100, 100);

    const result = combat.attack(attacker, target, 0, { randomFn: () => 0.5 });

    expect(result.isCritical).toBe(false);
    expect(result.damage).toBe(10);
  });

  it("defaults critMultiplier to 2 when critChance is set but critMultiplier is omitted", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(10, 1000, { critChance: 1 });
    const target = createTarget(100, 100);

    const result = combat.attack(attacker, target, 0, { randomFn: () => 0 });

    expect(result.isCritical).toBe(true);
    expect(result.damage).toBe(20);
  });

  it("never crits when critChance is omitted, regardless of randomFn", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(10, 1000);
    const target = createTarget(100, 100);

    const result = combat.attack(attacker, target, 0, { randomFn: () => 0 });

    expect(result.isCritical).toBe(false);
  });

  it("emits combat:attackResolved with the correct payload on success", () => {
    const eventBus = new EventBus();
    const combat = new CombatSystem(new HealthSystem(), eventBus);
    const attacker = createAttacker(20, 1000);
    const target = createTarget(100, 100);
    const handler = vi.fn();

    eventBus.on<AttackResolvedEvent>("combat:attackResolved", handler);
    combat.attack(attacker, target, 0);

    expect(handler).toHaveBeenCalledWith({
      attackerId: "attacker",
      targetId: "target",
      damage: 20,
      isCritical: false
    });
  });

  it("emits combat:onCooldown instead of combat:attackResolved while on cooldown", () => {
    const eventBus = new EventBus();
    const combat = new CombatSystem(new HealthSystem(), eventBus);
    const attacker = createAttacker(20, 5000);
    const target = createTarget(100, 100);
    const resolvedHandler = vi.fn();
    const cooldownHandler = vi.fn();

    combat.attack(attacker, target, 0);
    eventBus.on<AttackResolvedEvent>("combat:attackResolved", resolvedHandler);
    eventBus.on<AttackOnCooldownEvent>("combat:onCooldown", cooldownHandler);
    combat.attack(attacker, target, 2000);

    expect(resolvedHandler).not.toHaveBeenCalled();
    expect(cooldownHandler).toHaveBeenCalledWith({
      attackerId: "attacker",
      targetId: "target",
      remainingCooldownMs: 3000
    });
  });

  it("does not throw when constructed without an EventBus", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(10, 1000);
    const target = createTarget(100, 100);

    expect(() => combat.attack(attacker, target, 0)).not.toThrow();
  });
});

describe("CombatSystem — queries", () => {
  it("isOnCooldown() is true immediately after an attack, before the cooldown elapses", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(10, 5000);
    const target = createTarget(100, 100);

    combat.attack(attacker, target, 0);

    expect(combat.isOnCooldown(attacker, 1000)).toBe(true);
  });

  it("isOnCooldown() is false once the cooldown has elapsed", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(10, 5000);
    const target = createTarget(100, 100);

    combat.attack(attacker, target, 0);

    expect(combat.isOnCooldown(attacker, 5000)).toBe(false);
  });

  it("isOnCooldown() is false for an entity with no AttackComponent", () => {
    const combat = new CombatSystem(new HealthSystem());
    const entity = new Entity("entity-0");

    expect(combat.isOnCooldown(entity, 0)).toBe(false);
  });

  it("getCooldownRemaining() returns the exact milliseconds left", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(10, 5000);
    const target = createTarget(100, 100);

    combat.attack(attacker, target, 0);

    expect(combat.getCooldownRemaining(attacker, 3000)).toBe(2000);
  });

  it("getCooldownRemaining() returns 0 once ready", () => {
    const combat = new CombatSystem(new HealthSystem());
    const attacker = createAttacker(10, 5000);
    const target = createTarget(100, 100);

    combat.attack(attacker, target, 0);

    expect(combat.getCooldownRemaining(attacker, 9000)).toBe(0);
  });

  it("getCooldownRemaining() returns 0 for an entity with no AttackComponent", () => {
    const combat = new CombatSystem(new HealthSystem());
    const entity = new Entity("entity-0");

    expect(combat.getCooldownRemaining(entity, 0)).toBe(0);
  });
});
