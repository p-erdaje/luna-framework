import { describe, expect, it } from "vitest";
import { TimeManager } from "./TimeManager";

describe("TimeManager", () => {
  it("has zero delta on the very first update() call", () => {
    const time = new TimeManager();

    time.update(1000);

    expect(time.deltaMs).toBe(0);
  });

  it("computes deltaMs as the difference between consecutive timestamps", () => {
    const time = new TimeManager();

    time.update(1000);
    time.update(1016);

    expect(time.deltaMs).toBe(16);
  });

  it("computes deltaSeconds as deltaMs divided by 1000", () => {
    const time = new TimeManager(1000);

    time.update(0);
    time.update(500);

    expect(time.deltaSeconds).toBe(0.5);
  });

  it("accumulates elapsedMs across multiple update() calls", () => {
    const time = new TimeManager();

    time.update(0);
    time.update(16);
    time.update(32);

    expect(time.elapsedMs).toBe(32);
  });

  it("estimates fps from the current delta", () => {
    const time = new TimeManager();

    time.update(0);
    time.update(20);

    expect(time.fps).toBe(50);
  });

  it("reports 0 fps before any delta has been recorded", () => {
    const time = new TimeManager();

    expect(time.fps).toBe(0);
  });

  it("clamps deltaMs to maxDeltaMs when the gap between frames is too large", () => {
    const time = new TimeManager(100);

    time.update(0);
    time.update(5000);

    expect(time.deltaMs).toBe(100);
  });

  it("clamps a negative raw delta (clock moving backward) to zero", () => {
    const time = new TimeManager();

    time.update(1000);
    time.update(500);

    expect(time.deltaMs).toBe(0);
  });

  it("scales delta by timeScale for slow motion", () => {
    const time = new TimeManager();
    time.timeScale = 0.5;

    time.update(0);
    time.update(20);

    expect(time.deltaMs).toBe(10);
  });

  it("pause() zeroes out delta and marks isPaused true", () => {
    const time = new TimeManager();

    time.update(0);
    time.pause();
    time.update(20);

    expect(time.isPaused).toBe(true);
    expect(time.deltaMs).toBe(0);
  });

  it("resume() restores the timeScale that was active before pause()", () => {
    const time = new TimeManager();
    time.timeScale = 0.5;

    time.pause();
    time.resume();

    expect(time.timeScale).toBe(0.5);
    expect(time.isPaused).toBe(false);
  });

  it("reset() clears delta, elapsed, and timeScale back to initial values", () => {
    const time = new TimeManager();

    time.update(0);
    time.update(100);
    time.timeScale = 0.5;
    time.reset();

    expect(time.deltaMs).toBe(0);
    expect(time.elapsedMs).toBe(0);
    expect(time.timeScale).toBe(1);
  });

  it("treats the next update() after reset() as a first frame again", () => {
    const time = new TimeManager();

    time.update(0);
    time.update(100);
    time.reset();
    time.update(5000);

    expect(time.deltaMs).toBe(0);
  });
});
