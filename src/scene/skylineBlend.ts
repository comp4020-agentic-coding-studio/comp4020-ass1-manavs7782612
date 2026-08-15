// Which stop's real backdrop `Skyline.vue` should be showing at a given world
// position, and how far through the crossfade into the next one.
//
// Framework-agnostic on purpose (no Vue, no DOM), mirroring camera.ts: a pure
// function of `worldX` plus the same `positions`/ids the camera already
// computes, so there is nothing here for a new rAF loop, timer or listener to
// drive (harness rule 5) — Skyline.vue reads this off the same worldX-driven
// `computed()` the drift transform already uses.

export interface SkylineBlend {
  fromId: string;
  toId: string;
  /** 0 = fully `fromId`'s backdrop, 1 = fully `toId`'s. */
  frac: number;
}

/**
 * Share of a span spent ramping into the next stop's backdrop. Most of a
 * multi-hundred-metre walk between two stops should show one clean backdrop;
 * the blend only starts once the next stop is close.
 */
const RAMP_FRACTION = 0.2;

/**
 * Upper bound on the ramp's length in metres, whatever `RAMP_FRACTION` of the
 * span would otherwise be. Without it, the multi-thousand-metre spans between
 * two similarly-tall supertalls (this dataset's spacing grows with height)
 * would spend a proportionally huge, slow-feeling stretch mid-blend; capping
 * keeps the crossfade itself feeling like a brief transition every time, long
 * spans included. A drawing decision, not a sourced figure — same status as
 * silhouette.ts's building widths.
 */
const MAX_RAMP_M = 120;

/**
 * The two stops either side of `worldX` and how far the crossfade between
 * them has progressed. `frac` is 0 for most of a span and ramps linearly to 1
 * only over the final `RAMP_FRACTION` of approach to `toId` (capped at
 * `MAX_RAMP_M`), reaching exactly 1 at `toId`'s own position. Clamped at the
 * ends: before the first stop `frac` stays exactly 0 (nothing to blend from
 * yet), and at or past the last stop it stays exactly 1 (fully the last
 * stop's backdrop), so the blend never overshoots past either end of the
 * journey.
 *
 * `positions` must be strictly non-decreasing and the same length as `ids` —
 * the same contract `cameraAtWorldX` (camera.ts) holds its `positions`
 * argument to.
 */
export function skylineBlendAt(worldX: number, positions: readonly number[], ids: readonly string[]): SkylineBlend {
  const last = positions.length - 1;
  const x = Math.min(Math.max(worldX, positions[0]), positions[last]);

  let i = 0;
  while (i < last - 1 && x > positions[i + 1]) i++;

  const spanEnd = positions[i + 1] ?? positions[i];
  const spanStart = positions[i];
  const span = spanEnd - spanStart;
  const rampM = Math.min(span * RAMP_FRACTION, MAX_RAMP_M);
  const rampStart = spanEnd - rampM;
  const frac = rampM > 0 ? Math.min(Math.max((x - rampStart) / rampM, 0), 1) : 1;

  return { fromId: ids[i], toId: ids[i + 1] ?? ids[i], frac };
}
