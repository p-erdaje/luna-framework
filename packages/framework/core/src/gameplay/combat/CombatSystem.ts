import type { Entity } from "../../ecs/Entity";
import type { IEventBus } from "../../events/IEventBus";
import type { HealthSystem } from "../health/HealthSystem";
import type { AttackComponent } from "./AttackComponent";
import type { AttackOnCooldownEvent, AttackResolvedEvent } from "./CombatEvents";
import type { DefenseComponent } from "./DefenseComponent";

const ATTACK_COMPONENT_TYPE = "attack";
const DEFENSE_COMPONENT_TYPE = "defense";
const ATTACK_RESOLVED_EVENT = "combat:attackResolved";
const ATTACK_ON_COOLDOWN_EVENT = "combat:onCooldown";

const MIN_DAMAGE = 1;
const DEFAULT_ARMOR = 0;
const DEFAULT_CRIT_CHANCE = 0;
const DEFAULT_CRIT_MULTIPLIER = 2;

/** Options for a single attack() call. */
export interface AttackOptions {
  /** Source of randomness for the crit roll, 0-1. Defaults to Math.random — inject a fake for deterministic tests. */
  readonly randomFn?: () => number;
}

/** Outcome of a single attack() call. */
export interface AttackResult {
  /** False if the attacker had no AttackComponent or was still on cooldown — nothing happened. */
  readonly success: boolean;
  readonly damage: number;
  readonly isCritical: boolean;
}

/**
 * CombatSystem
 *
 * Resolves attacks between entities: checks the attacker's cooldown,
 * computes damage against the target's armor (if any), rolls for a
 * critical hit, and delegates the actual health mutation to an
 * injected {@link HealthSystem} rather than duplicating that logic
 * (Single Responsibility — see docs/ARCHITECTURE.md).
 *
 * Like {@link ITimeManager}, the current time is passed in explicitly
 * rather than read from Date.now() internally, so cooldown logic is
 * fully unit testable with fake timestamps (see CombatSystem.spec.ts).
 */
export class CombatSystem {
  private readonly _healthSystem: HealthSystem;
  private readonly _eventBus?: IEventBus;

  public constructor(healthSystem: HealthSystem, eventBus?: IEventBus) {
    this._healthSystem = healthSystem;
    this._eventBus = eventBus;
  }

  /**
   * Resolve an attack from `attacker` against `target` at `currentTimeMs`.
   * No-ops (returns success: false) if the attacker has no
   * AttackComponent or is still on cooldown. On success, sets the
   * attacker's next-ready timestamp and applies damage via HealthSystem.
   */
  public attack(
    attacker: Entity,
    target: Entity,
    currentTimeMs: number,
    options?: AttackOptions
  ): AttackResult {
    const attack = attacker.getComponent<AttackComponent>(ATTACK_COMPONENT_TYPE);
    if (!attack) {
      return { success: false, damage: 0, isCritical: false };
    }

    if (currentTimeMs < attack.readyAt) {
      this._eventBus?.emit<AttackOnCooldownEvent>(ATTACK_ON_COOLDOWN_EVENT, {
        attackerId: attacker.id,
        targetId: target.id,
        remainingCooldownMs: attack.readyAt - currentTimeMs
      });
      return { success: false, damage: 0, isCritical: false };
    }

    const armor = target.getComponent<DefenseComponent>(DEFENSE_COMPONENT_TYPE)?.armor ?? DEFAULT_ARMOR;
    const randomFn = options?.randomFn ?? Math.random;
    const critChance = attack.critChance ?? DEFAULT_CRIT_CHANCE;
    const isCritical = randomFn() < critChance;
    const critMultiplier = attack.critMultiplier ?? DEFAULT_CRIT_MULTIPLIER;

    const baseDamage = Math.max(MIN_DAMAGE, attack.power - armor);
    const damage = isCritical ? Math.round(baseDamage * critMultiplier) : baseDamage;

    attack.readyAt = currentTimeMs + attack.cooldownMs;
    this._healthSystem.applyDamage(target, damage);

    this._eventBus?.emit<AttackResolvedEvent>(ATTACK_RESOLVED_EVENT, {
      attackerId: attacker.id,
      targetId: target.id,
      damage,
      isCritical
    });

    return { success: true, damage, isCritical };
  }

  /** Whether the entity is currently on cooldown and can't attack yet. False for an entity with no AttackComponent. */
  public isOnCooldown(entity: Entity, currentTimeMs: number): boolean {
    const attack = entity.getComponent<AttackComponent>(ATTACK_COMPONENT_TYPE);
    return attack !== undefined && currentTimeMs < attack.readyAt;
  }

  /** Milliseconds remaining until the entity can attack again. 0 if already ready or the entity has no AttackComponent. */
  public getCooldownRemaining(entity: Entity, currentTimeMs: number): number {
    const attack = entity.getComponent<AttackComponent>(ATTACK_COMPONENT_TYPE);
    if (!attack) {
      return 0;
    }
    return Math.max(0, attack.readyAt - currentTimeMs);
  }
}
