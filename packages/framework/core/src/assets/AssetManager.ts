import type { IEventBus } from "../events/IEventBus";
import type { AssetDescriptor } from "./AssetDescriptor";
import type { IAssetLoaderAdapter, AssetLoadResult } from "./IAssetLoaderAdapter";
import type { IAssetManager, AssetLoadCompleteEvent, AssetLoadProgressEvent } from "./IAssetManager";

const ASSET_PROGRESS_EVENT = "asset:progress";
const ASSET_LOAD_COMPLETE_EVENT = "asset:loadComplete";

/**
 * AssetManager
 *
 * Default framework implementation of {@link IAssetManager}. Delegates
 * actual loading to an injected {@link IAssetLoaderAdapter}, so this
 * class contains only queueing, deduplication, and fallback-resolution
 * logic — fully unit testable with a fake adapter, no real Phaser
 * loader or network involved (see AssetManager.spec.ts).
 */
export class AssetManager implements IAssetManager {
  private readonly _adapter: IAssetLoaderAdapter;
  private readonly _eventBus?: IEventBus;
  private readonly _fallbacks = new Map<string, string>();
  private _queue: AssetDescriptor[] = [];

  public constructor(adapter: IAssetLoaderAdapter, eventBus?: IEventBus) {
    this._adapter = adapter;
    this._eventBus = eventBus;
  }

  public queue(descriptor: AssetDescriptor): void {
    const alreadyQueued = this._queue.some((queued) => queued.key === descriptor.key);
    if (alreadyQueued || this._adapter.isLoaded(descriptor.key)) {
      return;
    }
    this._queue.push(descriptor);
  }

  public queueMany(descriptors: AssetDescriptor[]): void {
    for (const descriptor of descriptors) {
      this.queue(descriptor);
    }
  }

  public async load(): Promise<AssetLoadResult> {
    if (this._queue.length === 0) {
      return { failedKeys: [] };
    }

    for (const descriptor of this._queue) {
      this._adapter.enqueue(descriptor);
    }
    this._queue = [];

    const result = await this._adapter.start((loaded, total) => {
      this._eventBus?.emit<AssetLoadProgressEvent>(ASSET_PROGRESS_EVENT, { loaded, total });
    });

    this._eventBus?.emit<AssetLoadCompleteEvent>(ASSET_LOAD_COMPLETE_EVENT, {
      failedKeys: result.failedKeys
    });

    return result;
  }

  public isLoaded(key: string): boolean {
    return this._adapter.isLoaded(key);
  }

  public registerFallback(key: string, fallbackKey: string): void {
    this._fallbacks.set(key, fallbackKey);
  }

  public resolveKey(key: string): string {
    if (this._adapter.isLoaded(key)) {
      return key;
    }

    const fallback = this._fallbacks.get(key);
    if (fallback !== undefined && this._adapter.isLoaded(fallback)) {
      return fallback;
    }

    return key;
  }
}
