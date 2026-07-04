import { describe, expect, it, vi } from "vitest";
import { EventBus } from "./EventBus";

describe("EventBus", () => {
  it("invokes a subscribed handler when the event is emitted", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("player:jump", handler);
    bus.emit("player:jump", { height: 10 });

    expect(handler).toHaveBeenCalledWith({ height: 10 });
  });

  it("supports multiple handlers for the same event", () => {
    const bus = new EventBus();
    const first = vi.fn();
    const second = vi.fn();

    bus.on("score:changed", first);
    bus.on("score:changed", second);
    bus.emit("score:changed", 100);

    expect(first).toHaveBeenCalledWith(100);
    expect(second).toHaveBeenCalledWith(100);
  });

  it("does not throw when emitting an event with no subscribers", () => {
    const bus = new EventBus();

    expect(() => bus.emit("nothing:subscribed")).not.toThrow();
  });

  it("stops calling a handler after off() is used", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("enemy:spawn", handler);
    bus.off("enemy:spawn", handler);
    bus.emit("enemy:spawn");

    expect(handler).not.toHaveBeenCalled();
  });

  it("silently ignores off() for a handler that was never subscribed", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    expect(() => bus.off("never:subscribed", handler)).not.toThrow();
  });

  it("only invokes a once() handler a single time", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.once("game:start", handler);
    bus.emit("game:start");
    bus.emit("game:start");

    expect(handler).toHaveBeenCalledOnce();
  });

  it("removes all handlers for a specific event when clear(event) is called", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("save:complete", handler);
    bus.clear("save:complete");
    bus.emit("save:complete");

    expect(handler).not.toHaveBeenCalled();
  });

  it("removes every handler across all events when clear() is called with no argument", () => {
    const bus = new EventBus();
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    bus.on("eventA", handlerA);
    bus.on("eventB", handlerB);
    bus.clear();
    bus.emit("eventA");
    bus.emit("eventB");

    expect(handlerA).not.toHaveBeenCalled();
    expect(handlerB).not.toHaveBeenCalled();
  });

  it("reports the current listener count for an event", () => {
    const bus = new EventBus();

    expect(bus.listenerCount("x")).toBe(0);

    bus.on("x", vi.fn());
    bus.on("x", vi.fn());

    expect(bus.listenerCount("x")).toBe(2);
  });

  it("allows a handler to safely unsubscribe itself during emit without breaking other handlers", () => {
    const bus = new EventBus();
    const other = vi.fn();
    const selfRemoving = vi.fn(() => {
      bus.off("self:remove", selfRemoving);
    });

    bus.on("self:remove", selfRemoving);
    bus.on("self:remove", other);
    bus.emit("self:remove");
    bus.emit("self:remove");

    expect(selfRemoving).toHaveBeenCalledOnce();
    expect(other).toHaveBeenCalledTimes(2);
  });
});
