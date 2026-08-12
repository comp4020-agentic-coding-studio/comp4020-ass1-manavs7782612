// Every building on the journey is drawn as a hand-authored parametric
// silhouette rather than a photograph: no licensing question, no runtime
// request (harness rule 4), crisp at every camera scale, and animatable in
// CSS. A shape spec plus the real height in metres is the whole input.
//
// Paths come out in **metres**, y-down, origin top-left: x spans [0, widthM]
// and y spans [0 (the roof tip) .. heightM (the ground)]. A caller can drop
// the string straight into `<svg viewBox="0 0 {widthM} {heightM}">` and do no
// scaling of its own, which keeps the camera's px-per-metre the single place
// the world's size is decided.
//
// Framework-agnostic on purpose — no Vue, no DOM, no side effects — so the
// geometry is testable as plain arithmetic.

/** How a building finishes at the top. The one feature that makes a supertall recognisable in elevation. */
export type CrownStyle = "flat" | "spire" | "pinnacle" | "stacked-pagoda" | "twist-taper" | "gable";

export interface Tier {
  /** This tier's share of the body height, as a weight relative to the other tiers (normalized internally, not a fraction). */
  weight: number;
  /** Width of the top of this tier, as a fraction of the full building width (0..1). The very bottom of the first tier is always full width (1). */
  topWidthFrac: number;
}

export interface ShapeSpec {
  /** Walked bottom-to-top: each tier is a wall at its entry width, then a horizontal step in (or out) to `topWidthFrac` — the stepped-setback profile of a real tower. */
  tiers: Tier[];
  crown: CrownStyle;
  /** Fraction of TOTAL `heightM` given to the crown, sitting on top of the tiers' combined height. */
  crownHeightFrac: number;
}

/** One horizontal slice of the profile: the silhouette's half-width at a given y, mirrored about the centre line. */
interface Level {
  y: number;
  widthFrac: number;
}

/** A spire's mast, as a fraction of building width — thin enough to read as an antenna at any zoom. */
const MAST_WIDTH_FRAC = 0.03;

/** Share of a spire's crown height spent narrowing from the shoulders to the mast; the rest is the mast itself. */
const SPIRE_TAPER_SHARE = 0.4;

const PAGODA_MODULES = 4;
/** Top slice of a pagoda crown that is mast rather than stacked module. */
const PAGODA_MAST_SHARE = 0.15;
/** Slice of each pagoda module spent on the notch between it and the next. */
const PAGODA_NOTCH_SHARE = 0.15;
/** How much a pagoda module narrows over its own height, how far the notch cuts in, and how far the flange steps back out. */
const PAGODA_MODULE_TAPER = 0.92;
const PAGODA_NOTCH_INSET = 0.78;
const PAGODA_FLANGE = 0.96;

/** A twist-taper is a curve, so it needs sampling; twelve segments is smooth at full-screen zoom and still a short `d`. */
const TWIST_SAMPLES = 12;
const TWIST_RIPPLES = 2;
const TWIST_AMPLITUDE = 0.1;

/**
 * Coordinates are clamped into the `[0, max]` box on the way out, and a
 * non-finite value becomes 0 rather than propagating. A `NaN` in a `d`
 * attribute silently renders nothing at all, which is much harder to notice
 * than a building drawn a hair short.
 */
