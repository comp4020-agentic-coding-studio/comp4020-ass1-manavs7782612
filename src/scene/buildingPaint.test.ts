import { describe, expect, it } from "vitest";
import { STOPS } from "../data/buildings";
import type { Stop } from "../data/types";
import { computeBuildingPaint, seededRandom } from "./buildingPaint";
import { shapeForStop } from "./silhouette";

// Same width-fraction convention as App.vue: the three Canberra dwellings need
// family-specific ratios to read as a house/townhouse/low block; every
// supertall shares one ratio.
const WIDTH_FRACTIONS: Record<string, number> = {
  house: 2.6,
  townhouse: 1.4,
  apartment: 0.9,
};
const TOWER_WIDTH_FRACTION = 0.16;

function widthForStop(stop: Stop): number {
  return stop.heightM * (WIDTH_FRACTIONS[stop.id] ?? TOWER_WIDTH_FRACTION);
}

const CASES = STOPS.map((stop) => ({
  stop,
  widthM: widthForStop(stop),
  spec: shapeForStop(stop),
}));

describe("seededRandom", () => {
  it("is deterministic for a repeated seed", () => {
    const a = seededRandom("burj-khalifa");
    const b = seededRandom("burj-khalifa");
    const sequenceA = Array.from({ length: 10 }, () => a());
    const sequenceB = Array.from({ length: 10 }, () => b());
    expect(sequenceA).toEqual(sequenceB);
  });

  it("differs across seeds", () => {
    const a = seededRandom("house");
    const b = seededRandom("burj-khalifa");
    expect(a()).not.toBe(b());
  });

  it("stays inside [0, 1)", () => {
    const rand = seededRandom("landmark-81");
    for (let i = 0; i < 200; i++) {
      const value = rand();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("computeBuildingPaint", () => {
  it("is deterministic for a repeated call with the same id", () => {
    const { stop, widthM, spec } = CASES[CASES.length - 1];
    const first = computeBuildingPaint(stop.id, widthM, stop.heightM, stop.floors, spec);
    const second = computeBuildingPaint(stop.id, widthM, stop.heightM, stop.floors, spec);
    expect(second).toEqual(first);
  });

  it.each(CASES.map(({ stop }) => [stop.name, stop] as const))(
    "%s: keeps every band and window coordinate inside [0, widthM] x [0, heightM]",
    (_name, stop) => {
      const { widthM, spec } = CASES.find((c) => c.stop.id === stop.id)!;
      const paint = computeBuildingPaint(stop.id, widthM, stop.heightM, stop.floors, spec);

      for (const band of paint.bands) {
        expect(band.yTop, stop.name).toBeGreaterThanOrEqual(-1e-6);
        expect(band.yBottom, stop.name).toBeLessThanOrEqual(stop.heightM + 1e-6);
        expect(band.yTop, stop.name).toBeLessThanOrEqual(band.yBottom + 1e-6);
      }

      for (const win of paint.windows) {
        expect(win.x, stop.name).toBeGreaterThanOrEqual(-1e-6);
        expect(win.x + win.width, stop.name).toBeLessThanOrEqual(widthM + 1e-6);
        expect(win.y, stop.name).toBeGreaterThanOrEqual(-1e-6);
        expect(win.y, stop.name).toBeLessThanOrEqual(stop.heightM + 1e-6);
      }
    },
  );

  it.each(CASES.map(({ stop }) => [stop.name, stop] as const))("%s: never places a window above bodyTopY", (_name, stop) => {
    const { widthM, spec } = CASES.find((c) => c.stop.id === stop.id)!;
    const bodyTopY = stop.heightM * Math.min(Math.max(spec.crownHeightFrac, 0), 1);
    const paint = computeBuildingPaint(stop.id, widthM, stop.heightM, stop.floors, spec);
    for (const win of paint.windows) {
      expect(win.y, stop.name).toBeGreaterThanOrEqual(bodyTopY - 1e-6);
    }
  });

  it("gives a mast if and only if the stop's crown is a spire", () => {
    const spireCount = CASES.filter(({ spec }) => spec.crown === "spire").length;
    expect(spireCount).toBe(13);

    for (const { stop, widthM, spec } of CASES) {
      const paint = computeBuildingPaint(stop.id, widthM, stop.heightM, stop.floors, spec);
      if (spec.crown === "spire") {
        expect(paint.mast, stop.name).not.toBeNull();
      } else {
        expect(paint.mast, stop.name).toBeNull();
      }
    }
  });

  it.each(CASES.map(({ stop }) => [stop.name, stop] as const))("%s: keeps band and window counts within their clamps", (_name, stop) => {
    const { widthM, spec } = CASES.find((c) => c.stop.id === stop.id)!;
    const paint = computeBuildingPaint(stop.id, widthM, stop.heightM, stop.floors, spec);
    expect(paint.bands.length, stop.name).toBeGreaterThanOrEqual(3);
    expect(paint.bands.length, stop.name).toBeLessThanOrEqual(20);
    expect(paint.windows.length, stop.name).toBeGreaterThanOrEqual(8);
    expect(paint.windows.length, stop.name).toBeLessThanOrEqual(100);
  });

  it("emits a rim path starting with M and no NaN/Infinity", () => {
    for (const { stop, widthM, spec } of CASES) {
      const paint = computeBuildingPaint(stop.id, widthM, stop.heightM, stop.floors, spec);
      expect(paint.rimPath.startsWith("M "), stop.name).toBe(true);
      expect(paint.rimPath, stop.name).not.toMatch(/NaN|Infinity/);
    }
  });
});
