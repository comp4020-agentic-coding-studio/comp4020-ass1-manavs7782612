// Hand-painted detail on top of silhouette.ts's silhouette path: horizontal
// tonal bands, scattered windows, a left-edge rim highlight, and (for spire
// crowns) the mast/ball/halo. Framework-agnostic on purpose, like
// silhouette.ts — no Vue, no DOM, no side effects, deterministic per building
// id so a re-render never reshuffles a building's own paint.
//
// Key design rule: every size fraction below is of `heightM`, never
// `widthM`. calibrateScales (camera.ts) sets scale = FILL_FRACTION *
// availableHeightPx / heightM, so a length defined as f * heightM lands at a
// provably constant on-screen size across all twenty stops regardless of
// their real scale. A length defined as f * widthM only has that property
// for the stops sharing one width ratio — it breaks for the three Canberra
// stops, whose widthM/heightM ratios are far off the towers'. The constants
// below are chosen so a "typical supertall" of heightM = 650 lands near the
// brief's literal-sounding values (rim ~3, mast ~2.5, ball r ~4, window
// ~4x7, rx~1.5), scaling proportionally for every other stop.
import type { ShapeSpec } from "./silhouette";

export interface Band {
  yTop: number;
  yBottom: number;
  /** Signed; |brightness| is the overlay's opacity — negative darkens, positive lightens. */
  brightness: number;
}

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  opacity: number;
}

export interface MastGeometry {
  strokeWidth: number;
  yBottom: number;
  ballRadius: number;
  haloRadius: number;
}

export interface BuildingPaint {
  bands: Band[];
  windows: WindowRect[];
  rimPath: string;
  rimStrokeWidth: number;
  mast: MastGeometry | null;
}

const REFERENCE_HEIGHT_M = 650;
const RIM_STROKE_FRAC = 3 / REFERENCE_HEIGHT_M;
const MAST_STROKE_FRAC = 2.5 / REFERENCE_HEIGHT_M;
const BALL_RADIUS_FRAC = 4 / REFERENCE_HEIGHT_M;
const HALO_RADIUS_FACTOR = 2.2;
const WINDOW_WIDTH_FRAC = 4 / REFERENCE_HEIGHT_M;
const WINDOW_HEIGHT_FRAC = 7 / REFERENCE_HEIGHT_M;
const WINDOW_RX_FRAC = 1.5 / REFERENCE_HEIGHT_M;

const MIN_BANDS = 3;
const MAX_BANDS = 20;
const MIN_WINDOWS = 8;
const MAX_WINDOWS = 100;
const MIN_BAND_MAGNITUDE = 0.04;
const MAX_BAND_MAGNITUDE = 0.15;
const WINDOW_Y_BIAS_EXPONENT = 2.4;

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;
}

