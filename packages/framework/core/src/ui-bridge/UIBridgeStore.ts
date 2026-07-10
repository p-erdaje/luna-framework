import type { IUIBridgeStore, UIBridgeListener } from "./IUIBridgeStore";

/**
 * UIBridgeStore
 *
 * Default framework implementation of {@link IUIBridgeStore}. Holds
 * state in a Map and subscribers in a Map of Sets — the same pattern
 * EventBus uses — but unlike EventBus, values persist so late
 * subscribers can still read the current state via get().
 *
 * Framework-agnostic: no dependency on Phaser, the DOM, or any UI
 * library, so it's testable in isolation (see UIBridgeStore.spec.ts).
 * Whether the "HTML5 UI" side is vanilla DOM, React, or anything else
 * is entirely up to the game — this store doesn't care.
 *
 * @example
 * interface HudState extends Record<string, unknown> {
 *   health: number;
 *   score: number;
 * }
 *
 * const hud = new UIBridgeStore<HudState>();
 * hud.subscribe("health", (value) => updateHealthBar(value));
 * hud.set("health", 80); // Phaser scene calls this when the player takes damage
 */
export class UIBridgeStore<TState extends Record<string, unknown> = Record<string, unknown>>
  implements IUIBridgeStore<TState>
{
  private readonly _state = new Map<keyof TState, TState[keyof TState]>();
  private readonly _listeners = new Map<keyof TState, Set<UIBridgeListener<unknown>>>();

  public get<K extends keyof TState>(key: K): TState[K] | undefined {
    return this._state.get(key) as TState[K] | undefined;
  }

  public set<K extends keyof TState>(key: K, value: TState[K]): void {
    const previousValue = this.get(key);

    if (Object.is(previousValue, value)) {
      return;
    }

    this._state.set(key, value);
    this._notify(key, value, previousValue);
  }

  public subscribe<K extends keyof TState>(key: K, listener: UIBridgeListener<TState[K]>): () => void {
    const listeners = this._listeners.get(key) ?? new Set<UIBridgeListener<unknown>>();
    listeners.add(listener as UIBridgeListener<unknown>);
    this._listeners.set(key, listeners);

    return () => {
      listeners.delete(listener as UIBridgeListener<unknown>);
      if (listeners.size === 0) {
        this._listeners.delete(key);
      }
    };
  }

  public unsubscribeAll(key?: keyof TState): void {
    if (key !== undefined) {
      this._listeners.delete(key);
      return;
    }
    this._listeners.clear();
  }

  public getAll(): Readonly<Partial<TState>> {
    const snapshot: Partial<TState> = {};
    for (const [key, value] of this._state) {
      snapshot[key] = value;
    }
    return snapshot;
  }

  private _notify<K extends keyof TState>(key: K, value: TState[K], previousValue: TState[K] | undefined): void {
    const listeners = this._listeners.get(key);
    if (!listeners) {
      return;
    }

    // Snapshot before iterating, consistent with EventBus: a listener
    // that unsubscribes itself mid-notify shouldn't disrupt the loop.
    const snapshot = Array.from(listeners);
    for (const listener of snapshot) {
      (listener as UIBridgeListener<TState[K]>)(value, previousValue);
    }
  }
}
