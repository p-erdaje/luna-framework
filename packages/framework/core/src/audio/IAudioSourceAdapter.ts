/** Options for a single play() call. */
export interface PlayOptions {
  readonly loop?: boolean;
  /** Volume for this instance specifically, 0-1. Combined with category and master volume by AudioManager, not the adapter. */
  readonly volume?: number;
}

/**
 * IAudioSourceAdapter
 *
 * Minimal contract describing the actual sound-playback operations
 * {@link AudioManager} needs. AudioManager depends on this interface
 * instead of Phaser's Sound Manager directly (Adapter pattern), so its
 * volume/category/mute logic is unit-testable with a fake adapter, with
 * no real audio engine or browser involved.
 */
export interface IAudioSourceAdapter {
  /** Start playing a loaded audio asset by key. Returns an instance id used to stop/adjust that specific playback later. */
  play(key: string, options?: PlayOptions): string;

  /** Stop a specific playing instance by the id returned from play(). */
  stop(instanceId: string): void;

  /** Stop every currently playing instance. */
  stopAll(): void;

  /** Set the volume (0-1) of a specific playing instance. */
  setInstanceVolume(instanceId: string, volume: number): void;
}
