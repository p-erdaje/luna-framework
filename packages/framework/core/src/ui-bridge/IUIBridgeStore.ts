/**
 * Called whenever a subscribed key's value changes.
 * `previousValue` is undefined on the very first set() for that key.
 */
export type UIBridgeListener<TValue> = (value: TValue, previousValue: TValue | undefined) => void;

/**
 * IUIBridgeStore
 *
 * Reactive key-value store bridging the Phaser/Canvas game layer and the
 * HTML5 UI layer (HUD, menus, settings) — see docs/ARCHITECTURE.md ->
 * "UI Bridge Store". Game code writes values (e.g. player health) with
 * set(); UI code reads the current value with get() and reacts to
 * changes with subscribe().
 *
 * Unlike {@link IEventBus}, which only notifies listeners at the moment
 * something happens, this store *holds* the latest value for every key,
 * so a UI component that subscribes late can still call get() to catch
 * up immediately instead of waiting for the next change.
 */
export interface IUIBridgeStore<TState extends Record<string, unknown> = Record<string, unknown>> {
  /** Current value for a key, or undefined if it was never set. */
  get<K extends keyof TState>(key: K): TState[K] | undefined;

  /** Set a value. Subscribers for this key are notified only if the value actually changed. */
  set<K extends keyof TState>(key: K, value: TState[K]): void;

  /** Subscribe to changes on a key. Returns an unsubscribe function. */
  subscribe<K extends keyof TState>(key: K, listener: UIBridgeListener<TState[K]>): () => void;

  /** Remove every listener for a specific key, or every listener for every key if no key is given. */
  unsubscribeAll(key?: keyof TState): void;

  /** Snapshot of every currently-set value. Mutating the returned object does not affect internal state. */
  getAll(): Readonly<Partial<TState>>;
}
