import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../../events/EventBus";
import { AchievementSystem } from "./AchievementSystem";
import type { AchievementProgressEvent, AchievementUnlockedEvent } from "./AchievementEvents";

describe("AchievementSystem — event-driven progress", () => {
  it("advances progress by 1 each time the criteria event fires", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "kills", targetCount: 3, criteria: { event: "enemy:killed" } });

    eventBus.emit("enemy:killed");
    eventBus.emit("enemy:killed");

    expect(achievements.getProgress("kills")).toBe(2);
  });

  it("unlocks once progress reaches targetCount", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "kills", targetCount: 2, criteria: { event: "enemy:killed" } });

    eventBus.emit("enemy:killed");
    eventBus.emit("enemy:killed");

    expect(achievements.isUnlocked("kills")).toBe(true);
  });

  it("stops advancing once unlocked, even if the event keeps firing", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "kills", targetCount: 2, criteria: { event: "enemy:killed" } });

    eventBus.emit("enemy:killed");
    eventBus.emit("enemy:killed");
    eventBus.emit("enemy:killed");
    eventBus.emit("enemy:killed");

    expect(achievements.getProgress("kills")).toBe(2);
  });

  it("only counts occurrences that pass the filter", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({
      id: "boss-kills",
      targetCount: 1,
      criteria: {
        event: "enemy:killed",
        filter: (payload) => (payload as { isBoss: boolean }).isBoss
      }
    });

    eventBus.emit("enemy:killed", { isBoss: false });
    expect(achievements.getProgress("boss-kills")).toBe(0);

    eventBus.emit("enemy:killed", { isBoss: true });
    expect(achievements.getProgress("boss-kills")).toBe(1);
  });

  it("tracks two achievements listening to the same event independently", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "first-kill", targetCount: 1, criteria: { event: "enemy:killed" } });
    achievements.register({ id: "ten-kills", targetCount: 10, criteria: { event: "enemy:killed" } });

    eventBus.emit("enemy:killed");

    expect(achievements.isUnlocked("first-kill")).toBe(true);
    expect(achievements.getProgress("ten-kills")).toBe(1);
  });
});

describe("AchievementSystem — manual progress", () => {
  it("advances via reportProgress() for achievements with no event criteria", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "level-10", targetCount: 1 });

    achievements.reportProgress("level-10");

    expect(achievements.isUnlocked("level-10")).toBe(true);
  });

  it("supports advancing by a custom amount", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "gold-collector", targetCount: 100 });

    achievements.reportProgress("gold-collector", 30);
    achievements.reportProgress("gold-collector", 25);

    expect(achievements.getProgress("gold-collector")).toBe(55);
  });

  it("clamps progress at targetCount even when amount overshoots", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "gold-collector", targetCount: 100 });

    achievements.reportProgress("gold-collector", 9999);

    expect(achievements.getProgress("gold-collector")).toBe(100);
  });

  it("no-ops for an unregistered id", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);

    expect(() => achievements.reportProgress("nonexistent")).not.toThrow();
    expect(achievements.getProgress("nonexistent")).toBe(0);
  });

  it("ignores a zero or negative amount", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "level-10", targetCount: 5 });

    achievements.reportProgress("level-10", 0);
    achievements.reportProgress("level-10", -3);

    expect(achievements.getProgress("level-10")).toBe(0);
  });

  it("does nothing further once already unlocked", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "level-10", targetCount: 5 });
    achievements.reportProgress("level-10", 5);

    const handler = vi.fn();
    eventBus.on<AchievementProgressEvent>("achievement:progress", handler);
    achievements.reportProgress("level-10", 1);

    expect(handler).not.toHaveBeenCalled();
    expect(achievements.getProgress("level-10")).toBe(5);
  });
});

