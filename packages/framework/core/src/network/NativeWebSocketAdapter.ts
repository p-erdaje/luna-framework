import type { IWebSocketAdapter, IWebSocketConnection } from "./IWebSocketAdapter";

/**
 * NativeWebSocketAdapter
 *
 * The only place in the framework that constructs a native WebSocket.
 * Wraps it behind {@link IWebSocketConnection}, translating the raw
 * `onopen`/`onmessage`/`onclose`/`onerror` events into the plain
 * callback properties NetworkManager assigns. Pure plumbing, no
 * business logic — intentionally excluded from unit test coverage
 * requirements, same rationale as {@link FetchHttpAdapter}.
 */
export class NativeWebSocketAdapter implements IWebSocketAdapter {
  public connect(url: string): IWebSocketConnection {
    const socket = new WebSocket(url);

    const connection: IWebSocketConnection = {
      send: (data: string) => socket.send(data),
      close: () => socket.close(),
      onOpen: null,
      onMessage: null,
      onClose: null,
      onError: null
    };

    socket.onopen = () => connection.onOpen?.();
    socket.onmessage = (event: MessageEvent<string>) => connection.onMessage?.(event.data);
    socket.onclose = (event: CloseEvent) => connection.onClose?.(event.code, event.reason);
    socket.onerror = (event: Event) => connection.onError?.(event);

    return connection;
  }
}
