import { describe, expect, it, vi } from "vitest";
import { AssetManager } from "../assets/AssetManager";
import type { AssetLoadResult, IAssetLoaderAdapter } from "../assets/IAssetLoaderAdapter";
import { AudioManager } from "../audio/AudioManager";
import type { IAudioSourceAdapter } from "../audio/IAudioSourceAdapter";
import { ConfigManager } from "../config/ConfigManager";
import { EventBus } from "../events/EventBus";
import { InputManager } from "../input/InputManager";
import type { IInputSourceAdapter } from "../input/IInputSourceAdapter";
import type { IHttpAdapter } from "../network/IHttpAdapter";
import type { IWebSocketAdapter, IWebSocketConnection } from "../network/IWebSocketAdapter";
import { NetworkManager } from "../network/NetworkManager";
import { SaveManager } from "../save/SaveManager";
import type { IStorageAdapter } from "../save/IStorageAdapter";
import type { IPhaserSceneManagerAdapter } from "../scene/IPhaserSceneManagerAdapter";
import { SceneManager } from "../scene/SceneManager";
import { TimeManager } from "../time/TimeManager";
import { UIBridgeStore } from "../ui-bridge/UIBridgeStore";
import { Game } from "./Game";
import type { GameManagers } from "./IGame";

// Each fake below satisfies the same adapter interface used in that
// manager's own spec file — Game.spec.ts wires real managers to fake
// adapters rather than mocking the managers themselves, so this
// exercises the actual orchestration logic end to end.

function createFakeSceneAdapter(): IPhaserSceneManagerAdapter {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    sleep: vi.fn(),
    wake: vi.fn(),
    isActive: vi.fn(() => false),
    isSleeping: vi.fn(() => false)
  };
}

function createFakeInputAdapter(): IInputSourceAdapter {
  return { isDown: vi.fn(() => false) };
}

function createFakeStorageAdapter(): IStorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    getAllKeys: vi.fn(async () => Array.from(store.keys()))
  };
}

function createFakeAssetLoaderAdapter(): IAssetLoaderAdapter {
  return {
    enqueue: vi.fn(),
    start: vi.fn(async () => ({ failedKeys: [] }) satisfies AssetLoadResult),
    isLoaded: vi.fn(() => false)
  };
}

function createFakeAudioAdapter(): IAudioSourceAdapter {
  return {
    play: vi.fn(() => "instance-0"),
    stop: vi.fn(),
    stopAll: vi.fn(),
    setInstanceVolume: vi.fn()
  };
}

function createFakeHttpAdapter(): IHttpAdapter {
  return { request: vi.fn(async () => ({ status: 200, ok: true, data: {} })) };
}

function createFakeSocketAdapter(): IWebSocketAdapter {
  const connection: IWebSocketConnection = {
    send: vi.fn(),
    close: vi.fn(),
    onOpen: null,
    onMessage: null,
    onClose: null,
    onError: null
  };
  return { connect: vi.fn(() => connection) };
}

/** Builds a fresh set of real managers, each wired to a fresh fake adapter. */
function createRealManagers(): GameManagers {
  return {
    events: new EventBus(),
    config: new ConfigManager(),
    time: new TimeManager(),
    scenes: new SceneManager(createFakeSceneAdapter()),
    input: new InputManager(createFakeInputAdapter()),
    save: new SaveManager(createFakeStorageAdapter()),
    assets: new AssetManager(createFakeAssetLoaderAdapter()),
    audio: new AudioManager(createFakeAudioAdapter()),
    ui: new UIBridgeStore(),
    network: new NetworkManager(createFakeHttpAdapter(), createFakeSocketAdapter())
  };
}

describe("Game", () => {
  it("exposes every manager it was constructed with", () => {
    const managers = createRealManagers();
    const game = new Game(managers);

    expect(game.events).toBe(managers.events);
    expect(game.config).toBe(managers.config);
    expect(game.time).toBe(managers.time);
    expect(game.scenes).toBe(managers.scenes);
    expect(game.input).toBe(managers.input);
    expect(game.save).toBe(managers.save);
    expect(game.assets).toBe(managers.assets);
    expect(game.audio).toBe(managers.audio);
    expect(game.ui).toBe(managers.ui);
    expect(game.network).toBe(managers.network);
  });

  it("update() advances the time manager with the given timestamp", () => {
    const managers = createRealManagers();
    const game = new Game(managers);
    const updateSpy = vi.spyOn(managers.time, "update");

    game.update(1000);

    expect(updateSpy).toHaveBeenCalledWith(1000);
  });

  it("update() polls the input manager for justPressed/justReleased state", () => {
    const managers = createRealManagers();
    const game = new Game(managers);
    const updateSpy = vi.spyOn(managers.input, "update");

    game.update(1000);

    expect(updateSpy).toHaveBeenCalledOnce();
  });

  it("update() actually advances elapsed time, proving real managers are wired correctly", () => {
    const managers = createRealManagers();
    const game = new Game(managers);

    game.update(0);
    game.update(500);

    expect(managers.time.elapsedMs).toBeGreaterThan(0);
  });

  it("destroy() stops all audio", () => {
    const managers = createRealManagers();
    const game = new Game(managers);
    const stopAllSpy = vi.spyOn(managers.audio, "stopAll");

    game.destroy();

    expect(stopAllSpy).toHaveBeenCalledOnce();
  });

  it("destroy() disconnects the network socket", () => {
    const managers = createRealManagers();
    const game = new Game(managers);
    const disconnectSpy = vi.spyOn(managers.network, "disconnectSocket");

    game.destroy();

    expect(disconnectSpy).toHaveBeenCalledOnce();
  });

  it("destroy() clears every EventBus subscription", () => {
    const managers = createRealManagers();
    const game = new Game(managers);
    const handler = vi.fn();

    managers.events.on("player:jump", handler);
    game.destroy();
    managers.events.emit("player:jump");

    expect(handler).not.toHaveBeenCalled();
  });

  it("destroy() clears every UIBridgeStore subscription", () => {
    const managers = createRealManagers();
    const game = new Game(managers);
    const handler = vi.fn();

    managers.ui.subscribe("health", handler);
    game.destroy();
    managers.ui.set("health", 100);

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not throw when destroy() is called on a freshly constructed game with nothing active", () => {
    const game = new Game(createRealManagers());

    expect(() => game.destroy()).not.toThrow();
  });
});
