import type { IStorageAdapter } from "./IStorageAdapter";

const DEFAULT_DB_NAME = "luna-save-db";
const DEFAULT_STORE_NAME = "saves";
const DB_VERSION = 1;

/**
 * IndexedDbStorageAdapter
 *
 * Wraps a single IndexedDB object store behind the async
 * {@link IStorageAdapter} contract. Useful for larger save payloads
 * than LocalStorage comfortably handles. Pure storage plumbing, no
 * business logic — intentionally excluded from unit test coverage
 * requirements, same rationale as {@link LocalStorageAdapter}.
 */
export class IndexedDbStorageAdapter implements IStorageAdapter {
  private readonly _dbName: string;
  private readonly _storeName: string;
  private _dbPromise: Promise<IDBDatabase> | null = null;

  public constructor(dbName: string = DEFAULT_DB_NAME, storeName: string = DEFAULT_STORE_NAME) {
    this._dbName = dbName;
    this._storeName = storeName;
  }

  public async getItem(key: string): Promise<string | null> {
    const db = await this._openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(this._storeName, "readonly").objectStore(this._storeName).get(key);
      request.onsuccess = () => resolve((request.result as string | undefined) ?? null);
      request.onerror = () => reject(request.error as Error);
    });
  }

  public async setItem(key: string, value: string): Promise<void> {
    const db = await this._openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this._storeName, "readwrite");
      transaction.objectStore(this._storeName).put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error as Error);
    });
  }

  public async removeItem(key: string): Promise<void> {
    const db = await this._openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this._storeName, "readwrite");
      transaction.objectStore(this._storeName).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error as Error);
    });
  }

  public async getAllKeys(): Promise<string[]> {
    const db = await this._openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(this._storeName, "readonly").objectStore(this._storeName).getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error as Error);
    });
  }

  private _openDatabase(): Promise<IDBDatabase> {
    this._dbPromise ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(this._dbName, DB_VERSION);

      request.onupgradeneeded = () => {
        request.result.createObjectStore(this._storeName);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error as Error);
    });

    return this._dbPromise;
  }
}
