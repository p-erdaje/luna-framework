/** Optional automatic trigger: advances progress by 1 each time this EventBus event fires. */
export interface AchievementCriteria {
  /** EventBus event name that auto-advances progress. Omit to drive progress purely via reportProgress(). */
  readonly event?: string;
  /** Only count an occurrence of `event` when this returns true. Ignored if `event` is omitted. */
  readonly filter?: (payload: unknown) => boolean;
}

/** Describes a single achievement: its id, how much progress unlocks it, and (optionally) what auto-advances it. */
export interface AchievementDefinition {
  readonly id: string;
  readonly targetCount: number;
  readonly criteria?: AchievementCriteria;
}

/** Current progress/unlock state for one achievement — the shape returned by getState() and used by serialize()/restore(). */
export interface AchievementState {
  readonly progress: number;
  readonly unlocked: boolean;
}
