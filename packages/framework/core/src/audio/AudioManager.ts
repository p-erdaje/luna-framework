import type { IAudioManager } from "./IAudioManager";
import type { IAudioSourceAdapter, PlayOptions } from "./IAudioSourceAdapter";

const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
const DEFAULT_VOLUME = 1;

interface ActiveInstance {
  readonly category: string;
  readonly instanceVolume: number;
}

function clampVolume(volume: number): number {
  return Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, volume));
}

/**
 * AudioManager
 *
 * Default framework implementation of {@link IAudioManager}. Delegates
 * actual sound playback to an injected {@link IAudioSourceAdapter}
 * (Dependency Injection) and layers category volumes, master volume,
 * and mute on top — none of which touches a real audio engine, so it's
 * fully unit testable with a fake adapter (see AudioManager.spec.ts).
 *
 * Effective volume for any playing instance is always:
 * masterVolume * categoryVolume * instanceVolume — or 0 while muted.
 */
export class AudioManager implements IAudioManager {
  private readonly _adapter: IAudioSourceAdapter;
  private readonly _activeInstances = new Map<string, ActiveInstance>();
  private readonly _categoryVolumes = new Map<string, number>();
  private _masterVolume: number = DEFAULT_VOLUME;
  private _isMuted = false;

  public constructor(adapter: IAudioSourceAdapter) {
    this._adapter = adapter;
  }

  public play(key: string, category: string, options?: PlayOptions): string {
    const instanceVolume = clampVolume(options?.volume ?? DEFAULT_VOLUME);

    const instanceId = this._adapter.play(key, {
      ...options,
      volume: this._computeEffectiveVolume(category, instanceVolume)
    });

    this._activeInstances.set(instanceId, { category, instanceVolume });
    return instanceId;
  }

  public stop(instanceId: string): void {
    this._adapter.stop(instanceId);
    this._activeInstances.delete(instanceId);
  }

  public stopCategory(category: string): void {
    for (const [instanceId, instance] of this._activeInstances) {
      if (instance.category === category) {
        this._adapter.stop(instanceId);
        this._activeInstances.delete(instanceId);
      }
    }
  }

  public stopAll(): void {
    this._adapter.stopAll();
    this._activeInstances.clear();
  }

  public setMasterVolume(volume: number): void {
    this._masterVolume = clampVolume(volume);
    this._refreshAllInstanceVolumes();
  }

  public getMasterVolume(): number {
    return this._masterVolume;
  }

  public setCategoryVolume(category: string, volume: number): void {
    this._categoryVolumes.set(category, clampVolume(volume));
    this._refreshInstanceVolumesForCategory(category);
  }

  public getCategoryVolume(category: string): number {
    return this._categoryVolumes.get(category) ?? DEFAULT_VOLUME;
  }

  public mute(): void {
    this._isMuted = true;
    this._refreshAllInstanceVolumes();
  }

  public unmute(): void {
    this._isMuted = false;
    this._refreshAllInstanceVolumes();
  }

  public isMuted(): boolean {
    return this._isMuted;
  }

  private _computeEffectiveVolume(category: string, instanceVolume: number): number {
    if (this._isMuted) {
      return MIN_VOLUME;
    }
    const categoryVolume = this.getCategoryVolume(category);
    return this._masterVolume * categoryVolume * instanceVolume;
  }

  private _refreshAllInstanceVolumes(): void {
    for (const [instanceId, instance] of this._activeInstances) {
      const effectiveVolume = this._computeEffectiveVolume(instance.category, instance.instanceVolume);
      this._adapter.setInstanceVolume(instanceId, effectiveVolume);
    }
  }

  private _refreshInstanceVolumesForCategory(category: string): void {
    for (const [instanceId, instance] of this._activeInstances) {
      if (instance.category === category) {
        const effectiveVolume = this._computeEffectiveVolume(category, instance.instanceVolume);
        this._adapter.setInstanceVolume(instanceId, effectiveVolume);
      }
    }
  }
}
