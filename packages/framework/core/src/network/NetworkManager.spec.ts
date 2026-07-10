import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../events/EventBus";
import type { HttpRequestConfig, HttpResponse, IHttpAdapter } from "./IHttpAdapter";
import type {
  NetworkCloseEvent,
  NetworkErrorEvent,
  NetworkMessageEvent,
  NetworkOpenEvent
} from "./INetworkManager";
import type { IWebSocketConnection } from "./IWebSocketAdapter";
import { NetworkManager } from "./NetworkManager";

function createFakeHttpAdapter(response: Partial<HttpResponse> = {}) {
  const defaultResponse: HttpResponse = { status: 200, ok: true, data: {}, ...response };
  return {
    request: vi.fn(async (_config: HttpRequestConfig) => defaultResponse)
  } satisfies IHttpAdapter;
}

function createFakeSocketAdapter() {
  const connection: IWebSocketConnection = {
    send: vi.fn(),
    close: vi.fn(),
    onOpen: null,
    onMessage: null,
    onClose: null,
    onError: null
  };
  return {
    connect: vi.fn((_url: string) => connection),
    connection
  };
}

describe("NetworkManager — HTTP", () => {
  it("resolves a relative path against the configured base URL", async () => {
    const http = createFakeHttpAdapter();
    const network = new NetworkManager(http, createFakeSocketAdapter());

    network.setBaseUrl("https://api.luna.dev");
    await network.get("/players");

    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://api.luna.dev/players" })
    );
  });

  it("leaves an absolute URL untouched even with a base URL configured", async () => {
    const http = createFakeHttpAdapter();
    const network = new NetworkManager(http, createFakeSocketAdapter());

    network.setBaseUrl("https://api.luna.dev");
    await network.get("https://other-service.dev/data");

    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://other-service.dev/data" })
    );
  });

  it("attaches an Authorization header once setAuthToken() is called", async () => {
    const http = createFakeHttpAdapter();
    const network = new NetworkManager(http, createFakeSocketAdapter());

    network.setAuthToken("abc123");
    await network.get("/me");

    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer abc123" }) })
    );
  });

  it("omits the Authorization header when no token has been set", async () => {
    const http = createFakeHttpAdapter();
    const network = new NetworkManager(http, createFakeSocketAdapter());

    await network.get("/me");

    const call = http.request.mock.calls[0]?.[0] as HttpRequestConfig;
    expect(call.headers).not.toHaveProperty("Authorization");
  });

  it("sends the request body on post()", async () => {
    const http = createFakeHttpAdapter();
    const network = new NetworkManager(http, createFakeSocketAdapter());

    await network.post("/players", { name: "Luna" });

    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: "POST", body: { name: "Luna" } })
    );
  });

  it("returns response.data for a successful request", async () => {
    const http = createFakeHttpAdapter({ data: { id: 1, name: "Luna" } });
    const network = new NetworkManager(http, createFakeSocketAdapter());

    const result = await network.get<{ id: number; name: string }>("/players/1");

    expect(result).toEqual({ id: 1, name: "Luna" });
  });

  it("throws when the response is not ok", async () => {
    const http = createFakeHttpAdapter({ ok: false, status: 404 });
    const network = new NetworkManager(http, createFakeSocketAdapter());

    await expect(network.get("/missing")).rejects.toThrow(/status 404/);
  });

  it("uses the correct HTTP method for each convenience call", async () => {
    const http = createFakeHttpAdapter();
    const network = new NetworkManager(http, createFakeSocketAdapter());

    await network.put("/x", {});
    await network.patch("/x", {});
    await network.delete("/x");

    const methods = http.request.mock.calls.map((call) => (call[0] as HttpRequestConfig).method);
    expect(methods).toEqual(["PUT", "PATCH", "DELETE"]);
  });
});

