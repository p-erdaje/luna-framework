import { describe, expect, it, vi } from "vitest";
import type { IAudioSourceAdapter, PlayOptions } from "./IAudioSourceAdapter";
import { AudioManager } from "./AudioManager";

function createFakeAdapter() {
  let nextId = 0;
  return {
    play: vi.fn((_key: string, _options?: PlayOptions) => {
      const id = `instance-${nextId}`;
      nextId += 1;
      return id;
    }),
    stop: vi.fn(),
    stopAll: vi.fn(),
    setInstanceVolume: vi.fn()
  } satisfies IAudioSourceAdapter;
}

describe("AudioManager", () => {
  it("defaults master volume to 1", () => {
    const audio = new AudioManager(createFakeAdapter());

    expect(audio.getMasterVolume()).toBe(1);
  });

  it("defaults an unset category's volume to 1", () => {
    const audio = new AudioManager(createFakeAdapter());

    expect(audio.getCategoryVolume("music")).toBe(1);
  });

  it("plays a sound at full effective volume when everything is at default", () => {
    const adapter = createFakeAdapter();
    const audio = new AudioManager(adapter);

    audio.play("theme", "music");

    expect(adapter.play).toHaveBeenCalledWith("theme", expect.objectContaining({ volume: 1 }));
  });

  it("multiplies master, category, and instance volume together", () => {
    const adapter = createFakeAdapter();
    const audio = new AudioManager(adapter);

    audio.setMasterVolume(0.5);
    audio.setCategoryVolume("music", 0.5);
    audio.play("theme", "music", { volume: 0.5 });

    // 0.5 * 0.5 * 0.5 = 0.125
    expect(adapter.play).toHaveBeenCalledWith("theme", expect.objectContaining({ volume: 0.125 }));
  });

  it("clamps volumes above 1 down to 1", () => {
    const audio = new AudioManager(createFakeAdapter());

    audio.setMasterVolume(2);

    expect(audio.getMasterVolume()).toBe(1);
  });

  it("clamps volumes below 0 up to 0", () => {
    const audio = new AudioManager(createFakeAdapter());

    audio.setMasterVolume(-1);

    expect(audio.getMasterVolume()).toBe(0);
  });

  it("keeps categories independent of each other", () => {
    const adapter = createFakeAdapter();
    const audio = new AudioManager(adapter);

    audio.setCategoryVolume("music", 0.2);
    audio.setCategoryVolume("sfx", 0.9);

    expect(audio.getCategoryVolume("music")).toBe(0.2);
    expect(audio.getCategoryVolume("sfx")).toBe(0.9);
  });

  it("updates the volume of already-playing instances when master volume changes", () => {
    const adapter = createFakeAdapter();
    const audio = new AudioManager(adapter);

    const instanceId = audio.play("theme", "music");
    audio.setMasterVolume(0.5);

    expect(adapter.setInstanceVolume).toHaveBeenCalledWith(instanceId, 0.5);
  });

  it("updates only instances in the affected category when a category volume changes", () => {
    const adapter = createFakeAdapter();
    const audio = new AudioManager(adapter);

    const musicId = audio.play("theme", "music");
    const sfxId = audio.play("explosion", "sfx");
    adapter.setInstanceVolume.mockClear();

    audio.setCategoryVolume("music", 0.3);

    expect(adapter.setInstanceVolume).toHaveBeenCalledWith(musicId, 0.3);
    expect(adapter.setInstanceVolume).not.toHaveBeenCalledWith(sfxId, expect.anything());
  });

  it("sets every active instance to 0 volume when muted", () => {
    const adapter = createFakeAdapter();
    const audio = new AudioManager(adapter);

    const instanceId = audio.play("theme", "music");
    audio.mute();

    expect(adapter.setInstanceVolume).toHaveBeenCalledWith(instanceId, 0);
    expect(audio.isMuted()).toBe(true);
  });

  it("restores the correct effective volume for active instances on unmute", () => {
    const adapter = createFakeAdapter();
    const audio = new AudioManager(adapter);

    audio.setMasterVolume(0.8);
    const instanceId = audio.play("theme", "music");
    audio.mute();
    audio.unmute();

    expect(adapter.setInstanceVolume).toHaveBeenLastCalledWith(instanceId, 0.8);
    expect(audio.isMuted()).toBe(false);
  });

  it("plays new sounds at 0 volume while muted, without changing stored settings", () => {
    const adapter = createFakeAdapter();
    const audio = new AudioManager(adapter);

    audio.setMasterVolume(0.7);
    audio.mute();
    audio.play("theme", "music");

    expect(adapter.play).toHaveBeenCalledWith("theme", expect.objectContaining({ volume: 0 }));
    expect(audio.getMasterVolume()).toBe(0.7);
  });

  it("stop() stops the instance on the adapter and forgets it", () => {
    const adapter = createFakeAdapter();
    const audio = new AudioManager(adapter);

    const instanceId = audio.play("theme", "music");
    audio.stop(instanceId);

    expect(adapter.stop).toHaveBeenCalledWith(instanceId);

    adapter.setInstanceVolume.mockClear();
    audio.setMasterVolume(0.2);
    expect(adapter.setInstanceVolume).not.toHaveBeenCalled();
  });

  it("stopCategory() stops only instances in that category", () => {
    const adapter = createFakeAdapter();
    const audio = new AudioManager(adapter);

    const musicId = audio.play("theme", "music");
    const sfxId = audio.play("explosion", "sfx");

    audio.stopCategory("music");

    expect(adapter.stop).toHaveBeenCalledWith(musicId);
    expect(adapter.stop).not.toHaveBeenCalledWith(sfxId);
  });

  it("stopAll() stops every instance via the adapter and clears tracked state", () => {
    const adapter = createFakeAdapter();
    const audio = new AudioManager(adapter);

    audio.play("theme", "music");
    audio.play("explosion", "sfx");
    audio.stopAll();

    expect(adapter.stopAll).toHaveBeenCalledOnce();

    adapter.setInstanceVolume.mockClear();
    audio.setMasterVolume(0.1);
    expect(adapter.setInstanceVolume).not.toHaveBeenCalled();
  });
});
