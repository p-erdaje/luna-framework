import type { AssetDescriptor } from "./AssetDescriptor";
import type { AssetLoadResult } from "./IAssetLoaderAdapter";

/** Emitted on the EventBus as queued assets finish loading, one per completed file. */
export interface AssetLoadProgressEvent {
  readonly loaded: number;
  readonly total: number;
}

/** Emitted on the EventBus once a load() pass finishes, successfully or not. */
export interface AssetLoadCompleteEvent {
  readonly failedKeys: readonly string[];
}

/**
 * IAssetManager
 *
 * Framework-level asset loading API. Queues assets, loads them in a
 * batch, tracks which keys are cached already (to avoid redundant
 * loads — see docs/ARCHITECTURE.md -> Optimization: Asset Caching), and
 * supports fallback assets for keys that fail to load (see
 * docs/DEV_PLAN.md -> Error Handling Strategy: Asset Error -> Fallback Asset).
 */
export interface IAssetManager {
  /** Queue a single asset. Ignored if the key is already queued or already loaded. */
  queue(descriptor: AssetDescriptor): void;

  /** Queue multiple assets at once. */
  queueMany(descriptors: AssetDescriptor[]): void;

  /** Load every currently queued asset, then clear the queue. */
  load(): Promise<AssetLoadResult>;

  /** Check whether an asset with this key is already loaded. */
  isLoaded(key: string): boolean;

  /** Register a fallback key to use when `key` fails to load. */
  registerFallback(key: string, fallbackKey: string): void;

  /**
   * Resolve the key that should actually be used right now: `key` itself
   * if it's loaded, its registered fallback if `key` isn't loaded but the
   * fallback is, or `key` unchanged if neither is available (letting the
   * engine handle the missing asset itself).
   */
  resolveKey(key: string): string;
}