function clampRange(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function fmt(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

/** FNV-1a hash of `seed` into a 32-bit unsigned int — a stable, dependency-free string hash. */
function fnv1a(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: a small, fast PRNG seeded by a single 32-bit int. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A deterministic `() => number` in [0, 1) for a given building id — same id, same sequence, every call. */
export function seededRandom(seed: string): () => number {
  return mulberry32(fnv1a(seed));
}

interface Level {
  y: number;
  widthFrac: number;
}

function pushLevel(levels: Level[], y: number, widthFrac: number): void {
  const previous = levels[levels.length - 1];
  if (previous && Math.abs(previous.y - y) < 1e-9 && Math.abs(previous.widthFrac - widthFrac) < 1e-9) return;
  levels.push({ y, widthFrac });
}

/**
 * Re-walks `spec.tiers`' cumulative-weight math the same way silhouettePath
 * does, tracking Y only (no new geometry) — the left-edge levels for the rim,
 * and each tier's own [yTop, yBottom] span for distributing bands.
 */
function walkTiers(heightM: number, spec: ShapeSpec): { levels: Level[]; tierSpans: Array<[number, number]> } {
  const bodyTopY = heightM * clamp01(spec.crownHeightFrac);
  const bodyHeight = heightM - bodyTopY;
  const tiers = spec.tiers.length > 0 ? spec.tiers : [{ weight: 1, topWidthFrac: 1 }];
  const totalWeight = tiers.reduce((sum, tier) => sum + Math.max(tier.weight, 0), 0);

  const levels: Level[] = [{ y: heightM, widthFrac: 1 }];
  const tierSpans: Array<[number, number]> = [];
  let widthFrac = 1;
  let walked = 0;
  let previousTopY = heightM;

  tiers.forEach((tier, i) => {
    walked += totalWeight > 0 ? Math.max(tier.weight, 0) / totalWeight : 1 / tiers.length;
    const tierTopY = i === tiers.length - 1 ? bodyTopY : heightM - bodyHeight * Math.min(walked, 1);
    pushLevel(levels, tierTopY, widthFrac);
    widthFrac = clamp01(tier.topWidthFrac);
    pushLevel(levels, tierTopY, widthFrac);
    tierSpans.push([tierTopY, previousTopY]);
    previousTopY = tierTopY;
  });

  return { levels, tierSpans };
}

function computeBands(
  heightM: number,
  floors: number,
  tierSpans: ReadonlyArray<[number, number]>,
  rand: () => number,
): Band[] {
  const totalBands = clampRange(Math.round(floors / 5), MIN_BANDS, MAX_BANDS);
  const bodyHeight = tierSpans.reduce((sum, [top, bottom]) => sum + (bottom - top), 0);

  const rawCounts = tierSpans.map(([top, bottom]) => {
    const share = bodyHeight > 0 ? (bottom - top) / bodyHeight : 1 / tierSpans.length;
    return share * totalBands;
  });
  const counts = rawCounts.map((raw) => Math.floor(raw));
  let remaining = totalBands - counts.reduce((sum, count) => sum + count, 0);
  const remainders = rawCounts.map((raw, i) => [raw - counts[i], i] as const).sort((a, b) => b[0] - a[0]);
  for (let i = 0; remaining > 0 && i < remainders.length; i++, remaining--) counts[remainders[i][1]]++;

  const bands: Band[] = [];
  tierSpans.forEach(([tierTop, tierBottom], tierIndex) => {
    const count = counts[tierIndex];
    if (count <= 0) return;
    const bandHeight = (tierBottom - tierTop) / count;
    for (let k = 0; k < count; k++) {
      const yBottom = tierBottom - k * bandHeight;
      const yTop = yBottom - bandHeight;
      const magnitude = MIN_BAND_MAGNITUDE + rand() * (MAX_BAND_MAGNITUDE - MIN_BAND_MAGNITUDE);
      const brightness = rand() < 0.5 ? -magnitude : magnitude;
      bands.push({ yTop, yBottom, brightness });
    }
  });
  return bands;
}

function computeWindows(widthM: number, heightM: number, floors: number, bodyTopY: number, rand: () => number): WindowRect[] {
  const count = clampRange(Math.round(floors * 0.6), MIN_WINDOWS, MAX_WINDOWS);
  const width = heightM * WINDOW_WIDTH_FRAC;
  const height = heightM * WINDOW_HEIGHT_FRAC;
  const rx = heightM * WINDOW_RX_FRAC;

  const windows: WindowRect[] = [];
  for (let i = 0; i < count; i++) {
    const y = Math.max(heightM * (1 - rand() ** WINDOW_Y_BIAS_EXPONENT), bodyTopY);
    const x = rand() * Math.max(widthM - width, 0);
    const opacity = clampRange(0.5 + 0.4 * (x / widthM) + (rand() - 0.5) * 0.15, 0.5, 1);
    windows.push({ x, y, width, height, rx, opacity });
  }
  return windows;
}

function computeRim(levels: readonly Level[], widthM: number): string {
  const points = levels.map((level) => `${fmt((widthM * (1 - level.widthFrac)) / 2)},${fmt(level.y)}`);
  return `M ${points[0]} ${points
    .slice(1)
    .map((p) => `L ${p}`)
    .join(" ")}`;
}

function computeMast(heightM: number, spec: ShapeSpec): MastGeometry | null {
  if (spec.crown !== "spire") return null;
  return {
    strokeWidth: heightM * MAST_STROKE_FRAC,
    yBottom: heightM * clamp01(spec.crownHeightFrac),
    ballRadius: heightM * BALL_RADIUS_FRAC,
    haloRadius: heightM * BALL_RADIUS_FRAC * HALO_RADIUS_FACTOR,
  };
}

/** The full hand-painted detail layer for one building — deterministic per `id`. */
export function computeBuildingPaint(
  id: string,
  widthM: number,
  heightM: number,
  floors: number,
  spec: ShapeSpec,
): BuildingPaint {
  const rand = seededRandom(id);
  const bodyTopY = heightM * clamp01(spec.crownHeightFrac);
  const { levels, tierSpans } = walkTiers(heightM, spec);

  return {
    bands: computeBands(heightM, floors, tierSpans, rand),
    windows: computeWindows(widthM, heightM, floors, bodyTopY, rand),
    rimPath: computeRim(levels, widthM),
    rimStrokeWidth: heightM * RIM_STROKE_FRAC,
    mast: computeMast(heightM, spec),
  };
}
