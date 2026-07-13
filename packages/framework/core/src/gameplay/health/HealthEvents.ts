/** Emitted whenever an entity's health value actually changes (damage or heal). */
export interface HealthChangedEvent {
  readonly entityId: string;
  readonly current: number;
  readonly max: number;
  /** Positive for healing, negative for damage. */
  readonly delta: number;
}

/** Emitted once, the moment an entity's health transitions from above 0 to exactly 0. */
export interface HealthDiedEvent {
  readonly entityId: string;
}

/** Emitted when a dead entity (0 health) is revived via HealthSystem.revive(). */
export interface HealthRevivedEvent {
  readonly entityId: string;
  readonly current: number;
  readonly max: number;
}
