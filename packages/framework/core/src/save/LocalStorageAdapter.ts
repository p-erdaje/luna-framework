import type { IStorageAdapter } from "./IStorageAdapter";

/**
 * LocalStorageAdapter
 *
 * Wraps the browser's synchronous localStorage API behind the async
 * {@link IStorageAdapter} contract. Pure pass-through, no business
 * logic — intentionally excluded from unit test coverage requirements
 * (see docs/CONTRIBUTING.md -> Testing Strategy). SaveManager's actual
 * save-slot logic is verified in SaveManager.spec.ts using a fake
 * adapter instead.
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly _storage: Storage;

  public constructor(storage: Storage = window.localStorage) {
    this._storage = storage;
  }

  public async getItem(key: string): Promise<string | null> {
    return this._storage.getItem(key);
  }

  public async setItem(key: string, value: string): Promise<void> {
    this._storage.setItem(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this._storage.removeItem(key);
  }

  public async getAllKeys(): Promise<string[]> {
    return Object.keys(this._storage);
  }
}
