/**
 * ITimeManager
 *
 * Contract for tracking delta time between frames, enabling
 * frame-independent movement (see docs/ARCHITECTURE.md -> Performance
 * Strategy -> Delta Time).
 *
 * `update()` takes an explicit timestamp rather than reading the clock
 * itself, so the manager stays framework-agnostic and fully testable
 * with fake timestamps (see Testable Core Logic in the Dev Plan).
 */
export interface ITimeManager {
  /**
   * Advance the clock. Call once per frame with a monotonically
   * increasing timestamp in milliseconds (e.g. `performance.now()` or
   * Phaser's own frame timestamp).
   */
  update(currentTimestampMs: number): void;

  /** Time since the previous update(), in milliseconds, scaled by timeScale and clamped to avoid large spikes. */
  readonly deltaMs: number;

  /** Same as deltaMs, expressed in seconds. Multiply velocities by this for frame-independent movement. */
  readonly deltaSeconds: number;

  /** Total accumulated time since construction (or the last reset()), in milliseconds. */
  readonly elapsedMs: number;

  /** Frames per second, estimated from the current delta. */
  readonly fps: number;

  /** Multiplier applied to delta time. 1 = normal speed, 0.5 = slow motion, 0 = fully paused. */
  timeScale: number;

  /** Whether timeScale is currently 0. */
  readonly isPaused: boolean;

  /** Set timeScale to 0, remembering the previous value for resume(). */
  pause(): void;

  /** Restore timeScale to the value it had before pause() was called. */
  resume(): void;

  /** Reset all internal state (delta, elapsed, timeScale) back to initial values. */
  reset(): void;
}
