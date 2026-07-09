import type { AssetDescriptor } from "./AssetDescriptor";

/** Result of a completed load pass. */
export interface AssetLoadResult {
  readonly failedKeys: readonly string[];
}

/**
 * IAssetLoaderAdapter
 *
 * Minimal contract describing the loading operations
 * {@link AssetManager} needs. AssetManager depends on this interface
 * instead of Phaser's Loader Plugin directly (Adapter pattern), which
 * is what makes queueing, caching, and fallback logic unit-testable
 * with a fake adapter — no real Phaser instance or network required.
 */
export interface IAssetLoaderAdapter {
  /** Queue a single asset with the underlying loader. Does not start loading yet. */
  enqueue(descriptor: AssetDescriptor): void;

  /**
   * Start loading every queued asset. Resolves once every asset has
   * either finished or failed. `onProgress` is called as files complete,
   * with the running count and the total for this load pass.
   */
  start(onProgress?: (loaded: number, total: number) => void): Promise<AssetLoadResult>;

  /** True if an asset with this key is already loaded/cached by the underlying engine. */
  isLoaded(key: string): boolean;
}
