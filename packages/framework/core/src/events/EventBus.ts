import type { EventHandler, IEventBus } from "./IEventBus";

/**
 * EventBus
 *
 * Default framework implementation of {@link IEventBus}, using the
 * Observer pattern. Each event name maps to a Set of handlers — this
 * guarantees a handler can only be registered once per event, and keeps
 * both add and remove operations O(1).
 *
 * Framework-agnostic: this class has no dependency on Phaser or the
 * browser, so it can be unit tested in isolation from a game or scene
 * (see Testable Core Logic in docs/ARCHITECTURE.md).
 *
 * @example
 * const bus = new EventBus();
 * bus.on("player:jump", (payload: { height: number }) => {
 *   console.log(`Jumped ${payload.height}px`);
 * });
 * bus.emit("player:jump", { height: 32 });
 */
export class EventBus implements IEventBus {
  private readonly _listeners = new Map<string, Set<EventHandler<unknown>>>();

  public on<TPayload = unknown>(event: string, handler: EventHandler<TPayload>): void {
    const handlers = this._listeners.get(event) ?? new Set<EventHandler<unknown>>();
    handlers.add(handler as EventHandler<unknown>);
    this._listeners.set(event, handlers);
  }

  public off<TPayload = unknown>(event: string, handler: EventHandler<TPayload>): void {
    const handlers = this._listeners.get(event);
    if (!handlers) {
      return;
    }

    handlers.delete(handler as EventHandler<unknown>);

    if (handlers.size === 0) {
      this._listeners.delete(event);
    }
  }

  public once<TPayload = unknown>(event: string, handler: EventHandler<TPayload>): void {
    const wrapped: EventHandler<TPayload> = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    this.on(event, wrapped);
  }

  public emit<TPayload = unknown>(event: string, payload?: TPayload): void {
    const handlers = this._listeners.get(event);
    if (!handlers) {
      return;
    }

    // Snapshot into an array before iterating. If a handler unsubscribes
    // itself mid-emit (e.g. via `once`), mutating the live Set while
    // iterating it directly would skip or double-invoke other handlers.
    const snapshot = Array.from(handlers);
    for (const handler of snapshot) {
      (handler as EventHandler<TPayload>)(payload as TPayload);
    }
  }

  public clear(event?: string): void {
    if (event) {
      this._listeners.delete(event);
      return;
    }
    this._listeners.clear();
  }

  public listenerCount(event: string): number {
    return this._listeners.get(event)?.size ?? 0;
  }
}
