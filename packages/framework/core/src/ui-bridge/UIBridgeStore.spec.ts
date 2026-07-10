import { describe, expect, it, vi } from "vitest";
import { UIBridgeStore } from "./UIBridgeStore";

interface HudState extends Record<string, unknown> {
  health: number;
  score: number;
  playerName: string;
}

describe("UIBridgeStore", () => {
  it("returns undefined for a key that was never set", () => {
    const store = new UIBridgeStore<HudState>();

    expect(store.get("health")).toBeUndefined();
  });

  it("returns the value after set() is called", () => {
    const store = new UIBridgeStore<HudState>();

    store.set("health", 80);

    expect(store.get("health")).toBe(80);
  });

  it("notifies a subscriber with the new value and previous value", () => {
    const store = new UIBridgeStore<HudState>();
    const handler = vi.fn();

    store.set("health", 100);
    store.subscribe("health", handler);
    store.set("health", 80);

    expect(handler).toHaveBeenCalledWith(80, 100);
  });

  it("reports previousValue as undefined on the first set() for a key", () => {
    const store = new UIBridgeStore<HudState>();
    const handler = vi.fn();

    store.subscribe("health", handler);
    store.set("health", 100);

    expect(handler).toHaveBeenCalledWith(100, undefined);
  });

  it("does not notify subscribers when set() is called with an unchanged value", () => {
    const store = new UIBridgeStore<HudState>();
    const handler = vi.fn();

    store.set("health", 100);
    store.subscribe("health", handler);
    store.set("health", 100);

    expect(handler).not.toHaveBeenCalled();
  });

  it("notifies every subscriber registered for the same key", () => {
    const store = new UIBridgeStore<HudState>();
    const first = vi.fn();
    const second = vi.fn();

    store.subscribe("score", first);
    store.subscribe("score", second);
    store.set("score", 500);

    expect(first).toHaveBeenCalledWith(500, undefined);
    expect(second).toHaveBeenCalledWith(500, undefined);
  });

  it("does not notify a subscriber of a different key changing", () => {
    const store = new UIBridgeStore<HudState>();
    const handler = vi.fn();

    store.subscribe("health", handler);
    store.set("score", 500);

    expect(handler).not.toHaveBeenCalled();
  });

  it("stops notifying after the returned unsubscribe function is called", () => {
    const store = new UIBridgeStore<HudState>();
    const handler = vi.fn();

    const unsubscribe = store.subscribe("health", handler);
    unsubscribe();
    store.set("health", 50);

    expect(handler).not.toHaveBeenCalled();
  });

  it("unsubscribing one listener does not affect another listener on the same key", () => {
    const store = new UIBridgeStore<HudState>();
    const first = vi.fn();
    const second = vi.fn();

    const unsubscribeFirst = store.subscribe("health", first);
    store.subscribe("health", second);
    unsubscribeFirst();
    store.set("health", 50);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(50, undefined);
  });

  it("unsubscribeAll(key) removes every listener for that key only", () => {
    const store = new UIBridgeStore<HudState>();
    const healthHandler = vi.fn();
    const scoreHandler = vi.fn();

    store.subscribe("health", healthHandler);
    store.subscribe("score", scoreHandler);
    store.unsubscribeAll("health");
    store.set("health", 50);
    store.set("score", 100);

    expect(healthHandler).not.toHaveBeenCalled();
    expect(scoreHandler).toHaveBeenCalledWith(100, undefined);
  });

  it("unsubscribeAll() with no key removes every listener for every key", () => {
    const store = new UIBridgeStore<HudState>();
    const healthHandler = vi.fn();
    const scoreHandler = vi.fn();

    store.subscribe("health", healthHandler);
    store.subscribe("score", scoreHandler);
    store.unsubscribeAll();
    store.set("health", 50);
    store.set("score", 100);

    expect(healthHandler).not.toHaveBeenCalled();
    expect(scoreHandler).not.toHaveBeenCalled();
  });

  it("getAll() returns a snapshot of every currently-set value", () => {
    const store = new UIBridgeStore<HudState>();

    store.set("health", 80);
    store.set("playerName", "Luna");

    expect(store.getAll()).toEqual({ health: 80, playerName: "Luna" });
  });

  it("getAll() returns a snapshot that does not mutate internal state when changed", () => {
    const store = new UIBridgeStore<HudState>();

    store.set("health", 80);
    const snapshot = store.getAll() as HudState;
    snapshot.health = 999;

    expect(store.get("health")).toBe(80);
  });
});
