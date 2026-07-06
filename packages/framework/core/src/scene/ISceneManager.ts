/** Payload emitted on the EventBus whenever the active scene changes. */
export interface SceneChangedEvent {
  readonly from: string | null;
  readonly to: string | null;
}

/**
 * ISceneManager
 *
 * Framework-level scene navigation API. Internally backed by a stack
 * (see docs/ARCHITECTURE.md -> Data Structure Strategy: Stack -> Scene
 * navigation), so "push" and "pop" behave like opening/closing a menu
 * over gameplay, while "goto" fully replaces whatever was active.
 */
export interface ISceneManager {
  /**
   * Fully switch to a scene: stop every scene currently on the stack and
   * start the new one as the only scene. Use this for major transitions
   * (e.g. MainMenu -> Gameplay).
   */
  goto(key: string, data?: Record<string, unknown>): void;

  /**
   * Pause the current top scene (if any) and start a new scene on top of
   * it. Use this for overlays that should return to what was beneath
   * them (e.g. opening a pause menu over Gameplay).
   */
  push(key: string, data?: Record<string, unknown>): void;

  /**
   * Stop the current top scene and resume the scene beneath it.
   * No-op if the stack has 0 or 1 scenes — there's nothing to pop to.
   */
  pop(): void;

  /**
   * Stop the current top scene and start a new one in its place, at the
   * same stack depth, without resuming or pausing anything beneath it.
   * Use this for lateral transitions (e.g. Level1 -> Level2).
   */
  replace(key: string, data?: Record<string, unknown>): void;

  /** Key of the scene currently on top of the stack, or null if the stack is empty. */
  getCurrentSceneKey(): string | null;

  /** Read-only snapshot of the full scene stack, bottom to top. */
  getStack(): readonly string[];
}
