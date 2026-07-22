import type { EventHandler, IEventBus } from "../../events/IEventBus";
import type { AchievementDefinition, AchievementState } from "./AchievementDefinition";
import type { AchievementProgressEvent, AchievementUnlockedEvent } from "./AchievementEvents";

const ACHIEVEMENT_PROGRESS_EVENT = "achievement:progress";
const ACHIEVEMENT_UNLOCKED_EVENT = "achievement:unlocked";

interface TrackedAchievement {
  readonly definition: AchievementDefinition;
  progress: number;
  unlocked: boolean;
  readonly handler?: EventHandler<unknown>;
}

/**
 * AchievementSystem
 *
 * Tracks progress toward player achievements and unlocks them once a
 * target count is reached. Unlike the ECS gameplay systems (Health,
 * Inventory, Combat), achievements aren't per-entity data — they're a
 * single, global service, so this class isn't Entity/Component based.
 *
 * Progress can advance two ways, and both can be used together:
 *  - Automatically: register() an achievement with a `criteria.event`
 *    and it advances by 1 every time that EventBus event fires.
 *  - Manually: call reportProgress() directly for anything that isn't
 *    naturally "count how many times X happened" (e.g. a threshold
 *    reached, like "reach level 10").
 *
 * @example
 * const achievements = new AchievementSystem(eventBus);
 * achievements.register({ id: "first-blood", targetCount: 1, criteria: { event: "combat:attackResolved" } });
 * achievements.register({ id: "survivor", targetCount: 1 }); // manual only
 * eventBus.on("player:leveledUp", (payload) => {
 *   if (payload.level >= 10) achievements.reportProgress("survivor");
 * });
 */
export class AchievementSystem {
  private readonly _eventBus: IEventBus;
  private readonly _achievements = new Map<string, TrackedAchievement>();

  public constructor(eventBus: IEventBus) {
    this._eventBus = eventBus;
  }

  /**
   * Register an achievement definition. If it has a `criteria.event`,
   * subscribes an internal EventBus listener that auto-advances
   * progress by 1 on each matching occurrence. Registering an id that
   * already exists replaces the old definition and resets its progress
   * — call restore() afterward to rehydrate saved progress instead.
   */
  public register(definition: AchievementDefinition): void {
    this.unregister(definition.id);

    let handler: EventHandler<unknown> | undefined;
    const event = definition.criteria?.event;
    if (event) {
      const filter = definition.criteria?.filter;
      handler = (payload) => {
        if (!filter || filter(payload)) {
          this.reportProgress(definition.id, 1);
        }
      };
      this._eventBus.on(event, handler);
    }

    this._achievements.set(definition.id, { definition, progress: 0, unlocked: false, handler });
  }

  /** Unsubscribe and forget an achievement. Safe to call for an id that was never registered. */
  public unregister(achievementId: string): void {
    const existing = this._achievements.get(achievementId);
    if (!existing) {
      return;
    }

    const event = existing.definition.criteria?.event;
    if (existing.handler && event) {
      this._eventBus.off(event, existing.handler);
    }

    this._achievements.delete(achievementId);
  }

  /**
   * Manually advance an achievement's progress by `amount` (default 1),
   * clamped to its targetCount. Emits "achievement:progress" on every
   * call, and "achievement:unlocked" exactly once, the moment progress
   * first reaches targetCount. No-ops for an unregistered id, a
   * non-positive amount, or an already-unlocked achievement.
   */
  public reportProgress(achievementId: string, amount = 1): void {
    const achievement = this._achievements.get(achievementId);
    if (!achievement || achievement.unlocked || amount <= 0) {
      return;
    }

    const target = achievement.definition.targetCount;
    achievement.progress = Math.min(target, achievement.progress + amount);

    this._eventBus.emit<AchievementProgressEvent>(ACHIEVEMENT_PROGRESS_EVENT, {
      achievementId,
      progress: achievement.progress,
      targetCount: target
    });

    if (achievement.progress >= target) {
      achievement.unlocked = true;
      this._eventBus.emit<AchievementUnlockedEvent>(ACHIEVEMENT_UNLOCKED_EVENT, { achievementId });
    }
  }

  /** Whether the achievement has reached its targetCount. False for an unregistered id. */
  public isUnlocked(achievementId: string): boolean {
    return this._achievements.get(achievementId)?.unlocked ?? false;
  }

  /** Current progress count. 0 for an unregistered id. */
  public getProgress(achievementId: string): number {
    return this._achievements.get(achievementId)?.progress ?? 0;
  }

  /** Snapshot of one achievement's progress/unlocked state, or undefined if it isn't registered. */
  public getState(achievementId: string): AchievementState | undefined {
    const achievement = this._achievements.get(achievementId);
    if (!achievement) {
      return undefined;
    }
    return { progress: achievement.progress, unlocked: achievement.unlocked };
  }

  /** Ids of every currently-unlocked achievement. */
  public getUnlockedIds(): readonly string[] {
    return Array.from(this._achievements.values())
      .filter((achievement) => achievement.unlocked)
      .map((achievement) => achievement.definition.id);
  }

  /** Snapshot of every registered achievement's state, keyed by id — pass the result to SaveManager.save() to persist it. */
  public serialize(): Record<string, AchievementState> {
    const snapshot: Record<string, AchievementState> = {};
    for (const [id, achievement] of this._achievements) {
      snapshot[id] = { progress: achievement.progress, unlocked: achievement.unlocked };
    }
    return snapshot;
  }

  /**
   * Rehydrate progress/unlocked state from a previous serialize()
   * snapshot (e.g. loaded via SaveManager.load()). Call this after
   * register()-ing every achievement definition for the session. Ids
   * in `state` that aren't currently registered are ignored.
   */
  public restore(state: Readonly<Record<string, AchievementState>>): void {
    for (const [id, savedState] of Object.entries(state)) {
      const achievement = this._achievements.get(id);
      if (!achievement) {
        continue;
      }
      achievement.progress = Math.min(achievement.definition.targetCount, savedState.progress);
      achievement.unlocked = savedState.unlocked;
    }
  }
}
