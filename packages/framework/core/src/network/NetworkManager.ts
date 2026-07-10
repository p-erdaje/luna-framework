import type { IEventBus } from "../events/IEventBus";
import type { HttpRequestConfig, IHttpAdapter } from "./IHttpAdapter";
import type {
  INetworkManager,
  NetworkCloseEvent,
  NetworkErrorEvent,
  NetworkMessageEvent,
  NetworkOpenEvent
} from "./INetworkManager";
import type { IWebSocketAdapter, IWebSocketConnection } from "./IWebSocketAdapter";

const NETWORK_OPEN_EVENT = "network:open";
const NETWORK_MESSAGE_EVENT = "network:message";
const NETWORK_CLOSE_EVENT = "network:close";
const NETWORK_ERROR_EVENT = "network:error";

/**
 * NetworkManager
 *
 * Default framework implementation of {@link INetworkManager}. Delegates
 * HTTP requests to an injected {@link IHttpAdapter} and the WebSocket
 * connection to an injected {@link IWebSocketAdapter} (Dependency
 * Injection) — this class contains only base-URL joining, header
 * merging, and connection-state bookkeeping, none of which touches a
 * real network call, so it's fully unit testable with fake adapters
 * (see NetworkManager.spec.ts).
 */
export class NetworkManager implements INetworkManager {
  private readonly _httpAdapter: IHttpAdapter;
  private readonly _socketAdapter: IWebSocketAdapter;
  private readonly _eventBus?: IEventBus;

  private _baseUrl = "";
  private _authToken: string | null = null;
  private _connection: IWebSocketConnection | null = null;

  public constructor(httpAdapter: IHttpAdapter, socketAdapter: IWebSocketAdapter, eventBus?: IEventBus) {
    this._httpAdapter = httpAdapter;
    this._socketAdapter = socketAdapter;
    this._eventBus = eventBus;
  }

  public setBaseUrl(baseUrl: string): void {
    this._baseUrl = baseUrl;
  }

  public setAuthToken(token: string | null): void {
    this._authToken = token;
  }

  public async get<TData = unknown>(path: string, headers?: Record<string, string>): Promise<TData> {
    return this._request<TData>({ method: "GET", url: this._resolveUrl(path), headers });
  }

  public async post<TData = unknown>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<TData> {
    return this._request<TData>({ method: "POST", url: this._resolveUrl(path), body, headers });
  }

  public async put<TData = unknown>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<TData> {
    return this._request<TData>({ method: "PUT", url: this._resolveUrl(path), body, headers });
  }

  public async patch<TData = unknown>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<TData> {
    return this._request<TData>({ method: "PATCH", url: this._resolveUrl(path), body, headers });
  }

  public async delete<TData = unknown>(path: string, headers?: Record<string, string>): Promise<TData> {
    return this._request<TData>({ method: "DELETE", url: this._resolveUrl(path), headers });
  }

  public connectSocket(url: string): void {
    this.disconnectSocket();

    const connection = this._socketAdapter.connect(url);

    connection.onOpen = () => {
      this._eventBus?.emit<NetworkOpenEvent>(NETWORK_OPEN_EVENT, { url });
    };
    connection.onMessage = (data: string) => {
      this._eventBus?.emit<NetworkMessageEvent>(NETWORK_MESSAGE_EVENT, { data });
    };
    connection.onClose = (code: number, reason: string) => {
      this._connection = null;
      this._eventBus?.emit<NetworkCloseEvent>(NETWORK_CLOSE_EVENT, { code, reason });
    };
    connection.onError = (error: unknown) => {
      this._eventBus?.emit<NetworkErrorEvent>(NETWORK_ERROR_EVENT, { error });
    };

    this._connection = connection;
  }

  public sendSocket(data: string): void {
    this._connection?.send(data);
  }

  public disconnectSocket(): void {
    if (!this._connection) {
      return;
    }
    this._connection.close();
    this._connection = null;
  }

  public isSocketConnected(): boolean {
    return this._connection !== null;
  }

  private async _request<TData>(config: HttpRequestConfig): Promise<TData> {
    const headers = this._buildHeaders(config.headers);
    const response = await this._httpAdapter.request<TData>({ ...config, headers });

    if (!response.ok) {
      throw new Error(`NetworkManager: request to "${config.url}" failed with status ${response.status}.`);
    }

    return response.data;
  }

  private _buildHeaders(overrides?: Readonly<Record<string, string>>): Record<string, string> {
    const headers: Record<string, string> = { ...overrides };

    if (this._authToken !== null) {
      headers.Authorization = `Bearer ${this._authToken}`;
    }

    return headers;
  }

  private _resolveUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return `${this._baseUrl}${path}`;
  }
}
