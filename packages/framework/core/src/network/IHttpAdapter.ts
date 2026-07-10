/** A single outgoing HTTP request. */
export interface HttpRequestConfig {
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: unknown;
}

/** The result of an HTTP request. `data` is already JSON-parsed when the response body was JSON. */
export interface HttpResponse<TData = unknown> {
  readonly status: number;
  readonly ok: boolean;
  readonly data: TData;
}

/**
 * IHttpAdapter
 *
 * Minimal contract around a single HTTP request/response cycle.
 * NetworkManager depends on this instead of calling fetch() directly,
 * so its base-URL joining, default headers, and auth-token logic are
 * unit-testable with a fake adapter — no real network call involved.
 */
export interface IHttpAdapter {
  request<TData = unknown>(config: HttpRequestConfig): Promise<HttpResponse<TData>>;
}
