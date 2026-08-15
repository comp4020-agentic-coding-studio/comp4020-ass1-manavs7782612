// Sideways-drift primitive for a horizontally-tiled parallax layer — used by
// Skyline.vue (building silhouettes). Framework-agnostic on purpose (no Vue,
// no DOM), same style as skylineBlend.ts: a pure function of worldX so there
// is nothing here for a new rAF loop, timer or listener to drive (harness
// rule 5).

/**
 * How far left to slide a layer, in px, wrapped into one tile width. The
 * pattern repeats every `tilePx`, so a shift of `n * tilePx` is
 * indistinguishable from no shift — taking the offset modulo the tile keeps
 * the number small and the drift seamless however far the journey runs.
 */
export function wrappedShiftPx(worldX: number, pxPerMetre: number, tilePx: number): number {
  const drift = worldX * pxPerMetre;
  if (!Number.isFinite(drift)) return 0;
  return ((drift % tilePx) + tilePx) % tilePx;
}
