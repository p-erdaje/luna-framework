import { describe, expect, it } from "vitest";
import { ConfigManager } from "./ConfigManager";

interface TestConfig extends Record<string, unknown> {
  volume: number;
  playerSpeed: number;
  playerName: string;
}

describe("ConfigManager", () => {
  it("returns a value that was provided in the initial config", () => {
    const config = new ConfigManager<TestConfig>({ volume: 0.8 });

    expect(config.get("volume")).toBe(0.8);
  });

  it("throws when a key is missing and no default is provided", () => {
    const config = new ConfigManager<TestConfig>({});

    expect(() => config.get("playerSpeed")).toThrow(/no value found for key "playerSpeed"/);
  });

  it("returns the provided default when the key is missing", () => {
    const config = new ConfigManager<TestConfig>({});

    expect(config.get("playerSpeed", 150)).toBe(150);
  });

  it("prefers the stored value over the default when the key exists", () => {
    const config = new ConfigManager<TestConfig>({ playerSpeed: 300 });

    expect(config.get("playerSpeed", 150)).toBe(300);
  });

  it("allows set() to add a new value", () => {
    const config = new ConfigManager<TestConfig>({});

    config.set("playerName", "Luna");

    expect(config.get("playerName")).toBe("Luna");
  });

  it("allows set() to overwrite an existing value", () => {
    const config = new ConfigManager<TestConfig>({ volume: 0.5 });

    config.set("volume", 1);

    expect(config.get("volume")).toBe(1);
  });

  it("has() reports whether a key currently holds a value", () => {
    const config = new ConfigManager<TestConfig>({ volume: 0.5 });

    expect(config.has("volume")).toBe(true);
    expect(config.has("playerSpeed")).toBe(false);
  });

  it("merge() shallow-merges a partial config without touching untouched keys", () => {
    const config = new ConfigManager<TestConfig>({ volume: 0.5, playerSpeed: 200 });

    config.merge({ volume: 0.9 });

    expect(config.get("volume")).toBe(0.9);
    expect(config.get("playerSpeed")).toBe(200);
  });

  it("getAll() returns a snapshot that does not mutate internal state when changed", () => {
    const config = new ConfigManager<TestConfig>({ volume: 0.5 });

    const snapshot = config.getAll();
    snapshot.volume = 999;

    expect(config.get("volume")).toBe(0.5);
  });

  it("reset() restores the config to its original constructor values", () => {
    const config = new ConfigManager<TestConfig>({ volume: 0.5, playerSpeed: 200 });

    config.set("volume", 1);
    config.merge({ playerSpeed: 500 });
    config.reset();

    expect(config.get("volume")).toBe(0.5);
    expect(config.get("playerSpeed")).toBe(200);
  });
});
