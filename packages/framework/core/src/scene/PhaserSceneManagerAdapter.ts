import type Phaser from "phaser";
import type { IPhaserSceneManagerAdapter } from "./IPhaserSceneManagerAdapter";

/**
 * PhaserSceneManagerAdapter
 *
 * The only place in the framework that actually calls into Phaser's
 * scene plugin. Every method is a direct pass-through — no business
 * logic lives here, so it's intentionally excluded from unit test
 * coverage requirements (see docs/CONTRIBUTING.md -> Testing Strategy).
 * SceneManager's actual navigation logic is verified in
 * SceneManager.spec.ts using a fake adapter instead.
 */
export class PhaserSceneManagerAdapter implements IPhaserSceneManagerAdapter {
  private readonly _scenePlugin: Phaser.Scenes.ScenePlugin;

  public constructor(scenePlugin: Phaser.Scenes.ScenePlugin) {
    this._scenePlugin = scenePlugin;
  }

  public start(key: string, data?: Record<string, unknown>): void {
    this._scenePlugin.start(key, data);
  }

  public stop(key: string): void {
    this._scenePlugin.stop(key);
  }

  public pause(key: string): void {
    this._scenePlugin.pause(key);
  }

  public resume(key: string): void {
    this._scenePlugin.resume(key);
  }

  public sleep(key: string): void {
    this._scenePlugin.sleep(key);
  }

  public wake(key: string): void {
    this._scenePlugin.wake(key);
  }

  public isActive(key: string): boolean {
    return this._scenePlugin.isActive(key);
  }

  public isSleeping(key: string): boolean {
    return this._scenePlugin.isSleeping(key);
  }
}
