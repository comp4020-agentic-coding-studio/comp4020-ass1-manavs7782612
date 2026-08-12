import { describe, expect, it } from "vitest";
import { STOPS } from "../data/buildings";
import { type CrownStyle, GENERIC_TOWER, SHAPES, type ShapeSpec, shapeForStop, silhouettePath } from "./silhouette";

// Coordinates are rounded to three decimals in the emitted path, so a clamped
// coordinate can land that far outside its box on paper. That's the tolerance
// here — not float noise, a known rounding step.
const EPSILON = 1e-3;

interface Point {
  x: number;
  y: number;
}

// Enough of a path reader for the `M`/`L`/`Z` commands this module emits: pull
// every number out in document order and pair them up. Each of those commands
// carries either exactly one coordinate pair or none, so a number's position
// in the list is its position on the path.
function coordinates(d: string): Point[] {
  const numbers = (d.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi) ?? []).map(Number);
  expect(numbers.length % 2, `odd coordinate count in "${d}"`).toBe(0);
  const points: Point[] = [];
  for (let i = 0; i < numbers.length; i += 2) points.push({ x: numbers[i], y: numbers[i + 1] });
  return points;
}

function bbox(points: readonly Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

const CASES: Array<[string, ShapeSpec]> = [...Object.entries(SHAPES), ["GENERIC_TOWER", GENERIC_TOWER]];

// Real heights, straight from the dataset, so the geometry is exercised across
// the journey's actual 4.4 m — 828 m range rather than invented numbers. The
// widths are the aspect ratios a caller would plausibly derive: a squat house,
// a slab, a slender supertall.
const ASPECTS = [0.08, 0.25, 2.7];
const SIZES = STOPS.flatMap((stop) =>
  ASPECTS.map((aspect) => ({ heightM: stop.heightM, widthM: stop.heightM * aspect })),
);

describe.each(CASES)("silhouettePath: %s", (name, spec) => {
  it("emits a syntactically valid closed path at every real height", () => {
    for (const { widthM, heightM } of SIZES) {
      const d = silhouettePath(widthM, heightM, spec);
      const where = `${name} at ${widthM}x${heightM}: ${d}`;
      expect(d.startsWith("M "), where).toBe(true);
      expect(d.endsWith(" Z"), where).toBe(true);
      expect(d, where).toMatch(/^M [\d.,-]+(?: L [\d.,-]+)+ Z$/);
      expect(d, where).not.toMatch(/NaN|Infinity/);
      expect(coordinates(d).length, where).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps every coordinate inside the [0, widthM] x [0, heightM] box", () => {
    for (const { widthM, heightM } of SIZES) {
      const d = silhouettePath(widthM, heightM, spec);
      for (const point of coordinates(d)) {
        const where = `${name} at ${widthM}x${heightM}, point ${point.x},${point.y}`;
        expect(point.x, where).toBeGreaterThanOrEqual(-EPSILON);
        expect(point.x, where).toBeLessThanOrEqual(widthM + EPSILON);
        expect(point.y, where).toBeGreaterThanOrEqual(-EPSILON);
        expect(point.y, where).toBeLessThanOrEqual(heightM + EPSILON);
      }
    }
  });

  it("fills the box: full width on the ground, tip at y = 0", () => {
    for (const { widthM, heightM } of SIZES) {
      const box = bbox(coordinates(silhouettePath(widthM, heightM, spec)));
      // The building always stands full width on the ground line and always
      // finishes at the very top of its viewBox, whatever the crown does in
      // between — that's what lets the caller embed it with no scaling.
      expect(box.minX, name).toBeCloseTo(0, 3);
      expect(box.maxX, name).toBeCloseTo(widthM, 3);
      expect(box.minY, name).toBeCloseTo(0, 3);
      expect(box.maxY, name).toBeCloseTo(heightM, 3);
    }
  });
});

describe("height scaling", () => {
  it("grows the bounding box in proportion to heightM", () => {
    for (const [name, spec] of CASES) {
      const short = bbox(coordinates(silhouettePath(30, 100, spec)));
      const tall = bbox(coordinates(silhouettePath(30, 400, spec)));
      expect(short.height, name).toBeCloseTo(100, 2);
      expect(tall.height, name).toBeCloseTo(400, 2);
      expect(tall.height / short.height, name).toBeCloseTo(4, 2);
    }
  });

  it("is independent of widthM: the same height gives the same bounding-box height", () => {
    for (const [name, spec] of CASES) {
      const narrow = bbox(coordinates(silhouettePath(10, 250, spec)));
      const wide = bbox(coordinates(silhouettePath(120, 250, spec)));
      expect(narrow.height, name).toBeCloseTo(wide.height, 3);
    }
  });
});

describe("crown styles", () => {
  const box: ShapeSpec["tiers"] = [{ weight: 1, topWidthFrac: 1 }];
  const PROBES: Array<[CrownStyle, ShapeSpec]> = [
    ["flat", { tiers: box, crown: "flat", crownHeightFrac: 0 }],
    ["gable", { tiers: box, crown: "gable", crownHeightFrac: 0.25 }],
    ["spire", { tiers: [{ weight: 1, topWidthFrac: 0.9 }], crown: "spire", crownHeightFrac: 0.15 }],
    ["pinnacle", { tiers: [{ weight: 1, topWidthFrac: 0.9 }], crown: "pinnacle", crownHeightFrac: 0.2 }],
    ["stacked-pagoda", { tiers: [{ weight: 1, topWidthFrac: 0.85 }], crown: "stacked-pagoda", crownHeightFrac: 0.3 }],
    ["twist-taper", { tiers: [{ weight: 1, topWidthFrac: 0.8 }], crown: "twist-taper", crownHeightFrac: 0.3 }],
  ];

  const WIDTH = 40;
  const HEIGHT = 500;

  it("a flat crown on a full-width tier is exactly the four corners of a box", () => {
    const [, spec] = PROBES[0];
    const points = coordinates(silhouettePath(WIDTH, HEIGHT, spec));
    expect(points).toHaveLength(4);
    expect(points).toEqual([
      { x: 0, y: HEIGHT },
      { x: 0, y: 0 },
      { x: WIDTH, y: 0 },
      { x: WIDTH, y: HEIGHT },
    ]);
  });

  it.each(PROBES.slice(1))("%s adds real geometry above the body, not just a box", (name, spec) => {
    const points = coordinates(silhouettePath(WIDTH, HEIGHT, spec));
    const bodyTopY = HEIGHT * spec.crownHeightFrac;

    // More points than a box has corners, and some of them inset from the
    // sides: that inset is the crown, since the body's walls are all at the
    // extremes of the box.
    expect(points.length, name).toBeGreaterThan(4);
    expect(
      points.filter((p) => p.x > EPSILON && p.x < WIDTH - EPSILON).length,
      `${name} drew nothing inset from the sides`,
    ).toBeGreaterThan(0);

    // At least three distinct heights are involved (ground, body top, tip), so
    // the crown occupies height of its own rather than collapsing onto the
    // body's roofline. An apex crown has vertices only at the eaves and the
    // tip, so the test is that the crown *spans* that height — not that it has
    // a vertex partway up it.
    const distinctY = new Set(points.map((p) => Math.round(p.y * 1000)));
    expect(distinctY.size, name).toBeGreaterThanOrEqual(3);
    expect(points.some((p) => Math.abs(p.y - bodyTopY) < EPSILON), `${name} has no vertex on the body's roofline`).toBe(
      true,
    );
    expect(points.some((p) => p.y < EPSILON), `${name} never reaches the top of the box`).toBe(true);
  });

  it.each([["gable"], ["pinnacle"]] as const)("%s meets at a single apex on the centre line", (name) => {
    const spec = PROBES.find(([style]) => style === name)?.[1];
    expect(spec, `no probe for ${name}`).toBeDefined();
    const points = coordinates(silhouettePath(WIDTH, HEIGHT, spec as ShapeSpec));
    const apexes = points.filter((p) => p.y === 0);
    expect(apexes).toHaveLength(1);
    expect(apexes[0].x).toBeCloseTo(WIDTH / 2, 3);
  });

  it("a spire finishes as a thin flat-tipped mast, far narrower than the shaft", () => {
    const spec = PROBES.find(([style]) => style === "spire")?.[1] as ShapeSpec;
    const points = coordinates(silhouettePath(WIDTH, HEIGHT, spec));
    const tips = points.filter((p) => p.y === 0);
    expect(tips).toHaveLength(2);
    const mastWidth = Math.abs(tips[0].x - tips[1].x);
    expect(mastWidth).toBeGreaterThan(0);
    expect(mastWidth).toBeLessThan(WIDTH * 0.1);
  });

  it("a stacked-pagoda crown steps in and out repeatedly, unlike a plain taper", () => {
    const pagoda = PROBES.find(([style]) => style === "stacked-pagoda")?.[1] as ShapeSpec;
    const pinnacle = PROBES.find(([style]) => style === "pinnacle")?.[1] as ShapeSpec;
    const notched = coordinates(silhouettePath(WIDTH, HEIGHT, pagoda));
    const tapered = coordinates(silhouettePath(WIDTH, HEIGHT, pinnacle));
    expect(notched.length).toBeGreaterThan(tapered.length);
    // A notch is a horizontal move: two consecutive points sharing a y.
    const horizontalMoves = notched.filter((p, i) => i > 0 && Math.abs(p.y - notched[i - 1].y) < EPSILON).length;
    expect(horizontalMoves).toBeGreaterThan(4);
  });

  it("a twist-taper curves instead of tapering in a straight line", () => {
    const spec = PROBES.find(([style]) => style === "twist-taper")?.[1] as ShapeSpec;
    const points = coordinates(silhouettePath(WIDTH, HEIGHT, spec));
    const bodyTopY = HEIGHT * spec.crownHeightFrac;
    const crownLeft = points.filter((p) => p.y < bodyTopY - EPSILON && p.x <= WIDTH / 2);
    expect(crownLeft.length).toBeGreaterThan(4);

    // A straight taper would put every crown edge point on the line from the
    // shoulder to the apex; the bow is the deviation from it.
    const shoulderX = (WIDTH * (1 - 0.8)) / 2;
    const deviation = Math.max(
      ...crownLeft.map((p) => Math.abs(p.x - (shoulderX + (WIDTH / 2 - shoulderX) * (1 - p.y / bodyTopY)))),
    );
    expect(deviation).toBeGreaterThan(WIDTH * 0.01);
  });
});

describe("shapeForStop", () => {
  it("returns the bespoke spec for a building that has one", () => {
    expect(shapeForStop({ id: "burj-khalifa" })).toBe(SHAPES["burj-khalifa"]);
    expect(shapeForStop({ id: "house" })).toBe(SHAPES.house);
  });

  it("falls back to the generic tower for anything else", () => {
    expect(shapeForStop({ id: "some-unknown-id" })).toBe(GENERIC_TOWER);
    expect(shapeForStop({ id: "one-wtc" })).toBe(GENERIC_TOWER);
  });

  it("resolves a spec for all twenty stops", () => {
    for (const stop of STOPS) {
      const spec = shapeForStop(stop);
      expect(spec.tiers.length, stop.id).toBeGreaterThan(0);
      expect(spec.crownHeightFrac, stop.id).toBeGreaterThanOrEqual(0);
      expect(spec.crownHeightFrac, stop.id).toBeLessThan(1);
    }
  });
});

describe("SHAPES", () => {
  it("is keyed by real stop ids — a typo'd key would silently fall back to generic", () => {
    const ids = new Set(STOPS.map((stop) => stop.id));
    for (const key of Object.keys(SHAPES)) {
      expect(ids.has(key), `SHAPES key "${key}" is not a stop id`).toBe(true);
    }
  });

  it("covers the eight buildings a visitor could recognise by outline", () => {
    expect(Object.keys(SHAPES).sort()).toEqual(
      [
        "apartment",
        "burj-khalifa",
        "house",
        "lotte-world-tower",
        "merdeka-118",
        "shanghai-tower",
        "taipei-101",
        "townhouse",
      ].sort(),
    );
  });

  it("gives each bespoke building a path the generic tower wouldn't have drawn", () => {
    for (const [id, spec] of Object.entries(SHAPES)) {
      const stop = STOPS.find((candidate) => candidate.id === id);
      expect(stop, id).toBeDefined();
      const heightM = stop?.heightM ?? 100;
      const widthM = heightM * 0.2;
      expect(silhouettePath(widthM, heightM, spec), id).not.toBe(silhouettePath(widthM, heightM, GENERIC_TOWER));
    }
  });
});