describe("AchievementSystem — events", () => {
  it("emits achievement:progress on every advancing call", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "kills", targetCount: 5 });
    const handler = vi.fn();

    eventBus.on<AchievementProgressEvent>("achievement:progress", handler);
    achievements.reportProgress("kills", 2);

    expect(handler).toHaveBeenCalledWith({ achievementId: "kills", progress: 2, targetCount: 5 });
  });

  it("emits achievement:unlocked exactly once, on the call that reaches targetCount", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "kills", targetCount: 3 });
    const handler = vi.fn();

    eventBus.on<AchievementUnlockedEvent>("achievement:unlocked", handler);
    achievements.reportProgress("kills", 1);
    achievements.reportProgress("kills", 1);
    achievements.reportProgress("kills", 1);
    achievements.reportProgress("kills", 1);

    expect(handler).toHaveBeenCalledWith({ achievementId: "kills" });
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe("AchievementSystem — queries", () => {
  it("getProgress() returns 0 for an unregistered id", () => {
    const achievements = new AchievementSystem(new EventBus());

    expect(achievements.getProgress("nonexistent")).toBe(0);
  });

  it("isUnlocked() returns false for an unregistered id", () => {
    const achievements = new AchievementSystem(new EventBus());

    expect(achievements.isUnlocked("nonexistent")).toBe(false);
  });

  it("getState() returns undefined for an unregistered id", () => {
    const achievements = new AchievementSystem(new EventBus());

    expect(achievements.getState("nonexistent")).toBeUndefined();
  });

  it("getState() returns the current progress/unlocked snapshot", () => {
    const achievements = new AchievementSystem(new EventBus());
    achievements.register({ id: "kills", targetCount: 5 });
    achievements.reportProgress("kills", 2);

    expect(achievements.getState("kills")).toEqual({ progress: 2, unlocked: false });
  });

  it("getUnlockedIds() lists only achievements that have unlocked", () => {
    const achievements = new AchievementSystem(new EventBus());
    achievements.register({ id: "a", targetCount: 1 });
    achievements.register({ id: "b", targetCount: 1 });
    achievements.register({ id: "c", targetCount: 5 });
    achievements.reportProgress("a", 1);
    achievements.reportProgress("b", 1);
    achievements.reportProgress("c", 1);

    expect(achievements.getUnlockedIds().sort()).toEqual(["a", "b"]);
  });
});

describe("AchievementSystem — register/unregister", () => {
  it("unregister() stops an event-driven achievement from advancing further", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "kills", targetCount: 5, criteria: { event: "enemy:killed" } });

    achievements.unregister("kills");
    eventBus.emit("enemy:killed");

    expect(achievements.getProgress("kills")).toBe(0);
  });

  it("unregister() does not throw for an id that was never registered", () => {
    const achievements = new AchievementSystem(new EventBus());

    expect(() => achievements.unregister("nonexistent")).not.toThrow();
  });

  it("re-registering the same id resets progress and does not double-count events", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "kills", targetCount: 5, criteria: { event: "enemy:killed" } });
    achievements.reportProgress("kills", 3);

    achievements.register({ id: "kills", targetCount: 5, criteria: { event: "enemy:killed" } });
    eventBus.emit("enemy:killed");

    expect(achievements.getProgress("kills")).toBe(1);
  });
});

describe("AchievementSystem — serialize/restore", () => {
  it("serialize() returns a snapshot of every registered achievement", () => {
    const achievements = new AchievementSystem(new EventBus());
    achievements.register({ id: "a", targetCount: 5 });
    achievements.register({ id: "b", targetCount: 1 });
    achievements.reportProgress("a", 2);
    achievements.reportProgress("b", 1);

    expect(achievements.serialize()).toEqual({
      a: { progress: 2, unlocked: false },
      b: { progress: 1, unlocked: true }
    });
  });

  it("restore() rehydrates progress and unlocked state for matching ids", () => {
    const achievements = new AchievementSystem(new EventBus());
    achievements.register({ id: "a", targetCount: 5 });

    achievements.restore({ a: { progress: 3, unlocked: false } });

    expect(achievements.getProgress("a")).toBe(3);
  });

  it("restore() ignores ids that aren't currently registered", () => {
    const achievements = new AchievementSystem(new EventBus());
    achievements.register({ id: "a", targetCount: 5 });

    expect(() => achievements.restore({ ghost: { progress: 99, unlocked: true } })).not.toThrow();
    expect(achievements.getState("ghost")).toBeUndefined();
  });

  it("restore() honors a previously-unlocked achievement, preventing further unlock events", () => {
    const eventBus = new EventBus();
    const achievements = new AchievementSystem(eventBus);
    achievements.register({ id: "a", targetCount: 5 });
    achievements.restore({ a: { progress: 5, unlocked: true } });
    const handler = vi.fn();

    eventBus.on<AchievementUnlockedEvent>("achievement:unlocked", handler);
    achievements.reportProgress("a", 1);

    expect(handler).not.toHaveBeenCalled();
    expect(achievements.isUnlocked("a")).toBe(true);
  });
});
