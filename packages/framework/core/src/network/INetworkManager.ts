/** Payload emitted on the EventBus when the WebSocket connection opens. */
export interface NetworkOpenEvent {
  readonly url: string;
}

/** Payload emitted on the EventBus for every incoming WebSocket message. */
export interface NetworkMessageEvent {
  readonly data: string;
}

/** Payload emitted on the EventBus when the WebSocket connection closes. */
export interface NetworkCloseEvent {
  readonly code: number;
  readonly reason: string;
}

/** Payload emitted on the EventBus when the WebSocket connection errors. */
export interface NetworkErrorEvent {
  readonly error: unknown;
}

/**
 * INetworkManager
 *
 * Framework-level network API combining request/response HTTP and a
 * single persistent WebSocket connection (see Dev_Plan.txt production
 * stack: Fastify backend, Socket.IO/Colyseus for real-time). HTTP
 * methods resolve against an optional base URL and default headers
 * (e.g. an auth token) configured once via setAuthToken(). WebSocket
 * events are published on the EventBus as "network:open",
 * "network:message", "network:close", "network:error" so other systems
 * can react without holding a reference to this manager.
 */
export interface INetworkManager {
  /** Set the base URL every relative HTTP request is resolved against. Absolute URLs passed to get/post/etc bypass this. */
  setBaseUrl(baseUrl: string): void;

  /** Set (or clear, with null) the bearer token attached as an Authorization header to every HTTP request. */
  setAuthToken(token: string | null): void;

  get<TData = unknown>(path: string, headers?: Record<string, string>): Promise<TData>;
  post<TData = unknown>(path: string, body?: unknown, headers?: Record<string, string>): Promise<TData>;
  put<TData = unknown>(path: string, body?: unknown, headers?: Record<string, string>): Promise<TData>;
  patch<TData = unknown>(path: string, body?: unknown, headers?: Record<string, string>): Promise<TData>;
  delete<TData = unknown>(path: string, headers?: Record<string, string>): Promise<TData>;

  /** Open the WebSocket connection. Closes any existing connection first. */
  connectSocket(url: string): void;

  /** Send data over the currently open WebSocket connection. No-op if not connected. */
  sendSocket(data: string): void;

  /** Close the WebSocket connection, if one is open. */
  disconnectSocket(): void;

  /** Whether a WebSocket connection is currently open. */
  isSocketConnected(): boolean;
}
