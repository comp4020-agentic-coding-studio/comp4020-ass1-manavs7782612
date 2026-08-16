// The world is measured in metres; the camera is {x, scale} in that world.
//
// x is how far along the ground line the journey has walked, in metres.
// scale is px per metre — how big one metre of the world is on screen right
// now. Every building on screen at a given instant is drawn with the same
// scale, which is the whole trick: the house and the Burj Khalifa are never
// both legible at once, but each is legible when it's the one being visited.
export interface CameraFrame {
  x: number;
  scale: number;
}

export interface WithHeight {
  heightM: number;
  /** In world metres — when given alongside `viewportWidthPx`, caps the
   * calibrated scale so the stop fits the viewport horizontally too, not
   * just vertically (see `calibrateScales`). */
  widthM?: number;
}

/**
 * Where each stop sits along the ground, in metres. Consecutive stops are
 * spaced by `spacingFactor` times the *square root* of the taller of the
 * pair, so a step from a short building to a tall one (or back) still gets
 * more ground to cross than two similarly-sized buildings in a row — but
 * without a plain linear-in-height gap, which (given the dataset's dozen
 * supertalls all within ~460-830m of each other) made every single
 * supertall-to-supertall step cost thousands of scroll pixels for almost no
 * visible change, while the three short Canberra stops were a couple of
 * mouse-wheel notches apart. The square root keeps the same "bigger jump,
 * more ground" ordering while narrowing that spread to a walkable range.
 */
export function layoutStops(stops: readonly WithHeight[], spacingFactor: number): number[] {
  const positions: number[] = [0];
  for (let i = 1; i < stops.length; i++) {
    const gap = spacingFactor * Math.sqrt(Math.max(stops[i].heightM, stops[i - 1].heightM));
    positions.push(positions[i - 1] + gap);
  }
  return positions;
}

/**
 * The scale, in px per metre, at which stop i's own height fills
 * `fillFraction` of the viewport — i.e. the scale the camera should be at
 * when the journey is stopped exactly at stop i.
 *
 * When `viewportWidthPx` is given too, a stop whose `widthM` would otherwise
 * overflow the viewport horizontally (the three squat, wide Canberra stops
 * on a phone-width screen, where height-only calibration reads as "too
 * zoomed in" because the sides run off both edges) is scaled down until it
 * fits within `maxWidthFraction` of the viewport instead — matching how far
 * a centred building can grow before it hits the nearer edge of `.anchor`
 * (`left: 38vw` in journey.css; the nearer edge is 38vw away, so a centred
 * building can be at most 2 * 38vw = 76vw wide before that edge clips it).
 */
export function calibrateScales(
  stops: readonly WithHeight[],
  viewportHeightPx: number,
  fillFraction: number,
  viewportWidthPx?: number,
  maxWidthFraction = 0.76,
): number[] {
  return stops.map((stop) => {
    const heightScale = (fillFraction * viewportHeightPx) / stop.heightM;
    if (stop.widthM == null || viewportWidthPx == null) return heightScale;
    const widthScale = (maxWidthFraction * viewportWidthPx) / stop.widthM;
    return Math.min(heightScale, widthScale);
  });
}

/**
 * The camera frame at world position `worldX`, given each stop's position
 * and calibrated scale. Between two stops, scale is interpolated
 * *logarithmically* (geometric, not linear) — scale changes by the same
 * multiplicative factor per metre travelled, so a 184x zoom range (house to
 * Burj Khalifa) feels like a constant rate of zooming rather than a
 * lurch-then-crawl. `positions` must be strictly non-decreasing and the same
 * length as `scales`.
 */
export function cameraAtWorldX(
  worldX: number,
  positions: readonly number[],
  scales: readonly number[],
): CameraFrame {
  const last = positions.length - 1;
  const x = Math.min(Math.max(worldX, positions[0]), positions[last]);

  let i = 0;
  while (i < last - 1 && x > positions[i + 1]) i++;

  const spanStart = positions[i];
  const spanEnd = positions[i + 1];
  const frac = spanEnd > spanStart ? (x - spanStart) / (spanEnd - spanStart) : 0;
  const scale = scales[i] * (scales[i + 1] / scales[i]) ** frac;

  return { x, scale };
}

/** Total ground distance the journey covers, in metres. */
export function totalWorldDistance(positions: readonly number[]): number {
  return positions[positions.length - 1] - positions[0];
}

/**
 * World metres per pixel of native scroll — fixed regardless of viewport
 * size or zoom, so the scroll track's length (and thus how much wheel/touch
 * travel one stop takes) doesn't shift under a resize. Chosen so the whole
 * 20-stop walk is a many-thousand-pixel scroll: long enough that native
 * momentum and the scrollbar thumb both feel proportionate.
 */
export const TRACK_PX_PER_METRE = 6;

export function worldXFromScrollLeft(scrollLeft: number, originX: number): number {
  return originX + scrollLeft / TRACK_PX_PER_METRE;
}

export function scrollLeftFromWorldX(worldX: number, originX: number): number {
  return (worldX - originX) * TRACK_PX_PER_METRE;
}
