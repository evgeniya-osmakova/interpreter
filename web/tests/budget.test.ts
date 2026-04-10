import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYBACK_DELAY_MS, PLAYBACK_STEP_BUDGET } from "../src/runtime/runner/budget";

describe("runtime playback defaults", () => {
  it("uses single-step slices for the visualizer loop", () => {
    expect(PLAYBACK_STEP_BUDGET).toBe(1);
  });

  it("ships with a positive default animation delay", () => {
    expect(DEFAULT_PLAYBACK_DELAY_MS).toBeGreaterThan(0);
  });
});
