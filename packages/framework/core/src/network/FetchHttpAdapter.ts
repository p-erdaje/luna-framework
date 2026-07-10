import type { HttpRequestConfig, HttpResponse, IHttpAdapter } from "./IHttpAdapter";

/**
 * FetchHttpAdapter
 *
 * The only place in the framework that calls the native fetch() API.
 * Serializes object bodies to JSON, parses JSON responses, and reports
 * status/ok back through {@link HttpResponse} — pure plumbing, no
 * base-URL or auth logic, which lives in NetworkManager instead.
 * Intentionally excluded from unit test coverage requirements (see
 * docs/CONTRIBUTING.md -> Testing Strategy); NetworkManager's actual
 * logic is verified in NetworkManager.spec.ts using a fake adapter.
 */
export class FetchHttpAdapter implements IHttpAdapter {
  public async request<TData = unknown>(config: HttpRequestConfig): Promise<HttpResponse<TData>> {
    const headers: Record<string, string> = { ...config.headers };
    let body: string | undefined;

    if (config.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(config.body);
    }

    const response = await fetch(config.url, { method: config.method, headers, body });
    const data = (await this._parseBody(response)) as TData;

    return { status: response.status, ok: response.ok, data };
  }

  private async _parseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }
}
