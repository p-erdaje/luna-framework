/** Emitted whenever an attack successfully lands (attacker was off cooldown). */
export interface AttackResolvedEvent {
  readonly attackerId: string;
  readonly targetId: string;
  readonly damage: number;
  readonly isCritical: boolean;
}

/** Emitted when attack() is called but the attacker is still on cooldown. */
export interface AttackOnCooldownEvent {
  readonly attackerId: string;
  readonly targetId: string;
  /** How much longer (ms) until the attacker is ready again. */
  readonly remainingCooldownMs: number;
}
