import type { PlayOptions } from "./IAudioSourceAdapter";

/**
 * IAudioManager
 *
 * Framework-level audio API with category-based volume control (e.g.
 * "music" vs "sfx" — see Dev_Plan.txt production stack: Audacity /
 * Bfxr). Effective playback volume is always
 * masterVolume * categoryVolume * instanceVolume, or 0 while muted.
 */
export interface IAudioManager {
  /** Play a loaded audio asset under a volume category. Returns an instance id for stop()/volume changes. */
  play(key: string, category: string, options?: PlayOptions): string;

  /** Stop a specific playing instance. */
  stop(instanceId: string): void;

  /** Stop every currently playing instance in a category (e.g. stop all "music" without touching "sfx"). */
  stopCategory(category: string): void;

  /** Stop every currently playing instance across every category. */
  stopAll(): void;

  /** Set the master volume (0-1), affecting every category. */
  setMasterVolume(volume: number): void;

  /** Current master volume (0-1). */
  getMasterVolume(): number;

  /** Set the volume (0-1) for a specific category. Categories default to 1 until set. */
  setCategoryVolume(category: string, volume: number): void;

  /** Current volume (0-1) for a category. */
  getCategoryVolume(category: string): number;

  /** Mute all audio without changing any volume setting. */
  mute(): void;

  /** Unmute, restoring playback at the previously configured volumes. */
  unmute(): void;

  /** Whether audio is currently muted. */
  isMuted(): boolean;
}
