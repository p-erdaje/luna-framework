/** Emitted every time an achievement's progress advances (including the call that unlocks it). */
export interface AchievementProgressEvent {
  readonly achievementId: string;
  readonly progress: number;
  readonly targetCount: number;
}

/** Emitted exactly once, the moment an achievement's progress first reaches its targetCount. */
export interface AchievementUnlockedEvent {
  readonly achievementId: string;
}
