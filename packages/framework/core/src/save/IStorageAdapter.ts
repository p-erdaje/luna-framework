/**
 * IStorageAdapter
 *
 * Minimal contract for a key-value persistence backend. Every method
 * returns a Promise — even LocalStorage's adapter, which is
 * synchronous under the hood — so {@link SaveManager} can work with
 * either backend (or a fake, in tests) without caring which one it is.
 */
export interface IStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
}
