/**
 * IPhaserSceneManagerAdapter
 *
 * Minimal contract describing the Phaser scene operations that
 * {@link SceneManager} needs. SceneManager depends on this interface
 * instead of Phaser directly (Adapter pattern) — that's what makes it
 * possible to unit test scene navigation logic with a fake adapter,
 * with no real Phaser instance or browser involved.
 *
 * The real implementation (PhaserSceneManagerAdapter) is a thin wrapper
 * around Phaser's own Scene Plugin.
 */
export interface IPhaserSceneManagerAdapter {
  start(key: string, data?: Record<string, unknown>): void;
  stop(key: string): void;
  pause(key: string): void;
  resume(key: string): void;
  sleep(key: string): void;
  wake(key: string): void;
  isActive(key: string): boolean;
  isSleeping(key: string): boolean;
}