function clampTo(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), max);
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;
}

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Three decimals is far inside a pixel at every scale the camera reaches, and keeps the `d` short enough to read in devtools. */
function fmt(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

/**
 * Appends a level unless it repeats the one below it. A tier whose
 * `topWidthFrac` is 1 asks for a setback of zero, and a crown that starts
 * where the body ends asks for a step of zero height; both would otherwise
 * emit duplicate points, which is how a "plain flat box" ends up with eight
 * corners instead of four.
 */
function pushLevel(levels: Level[], y: number, widthFrac: number): void {
  const previous = levels[levels.length - 1];
  if (previous && Math.abs(previous.y - y) < 1e-9 && Math.abs(previous.widthFrac - widthFrac) < 1e-9) return;
  levels.push({ y, widthFrac });
}

/**
 * Adds the crown's levels on top of the body, walking from `bodyTopY` (where
 * the last tier finished, at `widthFrac`) up to y = 0. Only the crown knows
 * how a building ends, so this is the only place a `CrownStyle` is read.
 */
function addCrown(levels: Level[], crown: CrownStyle, bodyTopY: number, widthFrac: number): void {
  switch (crown) {
    case "flat":
      // A flat roof *is* the path's closing edge across the top, so with the
      // intended `crownHeightFrac: 0` there is nothing to add (this level
      // repeats the last tier's and gets dropped). If a caller does hand a
      // flat crown some height, carry the width straight up rather than
      // inventing a shape for it.
      pushLevel(levels, 0, widthFrac);
      break;

    case "spire": {
      // Shoulders narrowing into an antenna: taper over the lower part of the
      // crown, then a constant thin mast. Never wider than the shoulders it
      // grows out of, however small the tower's own setback was.
      const mast = Math.min(MAST_WIDTH_FRAC, widthFrac);
      pushLevel(levels, bodyTopY * (1 - SPIRE_TAPER_SHARE), mast);
      pushLevel(levels, 0, mast);
      break;
    }

    case "pinnacle":
    case "gable":
      // One straight taper from the last tier's width to a single apex on the
      // centre line. Identical geometry, two intents: a crowning cone at
      // skyscraper proportions, a pitched roof at house proportions — what
      // separates them is the spec they arrive in, not the maths.
      pushLevel(levels, 0, 0);
      break;

    case "stacked-pagoda": {
      // Taipei 101's stacked modules: each a shallow trapezoid, each parted
      // from the next by a notch (step in, brief vertical, step back out) so
      // the flanges catch the light, and the whole stack narrowing as it
      // climbs to a short mast.
      const modulesTopY = bodyTopY * PAGODA_MAST_SHARE;
      const moduleHeight = (bodyTopY - modulesTopY) / PAGODA_MODULES;
      let moduleWidth = widthFrac;
      for (let i = 0; i < PAGODA_MODULES; i++) {
        const moduleTopY = bodyTopY - (i + 1) * moduleHeight;
        const notchY = moduleTopY + moduleHeight * PAGODA_NOTCH_SHARE;
        const shoulder = moduleWidth * PAGODA_MODULE_TAPER;
        const notch = shoulder * PAGODA_NOTCH_INSET;
        pushLevel(levels, notchY, shoulder);
        pushLevel(levels, notchY, notch);
        pushLevel(levels, moduleTopY, notch);
        moduleWidth = shoulder * PAGODA_FLANGE;
        pushLevel(levels, moduleTopY, moduleWidth);
      }
      const mast = Math.min(MAST_WIDTH_FRAC, moduleWidth);
      pushLevel(levels, modulesTopY, mast);
      pushLevel(levels, 0, mast);
      break;
    }

    case "twist-taper": {
      // Shanghai Tower's helix has no honest 2D profile; what reads as the
      // twist in elevation is that the edges *curve* rather than running
      // straight to the tip. A sine bow on the width, fading out towards the
      // top, gets that — and because the envelope reaches zero at t = 1 the
      // apex is still a clean point.
      for (let i = 1; i <= TWIST_SAMPLES; i++) {
        const t = i / TWIST_SAMPLES;
        const taper = widthFrac * (1 - t);
        const bow = TWIST_AMPLITUDE * widthFrac * Math.sin(Math.PI * TWIST_RIPPLES * t) * (1 - t);
        pushLevel(levels, bodyTopY * (1 - t), Math.max(taper + bow, 0));
      }
      break;
    }
  }
}

/**
 * Mirrors the profile about the centre line into a closed polygon: up the left
 * edge from the ground, across the top, back down the right edge, `Z`. Where
 * the profile comes to a point (a pinnacle, a gable, a twist's tip) the two
 * sides meet at the same coordinate, so that point is emitted once.
 */
function pathFromLevels(levels: readonly Level[], width: number, height: number): string {
  const centre = width / 2;
  const point = (level: Level, side: -1 | 1): string =>
    `${fmt(clampTo(centre + (side * level.widthFrac * width) / 2, width))},${fmt(clampTo(level.y, height))}`;

  const points = levels.map((level) => point(level, -1));
  for (let i = levels.length - 1; i >= 0; i--) {
    const right = point(levels[i], 1);
    if (right !== points[points.length - 1]) points.push(right);
  }

  return `M ${points[0]} ${points
    .slice(1)
    .map((p) => `L ${p}`)
    .join(" ")} Z`;
}

/**
 * The SVG path for one building, in metres. `widthM` is the caller's derived
 * width (nothing about a real building's footprint is sourced, so plan width
 * is a drawing decision, not a claim) and `heightM` is the real height, which
 * is the number the whole prototype is about.
 */
export function silhouettePath(widthM: number, heightM: number, spec: ShapeSpec): string {
  const width = positive(widthM);
  const height = positive(heightM);
  const bodyTopY = height * clamp01(spec.crownHeightFrac);
  const bodyHeight = height - bodyTopY;

  // Start on the ground line at full width and walk up.
  const levels: Level[] = [{ y: height, widthFrac: 1 }];

  const tiers = spec.tiers.length > 0 ? spec.tiers : [{ weight: 1, topWidthFrac: 1 }];
  const totalWeight = tiers.reduce((sum, tier) => sum + Math.max(tier.weight, 0), 0);
  let widthFrac = 1;
  let walked = 0;
  tiers.forEach((tier, i) => {
    walked += totalWeight > 0 ? Math.max(tier.weight, 0) / totalWeight : 1 / tiers.length;
    // The last tier lands on `bodyTopY` exactly rather than on the accumulated
    // sum, so the crown always starts where it was promised to.
    const tierTopY = i === tiers.length - 1 ? bodyTopY : height - bodyHeight * Math.min(walked, 1);
    pushLevel(levels, tierTopY, widthFrac);
    widthFrac = clamp01(tier.topWidthFrac);
    pushLevel(levels, tierTopY, widthFrac);
  });

  addCrown(levels, spec.crown, bodyTopY, widthFrac);

  return pathFromLevels(levels, width, height);
}

/**
 * A slightly tapered glass shaft under a short antenna — the honest default
 * for a modern supertall, and what most of the journey's stops actually look
 * like from a kilometre away. Bespoke specs are spent only on the buildings a
 * visitor can recognise by outline; inventing distinguishing detail for the
 * rest would be decoration, not information.
 */
export const GENERIC_TOWER: ShapeSpec = {
  tiers: [{ weight: 1, topWidthFrac: 0.91 }],
  crown: "spire",
  crownHeightFrac: 0.08,
};

/** Bespoke silhouettes, keyed by `Stop.id`. Everything absent here uses `GENERIC_TOWER`. */
export const SHAPES: Record<string, ShapeSpec> = {
  // The Canberra dwellings are the journey's ruler: they have to read as
  // *houses* at the first stop, or the zoom that follows means nothing. A
  // pitched roof is the whole cue.
  house: {
    tiers: [{ weight: 1, topWidthFrac: 1 }],
    crown: "gable",
    crownHeightFrac: 0.25,
  },
  // A roof is a fixed few metres whatever it sits on, so the same roof is a
  // much smaller fraction of a three-storey townhouse than of a bungalow.
  townhouse: {
    tiers: [{ weight: 1, topWidthFrac: 1 }],
    crown: "gable",
    crownHeightFrac: 0.12,
  },
  // Flat-roofed block, no setback, no crown: the first stop with nothing on
  // top, which is exactly what makes it read as a bigger building.
  apartment: {
    tiers: [{ weight: 1, topWidthFrac: 1 }],
    crown: "flat",
    crownHeightFrac: 0,
  },
  // Taipei 101's eight stacked modules, notched apart, under its own spire.
  "taipei-101": {
    tiers: [
      { weight: 2.2, topWidthFrac: 0.9 },
      { weight: 1, topWidthFrac: 0.85 },
    ],
    crown: "stacked-pagoda",
    crownHeightFrac: 0.33,
  },
  // Lotte World Tower is one long, gentle cone — more of its height is taper
  // than Merdeka's is, which is what tells the two pinnacles apart.
  "lotte-world-tower": {
    tiers: [{ weight: 1, topWidthFrac: 0.9 }],
    crown: "pinnacle",
    crownHeightFrac: 0.27,
  },
  // Shanghai Tower twists through 120 degrees over its full height; in
  // elevation that shows up as curved edges rather than straight ones.
  "shanghai-tower": {
    tiers: [
      { weight: 1.6, topWidthFrac: 0.8 },
      { weight: 1, topWidthFrac: 0.6 },
    ],
    crown: "twist-taper",
    crownHeightFrac: 0.28,
  },
  // Merdeka 118's faceted shaft steps in twice before its short glass spire.
  "merdeka-118": {
    tiers: [
      { weight: 2, topWidthFrac: 0.85 },
      { weight: 1, topWidthFrac: 0.7 },
    ],
    crown: "pinnacle",
    crownHeightFrac: 0.14,
  },
  // The Burj's Y-shaped plan drops its three wings in sequence as it rises,
  // which in elevation is a run of setbacks; and its spire is a real fifth of
  // the 828 m, not a detail — the last stop has to look like the last stop.
  "burj-khalifa": {
    tiers: [
      { weight: 3, topWidthFrac: 0.85 },
      { weight: 2.2, topWidthFrac: 0.65 },
      { weight: 1.6, topWidthFrac: 0.45 },
      { weight: 1, topWidthFrac: 0.3 },
    ],
    crown: "spire",
    crownHeightFrac: 0.21,
  },
};

/** The silhouette spec for a stop — its own, or the generic supertall. */
export function shapeForStop(stop: { id: string }): ShapeSpec {
  return SHAPES[stop.id] ?? GENERIC_TOWER;
}
