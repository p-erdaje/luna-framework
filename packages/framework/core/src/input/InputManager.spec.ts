import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../events/EventBus";
import type { InputActionEvent } from "./IInputManager";
import type { IInputSourceAdapter } from "./IInputSourceAdapter";
import { InputManager } from "./InputManager";

function createFakeAdapter(initiallyDown: string[] = []) {
  const down = new Set(initiallyDown);
  return {
    isDown: vi.fn((code: string) => down.has(code)),
    press(code: string) {
      down.add(code);
    },
    release(code: string) {
      down.delete(code);
    }
  } satisfies IInputSourceAdapter & {
    press: (code: string) => void;
    release: (code: string) => void;
  };
}

describe("InputManager", () => {
  it("reports an unbound action as not down", () => {
    const input = new InputManager(createFakeAdapter());

    expect(input.isActionDown("jump")).toBe(false);
  });

  it("reports a bound action as down when its code is held", () => {
    const adapter = createFakeAdapter(["Space"]);
    const input = new InputManager(adapter);

    input.bindAction("jump", ["Space"]);
    input.update();

    expect(input.isActionDown("jump")).toBe(true);
  });

  it("treats an action as down if any of its bound codes is held", () => {
    const adapter = createFakeAdapter(["KeyW"]);
    const input = new InputManager(adapter);

    input.bindAction("moveUp", ["KeyW", "ArrowUp"]);
    input.update();

    expect(input.isActionDown("moveUp")).toBe(true);
  });

  it("reports justPressed only on the frame the action transitions from up to down", () => {
    const adapter = createFakeAdapter();
    const input = new InputManager(adapter);

    input.bindAction("jump", ["Space"]);
    input.update();
    expect(input.isActionJustPressed("jump")).toBe(false);

    adapter.press("Space");
    input.update();
    expect(input.isActionJustPressed("jump")).toBe(true);

    input.update();
    expect(input.isActionJustPressed("jump")).toBe(false);
  });

  it("reports justReleased only on the frame the action transitions from down to up", () => {
    const adapter = createFakeAdapter(["Space"]);
    const input = new InputManager(adapter);

    input.bindAction("jump", ["Space"]);
    input.update();
    expect(input.isActionJustReleased("jump")).toBe(false);

    adapter.release("Space");
    input.update();
    expect(input.isActionJustReleased("jump")).toBe(true);

    input.update();
    expect(input.isActionJustReleased("jump")).toBe(false);
  });

  it("unbindAction() removes the action so it reports as not down", () => {
    const adapter = createFakeAdapter(["Space"]);
    const input = new InputManager(adapter);

    input.bindAction("jump", ["Space"]);
    input.update();
    input.unbindAction("jump");

    expect(input.isActionDown("jump")).toBe(false);
  });

  it("rebinding an action to different codes replaces its old codes", () => {
    const adapter = createFakeAdapter(["Space"]);
    const input = new InputManager(adapter);

    input.bindAction("jump", ["Space"]);
    input.bindAction("jump", ["KeyX"]);
    input.update();

    expect(input.isActionDown("jump")).toBe(false);
  });

  it("does not throw when update() is called with no bound actions", () => {
    const input = new InputManager(createFakeAdapter());

    expect(() => input.update()).not.toThrow();
  });

  it("emits input:actionPressed the frame an action becomes held", () => {
    const eventBus = new EventBus();
    const adapter = createFakeAdapter();
    const input = new InputManager(adapter, eventBus);
    const handler = vi.fn();

    eventBus.on<InputActionEvent>("input:actionPressed", handler);
    input.bindAction("jump", ["Space"]);
    input.update();

    adapter.press("Space");
    input.update();

    expect(handler).toHaveBeenCalledWith({ action: "jump" });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("emits input:actionReleased the frame an action stops being held", () => {
    const eventBus = new EventBus();
    const adapter = createFakeAdapter(["Space"]);
    const input = new InputManager(adapter, eventBus);
    const handler = vi.fn();

    input.bindAction("jump", ["Space"]);
    input.update();
    eventBus.on<InputActionEvent>("input:actionReleased", handler);

    adapter.release("Space");
    input.update();

    expect(handler).toHaveBeenCalledWith({ action: "jump" });
  });

  it("works correctly without an EventBus provided at all", () => {
    const adapter = createFakeAdapter();
    const input = new InputManager(adapter);

    input.bindAction("jump", ["Space"]);

    expect(() => {
      adapter.press("Space");
      input.update();
    }).not.toThrow();
  });

  it("tracks multiple independent actions in the same update() call", () => {
    const adapter = createFakeAdapter(["Space", "KeyA"]);
    const input = new InputManager(adapter);

    input.bindAction("jump", ["Space"]);
    input.bindAction("moveLeft", ["KeyA"]);
    input.bindAction("moveRight", ["KeyD"]);
    input.update();

    expect(input.isActionDown("jump")).toBe(true);
    expect(input.isActionDown("moveLeft")).toBe(true);
    expect(input.isActionDown("moveRight")).toBe(false);
  });
});
