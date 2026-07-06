import { describe, expect, it, vi } from "vitest";
import { SaveManager } from "./SaveManager";
import type { IStorageAdapter } from "./IStorageAdapter";

function createFakeAdapter() {
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
  } satisfies IStorageAdapter;
}

interface TestSaveData {
  level: number;
  playerName: string;
}

describe("SaveManager", () => {
  it("returns null when loading a slot that was never saved", async () => {
    const saves = new SaveManager(createFakeAdapter());

    const result = await saves.load<TestSaveData>("slot1");

    expect(result).toBeNull();
  });

  it("round-trips saved data back through load()", async () => {
    const saves = new SaveManager(createFakeAdapter());
    const data: TestSaveData = { level: 5, playerName: "Luna" };

    await saves.save("slot1", data);
    const result = await saves.load<TestSaveData>("slot1");

    expect(result).toEqual(data);
  });

  it("overwrites an existing save for the same slot", async () => {
    const saves = new SaveManager(createFakeAdapter());

    await saves.save("slot1", { level: 1, playerName: "A" });
    await saves.save("slot1", { level: 2, playerName: "B" });
    const result = await saves.load<TestSaveData>("slot1");

    expect(result).toEqual({ level: 2, playerName: "B" });
  });

  it("keeps different slots independent of each other", async () => {
    const saves = new SaveManager(createFakeAdapter());

    await saves.save("slot1", { level: 1, playerName: "A" });
    await saves.save("slot2", { level: 9, playerName: "B" });

    expect(await saves.load<TestSaveData>("slot1")).toEqual({ level: 1, playerName: "A" });
    expect(await saves.load<TestSaveData>("slot2")).toEqual({ level: 9, playerName: "B" });
  });

  it("returns null instead of throwing when stored data is corrupted", async () => {
    const adapter = createFakeAdapter();
    const saves = new SaveManager(adapter);

    await adapter.setItem("luna:save:slot1", "{not valid json");
    const result = await saves.load<TestSaveData>("slot1");

    expect(result).toBeNull();
  });

  it("hasSave() reports true after saving and false before", async () => {
    const saves = new SaveManager(createFakeAdapter());

    expect(await saves.hasSave("slot1")).toBe(false);

    await saves.save("slot1", { level: 1, playerName: "A" });

    expect(await saves.hasSave("slot1")).toBe(true);
  });

  it("deleteSave() removes the save so subsequent load() returns null", async () => {
    const saves = new SaveManager(createFakeAdapter());

    await saves.save("slot1", { level: 1, playerName: "A" });
    await saves.deleteSave("slot1");

    expect(await saves.load("slot1")).toBeNull();
    expect(await saves.hasSave("slot1")).toBe(false);
  });

  it("deleteSave() does not throw for a slot that was never saved", async () => {
    const saves = new SaveManager(createFakeAdapter());

    await expect(saves.deleteSave("neverSaved")).resolves.not.toThrow();
  });

  it("listSaveSlots() returns only slot names, without the key prefix", async () => {
    const saves = new SaveManager(createFakeAdapter());

    await saves.save("slot1", { level: 1, playerName: "A" });
    await saves.save("autosave", { level: 2, playerName: "B" });

    const slots = await saves.listSaveSlots();

    expect(slots.sort()).toEqual(["autosave", "slot1"]);
  });

  it("listSaveSlots() ignores keys that don't belong to this SaveManager's prefix", async () => {
    const adapter = createFakeAdapter();
    const saves = new SaveManager(adapter);

    await saves.save("slot1", { level: 1, playerName: "A" });
    await adapter.setItem("some-other-library:setting", "value");

    const slots = await saves.listSaveSlots();

    expect(slots).toEqual(["slot1"]);
  });

  it("supports a custom key prefix for namespacing", async () => {
    const adapter = createFakeAdapter();
    const saves = new SaveManager(adapter, "myGame:");

    await saves.save("slot1", { level: 1, playerName: "A" });

    expect(await adapter.getItem("myGame:slot1")).not.toBeNull();
    expect(await saves.listSaveSlots()).toEqual(["slot1"]);
  });

  it("round-trips nested objects and arrays, not just flat data", async () => {
    const saves = new SaveManager(createFakeAdapter());
    const complexData = {
      level: 3,
      inventory: ["sword", "shield"],
      stats: { hp: 100, mp: 50 }
    };

    await saves.save("slot1", complexData);
    const result = await saves.load("slot1");

    expect(result).toEqual(complexData);
  });
});
