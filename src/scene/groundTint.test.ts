import { describe, expect, it } from "vitest";
import { groundColorAt } from "./groundTint";

const HEX = /^#[0-9a-f]{6}$/;

// 0, both interpolation stops, a few midpoints, and 1.
const SAMPLES = [0, 0.05, 0.175, 0.35, 0.5, 0.65, 0.8, 0.99, 1];

describe("groundColorAt", () => {
  it("returns the leafy Canberra green exactly at the start", () => {
    expect(groundColorAt(0)).toBe("#6b8f5a");
  });

  it("returns the warm Dubai sand exactly at the end", () => {
    expect(groundColorAt(1)).toBe("#d2b183");
  });

  it.each(SAMPLES)("returns a well-formed lowercase hex colour at progress %s", (progress) => {
    expect(groundColorAt(progress)).toMatch(HEX);
  });

  it("clamps below zero rather than extrapolating", () => {
    expect(groundColorAt(-0.5)).toBe(groundColorAt(0));
    expect(groundColorAt(-1000)).toBe(groundColorAt(0));
  });

  it("clamps above one rather than extrapolating", () => {
    expect(groundColorAt(1.7)).toBe(groundColorAt(1));
    expect(groundColorAt(1000)).toBe(groundColorAt(1));
  });

  it("treats NaN as the journey's start rather than emitting a broken colour", () => {
    expect(groundColorAt(Number.NaN)).toBe(groundColorAt(0));
  });

  it("clamps the infinities to the two ends", () => {
    expect(groundColorAt(Number.POSITIVE_INFINITY)).toBe(groundColorAt(1));
    expect(groundColorAt(Number.NEGATIVE_INFINITY)).toBe(groundColorAt(0));
  });

  it("is deterministic: the same progress always gives the same colour", () => {
    for (const progress of SAMPLES) {
      expect(groundColorAt(progress)).toBe(groundColorAt(progress));
    }
  });

  it("warms monotonically: the red channel never cools as the journey goes on", () => {
    const reds = SAMPLES.map((progress) => Number.parseInt(groundColorAt(progress).slice(1, 3), 16));
    for (let i = 1; i < reds.length; i++) {
      expect(reds[i]).toBeGreaterThanOrEqual(reds[i - 1]);
    }
  });
});
