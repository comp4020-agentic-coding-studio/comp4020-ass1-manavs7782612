import { describe, expect, it } from "vitest";
import { skylineBlendAt } from "./skylineBlend";

// Spans of very different sizes on purpose: a-b (100m) stays under the
// MAX_RAMP_M cap, b-c (900m) and c-d (1200m) both exceed it, so the tests
// exercise both the plain RAMP_FRACTION path and the cap.
const ids = ["a", "b", "c", "d"];
const positions = [0, 100, 1000, 2200];

describe("skylineBlendAt", () => {
  it("is 0 well before a stop's transition zone", () => {
    expect(skylineBlendAt(50, positions, ids)).toEqual({ fromId: "a", toId: "b", frac: 0 });
    expect(skylineBlendAt(500, positions, ids)).toEqual({ fromId: "b", toId: "c", frac: 0 });
  });

  it("ramps monotonically to 1 exactly at the next stop's position", () => {
    expect(skylineBlendAt(80, positions, ids).frac).toBe(0);
    expect(skylineBlendAt(90, positions, ids).frac).toBeCloseTo(0.5);
    expect(skylineBlendAt(100, positions, ids)).toEqual({ fromId: "a", toId: "b", frac: 1 });

    const samples = [850, 900, 950, 1000].map((x) => skylineBlendAt(x, positions, ids).frac);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
    }
    expect(samples[samples.length - 1]).toBe(1);
  });

  it("caps the ramp length at MAX_RAMP_M on spans much longer than RAMP_FRACTION would otherwise give", () => {
    // b-c spans 900m; RAMP_FRACTION*900 = 180 > MAX_RAMP_M (120), so the ramp
    // should start 120m before c (at 880), not 180m before it (at 820).
    expect(skylineBlendAt(820, positions, ids).frac).toBe(0);
    expect(skylineBlendAt(880, positions, ids).frac).toBe(0);
    expect(skylineBlendAt(940, positions, ids).frac).toBeCloseTo(0.5);
  });

  it("clamps to frac 0 before the first stop — never blends past the start", () => {
    expect(skylineBlendAt(-1000, positions, ids)).toEqual({ fromId: "a", toId: "b", frac: 0 });
  });

  it("clamps to frac 1 at or past the last stop — never blends past the end", () => {
    expect(skylineBlendAt(2200, positions, ids)).toEqual({ fromId: "c", toId: "d", frac: 1 });
    expect(skylineBlendAt(5000, positions, ids)).toEqual({ fromId: "c", toId: "d", frac: 1 });
  });
});
