import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../events/EventBus";
import { AssetManager } from "./AssetManager";
import type { AssetDescriptor } from "./AssetDescriptor";
import type { AssetLoadCompleteEvent, AssetLoadProgressEvent } from "./IAssetManager";
import type { AssetLoadResult, IAssetLoaderAdapter } from "./IAssetLoaderAdapter";

function createFakeAdapter(options: { loadedKeys?: string[]; failedKeys?: string[] } = {}) {
  const loaded = new Set(options.loadedKeys ?? []);
  const failedKeys = options.failedKeys ?? [];

  return {
    enqueue: vi.fn(),
    start: vi.fn(async (onProgress?: (loaded: number, total: number) => void) => {
      onProgress?.(1, 1);
      const result: AssetLoadResult = { failedKeys };
      return result;
    }),
    isLoaded: vi.fn((key: string) => loaded.has(key))
  } satisfies IAssetLoaderAdapter;
}

const HERO_IMAGE: AssetDescriptor = { key: "hero", type: "image", url: "hero.png" };
const VILLAIN_IMAGE: AssetDescriptor = { key: "villain", type: "image", url: "villain.png" };

describe("AssetManager", () => {
  it("enqueues a queued descriptor with the adapter when load() runs", async () => {
    const adapter = createFakeAdapter();
    const assets = new AssetManager(adapter);

    assets.queue(HERO_IMAGE);
    await assets.load();

    expect(adapter.enqueue).toHaveBeenCalledWith(HERO_IMAGE);
    expect(adapter.start).toHaveBeenCalledOnce();
  });

  it("ignores a duplicate queue() call for a key already queued", async () => {
    const adapter = createFakeAdapter();
    const assets = new AssetManager(adapter);

    assets.queue(HERO_IMAGE);
    assets.queue(HERO_IMAGE);
    await assets.load();

    expect(adapter.enqueue).toHaveBeenCalledTimes(1);
  });

  it("ignores queue() for a key that's already loaded", () => {
    const adapter = createFakeAdapter({ loadedKeys: ["hero"] });
    const assets = new AssetManager(adapter);

    assets.queue(HERO_IMAGE);

    expect(adapter.isLoaded).toHaveBeenCalledWith("hero");
  });

  it("queueMany() queues every descriptor given", async () => {
    const adapter = createFakeAdapter();
    const assets = new AssetManager(adapter);

    assets.queueMany([HERO_IMAGE, VILLAIN_IMAGE]);
    await assets.load();

    expect(adapter.enqueue).toHaveBeenCalledWith(HERO_IMAGE);
    expect(adapter.enqueue).toHaveBeenCalledWith(VILLAIN_IMAGE);
    expect(adapter.enqueue).toHaveBeenCalledTimes(2);
  });

  it("clears the queue after load(), so a second load() with nothing new does not call start() again", async () => {
    const adapter = createFakeAdapter();
    const assets = new AssetManager(adapter);

    assets.queue(HERO_IMAGE);
    await assets.load();
    await assets.load();

    expect(adapter.start).toHaveBeenCalledTimes(1);
  });

  it("resolves immediately without calling start() when the queue is empty", async () => {
    const adapter = createFakeAdapter();
    const assets = new AssetManager(adapter);

    const result = await assets.load();

    expect(adapter.start).not.toHaveBeenCalled();
    expect(result).toEqual({ failedKeys: [] });
  });

  it("emits asset:progress forwarded from the adapter during load()", async () => {
    const eventBus = new EventBus();
    const adapter = createFakeAdapter();
    const assets = new AssetManager(adapter, eventBus);
    const handler = vi.fn();

    eventBus.on<AssetLoadProgressEvent>("asset:progress", handler);
    assets.queue(HERO_IMAGE);
    await assets.load();

    expect(handler).toHaveBeenCalledWith({ loaded: 1, total: 1 });
  });

  it("emits asset:loadComplete with the failed keys reported by the adapter", async () => {
    const eventBus = new EventBus();
    const adapter = createFakeAdapter({ failedKeys: ["villain"] });
    const assets = new AssetManager(adapter, eventBus);
    const handler = vi.fn();

    eventBus.on<AssetLoadCompleteEvent>("asset:loadComplete", handler);
    assets.queue(VILLAIN_IMAGE);
    await assets.load();

    expect(handler).toHaveBeenCalledWith({ failedKeys: ["villain"] });
  });

  it("isLoaded() delegates directly to the adapter", () => {
    const adapter = createFakeAdapter({ loadedKeys: ["hero"] });
    const assets = new AssetManager(adapter);

    expect(assets.isLoaded("hero")).toBe(true);
    expect(assets.isLoaded("villain")).toBe(false);
  });

  it("resolveKey() returns the original key when it's loaded", () => {
    const adapter = createFakeAdapter({ loadedKeys: ["hero"] });
    const assets = new AssetManager(adapter);

    expect(assets.resolveKey("hero")).toBe("hero");
  });

  it("resolveKey() returns the fallback key when the original failed but the fallback is loaded", () => {
    const adapter = createFakeAdapter({ loadedKeys: ["placeholder"] });
    const assets = new AssetManager(adapter);

    assets.registerFallback("hero", "placeholder");

    expect(assets.resolveKey("hero")).toBe("placeholder");
  });

  it("resolveKey() returns the original key when neither it nor its fallback are loaded", () => {
    const adapter = createFakeAdapter();
    const assets = new AssetManager(adapter);

    assets.registerFallback("hero", "placeholder");

    expect(assets.resolveKey("hero")).toBe("hero");
  });

  it("works correctly without an EventBus provided at all", async () => {
    const adapter = createFakeAdapter();
    const assets = new AssetManager(adapter);

    assets.queue(HERO_IMAGE);

    await expect(assets.load()).resolves.not.toThrow();
  });
});
