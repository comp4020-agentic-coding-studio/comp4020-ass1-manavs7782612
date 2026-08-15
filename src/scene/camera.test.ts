import { describe, expect, it } from "vitest";
import {
  calibrateScales,
  cameraAtWorldX,
  layoutStops,
  scrollLeftFromWorldX,
  totalWorldDistance,
  worldXFromScrollLeft,
} from "./camera";

const STOPS = [{ heightM: 4.4 }, { heightM: 10.6 }, { heightM: 32.8 }, { heightM: 828 }];

describe("layoutStops", () => {
  it("starts at zero", () => {
    expect(layoutStops(STOPS, 3)[0]).toBe(0);
  });

  it("spaces each pair by spacingFactor times the square root of the taller of the two", () => {
    const positions = layoutStops(STOPS, 3);
    for (let i = 1; i < STOPS.length; i++) {
      const expectedGap = 3 * Math.sqrt(Math.max(STOPS[i].heightM, STOPS[i - 1].heightM));
      expect(positions[i] - positions[i - 1]).toBeCloseTo(expectedGap);
    }
  });

  it("is strictly increasing", () => {
    const positions = layoutStops(STOPS, 3);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });
});

describe("calibrateScales", () => {
  it("gives each stop the scale that fills fillFraction of the viewport with its own height", () => {
    const scales = calibrateScales(STOPS, 900, 0.78);
    STOPS.forEach((stop, i) => {
      expect(stop.heightM * scales[i]).toBeCloseTo(0.78 * 900);
    });
  });

  it("shrinks scale as height grows", () => {
    const scales = calibrateScales(STOPS, 900, 0.78);
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeLessThan(scales[i - 1]);
    }
  });
});

describe("cameraAtWorldX", () => {
  const positions = layoutStops(STOPS, 3);
  const scales = calibrateScales(STOPS, 900, 0.78);

  it("returns exactly the calibrated scale at each stop's own position", () => {
    positions.forEach((x, i) => {
      expect(cameraAtWorldX(x, positions, scales).scale).toBeCloseTo(scales[i]);
    });
  });

  it("interpolates logarithmically: the midpoint scale is the geometric mean", () => {
    const mid = (positions[0] + positions[1]) / 2;
    const frame = cameraAtWorldX(mid, positions, scales);
    expect(frame.scale).toBeCloseTo(Math.sqrt(scales[0] * scales[1]));
  });

  it("changes scale by a constant ratio per metre across a span", () => {
    const [start, end] = [positions[2], positions[3]];
    const quarter = start + (end - start) * 0.25;
    const half = start + (end - start) * 0.5;
    const ratioA = cameraAtWorldX(quarter, positions, scales).scale / cameraAtWorldX(start, positions, scales).scale;
    const ratioB = cameraAtWorldX(half, positions, scales).scale / cameraAtWorldX(quarter, positions, scales).scale;
    expect(ratioB).toBeCloseTo(ratioA);
  });

  it("clamps before the first stop and after the last", () => {
    expect(cameraAtWorldX(-1000, positions, scales)).toEqual(cameraAtWorldX(0, positions, scales));
    const last = positions[positions.length - 1];
    expect(cameraAtWorldX(last + 1000, positions, scales)).toEqual(cameraAtWorldX(last, positions, scales));
  });

  it("carries worldX through as camera.x, clamped to range", () => {
    const mid = (positions[1] + positions[2]) / 2;
    expect(cameraAtWorldX(mid, positions, scales).x).toBeCloseTo(mid);
  });
});

describe("totalWorldDistance", () => {
  it("is the span from first to last stop", () => {
    const positions = layoutStops(STOPS, 3);
    expect(totalWorldDistance(positions)).toBeCloseTo(positions[positions.length - 1] - positions[0]);
  });
});

describe("scroll <-> world round-trip", () => {
  it("worldXFromScrollLeft inverts scrollLeftFromWorldX", () => {
    const origin = 12.5;
    for (const worldX of [origin, origin + 100, origin + 2500.75]) {
      const scrollLeft = scrollLeftFromWorldX(worldX, origin);
      expect(worldXFromScrollLeft(scrollLeft, origin)).toBeCloseTo(worldX);
    }
  });

  it("scrollLeft is zero exactly at the origin", () => {
    expect(scrollLeftFromWorldX(42, 42)).toBe(0);
  });
});
