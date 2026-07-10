import type Phaser from "phaser";
import type { IAudioSourceAdapter, PlayOptions } from "./IAudioSourceAdapter";

/**
 * PhaserAudioAdapter
 *
 * The only place in the framework that calls into Phaser's Sound
 * Manager. Phaser doesn't hand back a simple string id for a playing
 * sound, so this adapter generates one and keeps an internal map back
 * to the real Phaser sound object — pure plumbing, no volume or
 * category logic, which all lives in AudioManager instead. Intentionally
 * excluded from unit test coverage requirements (see docs/CONTRIBUTING.md
 * -> Testing Strategy); AudioManager's actual logic is verified in
 * AudioManager.spec.ts using a fake adapter.
 */
export class PhaserAudioAdapter implements IAudioSourceAdapter {
  private readonly _soundManager: Phaser.Sound.BaseSoundManager;
  private readonly _instances = new Map<string, Phaser.Sound.BaseSound>();
  private _nextInstanceId = 0;

  public constructor(soundManager: Phaser.Sound.BaseSoundManager) {
    this._soundManager = soundManager;
  }

  public play(key: string, options?: PlayOptions): string {
    const sound = this._soundManager.add(key, {
      loop: options?.loop ?? false,
      volume: options?.volume
    });
    sound.play();

    const instanceId = `sound-${this._nextInstanceId}`;
    this._nextInstanceId += 1;
    this._instances.set(instanceId, sound);

    return instanceId;
  }

  public stop(instanceId: string): void {
    const sound = this._instances.get(instanceId);
    if (!sound) {
      return;
    }
    sound.stop();
    sound.destroy();
    this._instances.delete(instanceId);
  }

  public stopAll(): void {
    for (const sound of this._instances.values()) {
      sound.stop();
      sound.destroy();
    }
    this._instances.clear();
  }

  public setInstanceVolume(instanceId: string, volume: number): void {
    const sound = this._instances.get(instanceId);
    if (sound && "setVolume" in sound && typeof sound.setVolume === "function") {
      sound.setVolume(volume);
    }
  }
}
