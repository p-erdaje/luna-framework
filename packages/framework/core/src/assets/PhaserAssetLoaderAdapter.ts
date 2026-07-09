import Phaser from "phaser";
import type { AssetDescriptor } from "./AssetDescriptor";
import type { AssetLoadResult, IAssetLoaderAdapter } from "./IAssetLoaderAdapter";

/**
 * PhaserAssetLoaderAdapter
 *
 * The only place in the framework that talks to Phaser's Loader Plugin
 * and cache/texture managers directly. Pure delegation, no business
 * logic — intentionally excluded from unit test coverage requirements
 * (see docs/CONTRIBUTING.md -> Testing Strategy). AssetManager's actual
 * queueing/fallback logic is verified in AssetManager.spec.ts using a
 * fake adapter instead.
 */
export class PhaserAssetLoaderAdapter implements IAssetLoaderAdapter {
  private readonly _scene: Phaser.Scene;

  public constructor(scene: Phaser.Scene) {
    this._scene = scene;
  }

  public enqueue(descriptor: AssetDescriptor): void {
    switch (descriptor.type) {
      case "image":
        this._scene.load.image(descriptor.key, descriptor.url);
        break;
      case "audio":
        this._scene.load.audio(descriptor.key, descriptor.url);
        break;
      case "json":
        this._scene.load.json(descriptor.key, descriptor.url);
        break;
      case "atlas":
        this._scene.load.atlas(descriptor.key, descriptor.url, descriptor.atlasDataUrl);
        break;
    }
  }

  public start(onProgress?: (loaded: number, total: number) => void): Promise<AssetLoadResult> {
    return new Promise((resolve) => {
      const failedKeys: string[] = [];
      const totalFiles = this._scene.load.totalToLoad;

      const handleFileError = (file: Phaser.Loader.File): void => {
        failedKeys.push(file.key);
      };
      const handleProgress = (): void => {
        onProgress?.(this._scene.load.totalComplete, totalFiles);
      };
      const handleComplete = (): void => {
        this._scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, handleFileError);
        this._scene.load.off(Phaser.Loader.Events.FILE_PROGRESS, handleProgress);
        this._scene.load.off(Phaser.Loader.Events.COMPLETE, handleComplete);
        resolve({ failedKeys });
      };

      this._scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, handleFileError);
      this._scene.load.on(Phaser.Loader.Events.FILE_PROGRESS, handleProgress);
      this._scene.load.on(Phaser.Loader.Events.COMPLETE, handleComplete);

      this._scene.load.start();
    });
  }

  public isLoaded(key: string): boolean {
    return (
      this._scene.textures.exists(key) ||
      this._scene.cache.audio.exists(key) ||
      this._scene.cache.json.exists(key)
    );
  }
}
