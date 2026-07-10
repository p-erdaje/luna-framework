/**
 * IWebSocketConnection
 *
 * A single open (or opening) WebSocket connection. NetworkManager
 * assigns the four handler properties itself right after creating the
 * connection, then translates each callback into an EventBus emission
 * — this object is just the wire, not a source of business logic.
 */
export interface IWebSocketConnection {
  send(data: string): void;
  close(): void;

  onOpen: (() => void) | null;
  onMessage: ((data: string) => void) | null;
  onClose: ((code: number, reason: string) => void) | null;
  onError: ((error: unknown) => void) | null;
}

/**
 * IWebSocketAdapter
 *
 * Minimal contract for opening a WebSocket connection. NetworkManager
 * depends on this instead of the native WebSocket constructor directly
 * (Adapter pattern), so connection lifecycle and event-translation
 * logic are unit-testable with a fake adapter — no real socket or
 * browser involved.
 */
export interface IWebSocketAdapter {
  connect(url: string): IWebSocketConnection;
}
