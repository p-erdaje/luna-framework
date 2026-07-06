import type { ISaveManager } from "./ISaveManager";
import type { IStorageAdapter } from "./IStorageAdapter";

const DEFAULT_KEY_PREFIX = "luna:save:";

/**
 * SaveManager
 *
 * Default framework implementation of {@link ISaveManager}. Delegates
 * actual persistence to an injected {@link IStorageAdapter}, so this
 * class contains only save-slot logic (namespacing, serialization,
 * corrupted-data handling) and is fully unit testable with a fake
 * adapter — no LocalStorage, IndexedDB, or browser needed
 * (see SaveManager.spec.ts).
 *
 * Every key is namespaced with a prefix (default "luna:save:") so
 * Luna's saves don't collide with unrelated data some other library
 * might store in the same origin.
 */
export class SaveManager implements ISaveManager {
  private readonly _adapter: IStorageAdapter;
  private readonly _keyPrefix: string;

  public constructor(adapter: IStorageAdapter, keyPrefix: string = DEFAULT_KEY_PREFIX) {
    this._adapter = adapter;
    this._keyPrefix = keyPrefix;
  }

  public async save<TData>(slot: string, data: TData): Promise<void> {
    const serialized = JSON.stringify(data);
    await this._adapter.setItem(this._buildKey(slot), serialized);
  }

  public async load<TData>(slot: string): Promise<TData | null> {
    const raw = await this._adapter.getItem(this._buildKey(slot));
    if (raw === null) {
      return null;
    }

    try {
      return JSON.parse(raw) as TData;
    } catch {
      // Corrupted save data is treated the same as "no save" — the game
      // should be able to start fresh instead of crashing on load.
      return null;
    }
  }

  public async deleteSave(slot: string): Promise<void> {
    await this._adapter.removeItem(this._buildKey(slot));
  }

  public async hasSave(slot: string): Promise<boolean> {
    const raw = await this._adapter.getItem(this._buildKey(slot));
    return raw !== null;
  }

  public async listSaveSlots(): Promise<string[]> {
    const allKeys = await this._adapter.getAllKeys();
    return allKeys
      .filter((key) => key.startsWith(this._keyPrefix))
      .map((key) => key.slice(this._keyPrefix.length));
  }

  private _buildKey(slot: string): string {
    return `${this._keyPrefix}${slot}`;
  }
}
