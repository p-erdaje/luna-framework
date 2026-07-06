import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../events/EventBus";
import type { IPhaserSceneManagerAdapter } from "./IPhaserSceneManagerAdapter";
import type { SceneChangedEvent } from "./ISceneManager";
import { SceneManager } from "./SceneManager";

function createFakeAdapter() {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    sleep: vi.fn(),
    wake: vi.fn(),
    isActive: vi.fn(() => false),
    isSleeping: vi.fn(() => false)
  } satisfies IPhaserSceneManagerAdapter;
}

describe("SceneManager", () => {
  it("starts with no current scene and an empty stack", () => {
    const scenes = new SceneManager(createFakeAdapter());

    expect(scenes.getCurrentSceneKey()).toBeNull();
    expect(scenes.getStack()).toEqual([]);
  });

  it("goto() starts the given scene and makes it current", () => {
    const adapter = createFakeAdapter();
    const scenes = new SceneManager(adapter);

    scenes.goto("MainMenu");

    expect(adapter.start).toHaveBeenCalledWith("MainMenu", undefined);
    expect(scenes.getCurrentSceneKey()).toBe("MainMenu");
  });

  it("goto() stops every scene on the stack when switching away", () => {
    const adapter = createFakeAdapter();
    const scenes = new SceneManager(adapter);

    scenes.goto("MainMenu");
    scenes.push("Settings");
    scenes.goto("Gameplay");

    expect(adapter.stop).toHaveBeenCalledWith("MainMenu");
    expect(adapter.stop).toHaveBeenCalledWith("Settings");
    expect(scenes.getStack()).toEqual(["Gameplay"]);
  });

  it("push() pauses the current scene and adds the new one on top of the stack", () => {
    const adapter = createFakeAdapter();
    const scenes = new SceneManager(adapter);

    scenes.goto("Gameplay");
    scenes.push("PauseMenu");

    expect(adapter.pause).toHaveBeenCalledWith("Gameplay");
    expect(adapter.start).toHaveBeenCalledWith("PauseMenu", undefined);
    expect(scenes.getStack()).toEqual(["Gameplay", "PauseMenu"]);
  });

  it("push() on an empty stack starts the scene without calling pause", () => {
    const adapter = createFakeAdapter();
    const scenes = new SceneManager(adapter);

    scenes.push("MainMenu");

    expect(adapter.pause).not.toHaveBeenCalled();
    expect(scenes.getCurrentSceneKey()).toBe("MainMenu");
  });

  it("pop() stops the top scene and resumes the one beneath it", () => {
    const adapter = createFakeAdapter();
    const scenes = new SceneManager(adapter);

    scenes.goto("Gameplay");
    scenes.push("PauseMenu");
    scenes.pop();

    expect(adapter.stop).toHaveBeenCalledWith("PauseMenu");
    expect(adapter.resume).toHaveBeenCalledWith("Gameplay");
    expect(scenes.getStack()).toEqual(["Gameplay"]);
  });

  it("pop() does nothing when the stack has one or zero scenes", () => {
    const adapter = createFakeAdapter();
    const scenes = new SceneManager(adapter);

    scenes.pop();
    expect(adapter.stop).not.toHaveBeenCalled();

    scenes.goto("Gameplay");
    scenes.pop();
    expect(adapter.stop).toHaveBeenCalledTimes(0);
    expect(scenes.getStack()).toEqual(["Gameplay"]);
  });

  it("replace() stops the current scene and starts a new one without resuming anything", () => {
    const adapter = createFakeAdapter();
    const scenes = new SceneManager(adapter);

    scenes.goto("Level1");
    scenes.replace("Level2");

    expect(adapter.stop).toHaveBeenCalledWith("Level1");
    expect(adapter.resume).not.toHaveBeenCalled();
    expect(scenes.getStack()).toEqual(["Level2"]);
  });

  it("replace() on an empty stack just starts the scene", () => {
    const adapter = createFakeAdapter();
    const scenes = new SceneManager(adapter);

    scenes.replace("MainMenu");

    expect(adapter.stop).not.toHaveBeenCalled();
    expect(scenes.getStack()).toEqual(["MainMenu"]);
  });

  it("getStack() returns a snapshot that does not mutate internal state when changed", () => {
    const scenes = new SceneManager(createFakeAdapter());

    scenes.goto("MainMenu");
    const snapshot = scenes.getStack() as string[];
    snapshot.push("Injected");

    expect(scenes.getStack()).toEqual(["MainMenu"]);
  });

  it("emits scene:changed with the correct from/to payload on goto()", () => {
    const eventBus = new EventBus();
    const scenes = new SceneManager(createFakeAdapter(), eventBus);
    const handler = vi.fn();

    eventBus.on<SceneChangedEvent>("scene:changed", handler);
    scenes.goto("MainMenu");

    expect(handler).toHaveBeenCalledWith({ from: null, to: "MainMenu" });
  });

  it("emits scene:changed with the correct from/to payload on pop()", () => {
    const eventBus = new EventBus();
    const scenes = new SceneManager(createFakeAdapter(), eventBus);
    const handler = vi.fn();

    scenes.goto("Gameplay");
    scenes.push("PauseMenu");
    eventBus.on<SceneChangedEvent>("scene:changed", handler);
    scenes.pop();

    expect(handler).toHaveBeenCalledWith({ from: "PauseMenu", to: "Gameplay" });
  });

  it("works correctly without an EventBus provided at all", () => {
    const scenes = new SceneManager(createFakeAdapter());

    expect(() => scenes.goto("MainMenu")).not.toThrow();
  });
});
