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

  it("ignores width entirely when viewportWidthPx is omitted, even if widthM is present", () => {
    const wide = [{ heightM: 4.4, widthM: 100 }];
    const withWidth = calibrateScales(wide, 900, 0.78);
    const withoutWidth = calibrateScales([{ heightM: 4.4 }], 900, 0.78);
    expect(withWidth[0]).toBeCloseTo(withoutWidth[0]);
  });

  it("caps scale so a wide, short stop fits maxWidthFraction of a narrow viewport", () => {
    // A squat, wide stop (like the Canberra house) on a phone-width viewport:
    // height-only calibration would make it far wider than the screen.
    const squat = [{ heightM: 4.4, widthM: 11.4 }];
    const scales = calibrateScales(squat, 800, 0.78, 390, 0.76);
    expect(squat[0].widthM! * scales[0]).toBeCloseTo(0.76 * 390);
    // and that's tighter than the height-only scale would have been
    const heightOnlyScale = (0.78 * 800) / squat[0].heightM;
    expect(scales[0]).toBeLessThan(heightOnlyScale);
  });

  it("leaves scale at the height-based value when width isn't the tighter constraint", () => {
    // A tall, narrow stop (like a supertall tower) is never width-limited.
    const tower = [{ heightM: 828, widthM: 132.5 }];
    const scales = calibrateScales(tower, 800, 0.78, 390, 0.76);
    const heightOnlyScale = (0.78 * 800) / tower[0].heightM;
    expect(scales[0]).toBeCloseTo(heightOnlyScale);
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
