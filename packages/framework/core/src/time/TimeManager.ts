import type { ITimeManager } from "./ITimeManager";

const MS_PER_SECOND = 1000;
const DEFAULT_MAX_DELTA_MS = 100;
const DEFAULT_TIME_SCALE = 1;

/**
 * TimeManager
 *
 * Default framework implementation of {@link ITimeManager}. Tracks delta
 * time between explicit `update()` calls and clamps large gaps (e.g. a
 * backgrounded browser tab) so physics and movement don't jump when the
 * game regains focus.
 *
 * @example
 * const time = new TimeManager();
 *
 * function onFrame(now: number) {
 *   time.update(now);
 *   player.x += playerSpeed * time.deltaSeconds; // frame-independent movement
 *   requestAnimationFrame(onFrame);
 * }
 */
export class TimeManager implements ITimeManager {
  private readonly _maxDeltaMs: number;
  private _lastTimestampMs: number | null = null;
  private _deltaMs = 0;
  private _elapsedMs = 0;
  private _timeScale = DEFAULT_TIME_SCALE;
  private _timeScaleBeforePause = DEFAULT_TIME_SCALE;

  public constructor(maxDeltaMs: number = DEFAULT_MAX_DELTA_MS) {
    this._maxDeltaMs = maxDeltaMs;
  }

  public update(currentTimestampMs: number): void {
    if (this._lastTimestampMs === null) {
      // First frame: there's no previous timestamp to diff against yet.
      this._lastTimestampMs = currentTimestampMs;
      this._deltaMs = 0;
      return;
    }

    const rawDeltaMs = currentTimestampMs - this._lastTimestampMs;
    const clampedDeltaMs = Math.min(Math.max(rawDeltaMs, 0), this._maxDeltaMs);

    this._deltaMs = clampedDeltaMs * this._timeScale;
    this._elapsedMs += this._deltaMs;
    this._lastTimestampMs = currentTimestampMs;
  }

  public get deltaMs(): number {
    return this._deltaMs;
  }

  public get deltaSeconds(): number {
    return this._deltaMs / MS_PER_SECOND;
  }

  public get elapsedMs(): number {
    return this._elapsedMs;
  }

  public get fps(): number {
    return this._deltaMs > 0 ? MS_PER_SECOND / this._deltaMs : 0;
  }

  public get timeScale(): number {
    return this._timeScale;
  }

  public set timeScale(value: number) {
    this._timeScale = value;
  }

  public get isPaused(): boolean {
    return this._timeScale === 0;
  }

  public pause(): void {
    if (this.isPaused) {
      return;
    }
    this._timeScaleBeforePause = this._timeScale;
    this._timeScale = 0;
  }

  public resume(): void {
    this._timeScale = this._timeScaleBeforePause;
  }

  public reset(): void {
    this._lastTimestampMs = null;
    this._deltaMs = 0;
    this._elapsedMs = 0;
    this._timeScale = DEFAULT_TIME_SCALE;
    this._timeScaleBeforePause = DEFAULT_TIME_SCALE;
  }
}
