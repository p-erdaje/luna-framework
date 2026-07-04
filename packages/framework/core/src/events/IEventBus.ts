/**
 * Handler function invoked when a subscribed event fires.
 *
 * @template TPayload - shape of the data passed to the handler.
 */
export type EventHandler<TPayload = unknown> = (payload: TPayload) => void;

/**
 * IEventBus
 *
 * Contract for a publish/subscribe event system. Framework modules
 * communicate through the EventBus instead of holding direct references
 * to each other, keeping the codebase loosely coupled.
 *
 * See docs/ARCHITECTURE.md -> "Event Bus" for where this fits in the
 * overall layered architecture.
 */
export interface IEventBus {
  /**
   * Subscribe a handler to an event. The same handler reference can only
   * be registered once per event — subscribing it again is a no-op.
   */
  on<TPayload = unknown>(event: string, handler: EventHandler<TPayload>): void;

  /**
   * Unsubscribe a previously registered handler from an event.
   * Safe to call even if the handler was never subscribed.
   */
  off<TPayload = unknown>(event: string, handler: EventHandler<TPayload>): void;

  /**
   * Subscribe a handler that automatically unsubscribes itself after its
   * first invocation.
   */
  once<TPayload = unknown>(event: string, handler: EventHandler<TPayload>): void;

  /**
   * Emit an event, invoking every handler currently subscribed to it,
   * in the order they were registered.
   */
  emit<TPayload = unknown>(event: string, payload?: TPayload): void;

  /**
   * Remove all handlers for a specific event, or every handler for every
   * event if no event name is given.
   */
  clear(event?: string): void;

  /**
   * Number of handlers currently subscribed to an event.
   * Useful for debugging and for assertions in tests.
   */
  listenerCount(event: string): number;
}