describe("NetworkManager — WebSocket", () => {
  it("reports not connected before connectSocket() is called", () => {
    const network = new NetworkManager(createFakeHttpAdapter(), createFakeSocketAdapter());

    expect(network.isSocketConnected()).toBe(false);
  });

  it("reports connected immediately after connectSocket()", () => {
    const network = new NetworkManager(createFakeHttpAdapter(), createFakeSocketAdapter());

    network.connectSocket("wss://game.luna.dev");

    expect(network.isSocketConnected()).toBe(true);
  });

  it("emits network:open when the connection's onOpen callback fires", () => {
    const socketAdapter = createFakeSocketAdapter();
    const eventBus = new EventBus();
    const network = new NetworkManager(createFakeHttpAdapter(), socketAdapter, eventBus);
    const handler = vi.fn();

    eventBus.on<NetworkOpenEvent>("network:open", handler);
    network.connectSocket("wss://game.luna.dev");
    socketAdapter.connection.onOpen?.();

    expect(handler).toHaveBeenCalledWith({ url: "wss://game.luna.dev" });
  });

  it("emits network:message with the incoming data", () => {
    const socketAdapter = createFakeSocketAdapter();
    const eventBus = new EventBus();
    const network = new NetworkManager(createFakeHttpAdapter(), socketAdapter, eventBus);
    const handler = vi.fn();

    eventBus.on<NetworkMessageEvent>("network:message", handler);
    network.connectSocket("wss://game.luna.dev");
    socketAdapter.connection.onMessage?.('{"type":"ping"}');

    expect(handler).toHaveBeenCalledWith({ data: '{"type":"ping"}' });
  });

  it("emits network:close and updates isSocketConnected() when the connection closes", () => {
    const socketAdapter = createFakeSocketAdapter();
    const eventBus = new EventBus();
    const network = new NetworkManager(createFakeHttpAdapter(), socketAdapter, eventBus);
    const handler = vi.fn();

    eventBus.on<NetworkCloseEvent>("network:close", handler);
    network.connectSocket("wss://game.luna.dev");
    socketAdapter.connection.onClose?.(1000, "normal closure");

    expect(handler).toHaveBeenCalledWith({ code: 1000, reason: "normal closure" });
    expect(network.isSocketConnected()).toBe(false);
  });

  it("emits network:error when the connection errors", () => {
    const socketAdapter = createFakeSocketAdapter();
    const eventBus = new EventBus();
    const network = new NetworkManager(createFakeHttpAdapter(), socketAdapter, eventBus);
    const handler = vi.fn();
    const fakeError = new Error("connection reset");

    eventBus.on<NetworkErrorEvent>("network:error", handler);
    network.connectSocket("wss://game.luna.dev");
    socketAdapter.connection.onError?.(fakeError);

    expect(handler).toHaveBeenCalledWith({ error: fakeError });
  });

  it("sendSocket() forwards data to the active connection", () => {
    const socketAdapter = createFakeSocketAdapter();
    const network = new NetworkManager(createFakeHttpAdapter(), socketAdapter);

    network.connectSocket("wss://game.luna.dev");
    network.sendSocket("hello");

    expect(socketAdapter.connection.send).toHaveBeenCalledWith("hello");
  });

  it("sendSocket() does nothing when there is no active connection", () => {
    const network = new NetworkManager(createFakeHttpAdapter(), createFakeSocketAdapter());

    expect(() => network.sendSocket("hello")).not.toThrow();
  });

  it("disconnectSocket() closes the connection and updates isSocketConnected()", () => {
    const socketAdapter = createFakeSocketAdapter();
    const network = new NetworkManager(createFakeHttpAdapter(), socketAdapter);

    network.connectSocket("wss://game.luna.dev");
    network.disconnectSocket();

    expect(socketAdapter.connection.close).toHaveBeenCalledOnce();
    expect(network.isSocketConnected()).toBe(false);
  });

  it("disconnectSocket() does nothing when there is no active connection", () => {
    const network = new NetworkManager(createFakeHttpAdapter(), createFakeSocketAdapter());

    expect(() => network.disconnectSocket()).not.toThrow();
  });

  it("connectSocket() closes an existing connection before opening a new one", () => {
    const socketAdapter = createFakeSocketAdapter();
    const network = new NetworkManager(createFakeHttpAdapter(), socketAdapter);

    network.connectSocket("wss://first.luna.dev");
    network.connectSocket("wss://second.luna.dev");

    expect(socketAdapter.connection.close).toHaveBeenCalledOnce();
    expect(socketAdapter.connect).toHaveBeenCalledTimes(2);
  });

  it("works correctly without an EventBus provided at all", () => {
    const socketAdapter = createFakeSocketAdapter();
    const network = new NetworkManager(createFakeHttpAdapter(), socketAdapter);

    network.connectSocket("wss://game.luna.dev");

    expect(() => socketAdapter.connection.onOpen?.()).not.toThrow();
  });
});
