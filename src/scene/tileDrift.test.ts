import { describe, expect, it } from "vitest";
import { wrappedShiftPx } from "./tileDrift";

describe("wrappedShiftPx", () => {
  it("is zero at worldX 0", () => {
    expect(wrappedShiftPx(0, 0.1, 50)).toBe(0);
  });

  it("scales linearly with worldX before it wraps", () => {
    expect(wrappedShiftPx(10, 0.5, 100)).toBe(5);
    expect(wrappedShiftPx(20, 0.5, 100)).toBe(10);
  });

  it("wraps into [0, tilePx) once the drift exceeds one tile", () => {
    expect(wrappedShiftPx(1000, 1, 60)).toBe(40);
  });

  it("wraps negative worldX into the same positive range", () => {
    expect(wrappedShiftPx(-10, 1, 60)).toBe(50);
    expect(wrappedShiftPx(-1000, 1, 60)).toBe(20);
  });

  it("returns 0 for non-finite drift rather than NaN", () => {
    expect(wrappedShiftPx(Number.POSITIVE_INFINITY, 1, 60)).toBe(0);
    expect(wrappedShiftPx(Number.NaN, 1, 60)).toBe(0);
  });

  it("is deterministic: the same inputs always give the same shift", () => {
    expect(wrappedShiftPx(1234, 0.11, 83)).toBe(wrappedShiftPx(1234, 0.11, 83));
  });
});
