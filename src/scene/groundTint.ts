// The ground's colour along the journey: leafy Canberra green at the start,
// drying through olive and neutral greige, ending on Dubai's warm sand.
//
// This is atmosphere, not data. Harness rule 1 governs figures the page
// asserts as true; a ground colour asserts nothing, and the UI never presents
// it as a fact about either city. What it does have to be is *pure* — no Date,
// no Math.random, no reading the DOM — so the same progress always gives the
// same colour and a test can pin it.

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface TintStop {
  /** Journey progress at which this colour is reached exactly. */
  at: number;
  rgb: Rgb;
}

/** The start colour, also .ground's static background in src/styles/journey.css. */
const CANBERRA_GREEN = "#6b8f5a";

/** The end colour: warm desert sand under the Burj Khalifa. */
const DUBAI_SAND = "#d2b183";

function parseHex(hex: string): Rgb {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

// Stops must be sorted by `at`, start at 0 and end at 1, so every progress in
// [0, 1] lands inside exactly one span.
const STOPS: readonly TintStop[] = [
  { at: 0, rgb: parseHex(CANBERRA_GREEN) },
  { at: 0.35, rgb: parseHex("#83915c") },
  { at: 0.65, rgb: parseHex("#a2996f") },
  { at: 1, rgb: parseHex(DUBAI_SAND) },
];

/** Clamps into [0, 1]. NaN has no place on the line at all, so it reads as the start. */
function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

function channel(from: number, to: number, t: number): string {
  return Math.round(from + (to - from) * t)
    .toString(16)
    .padStart(2, "0");
}

/**
 * The ground colour at a point in the journey, as a lowercase `#rrggbb`
 * string. `progress` is 0 at the journey's start (Canberra) and 1 at its end
 * (Dubai); values outside that range are clamped, never extrapolated, so a
 * camera that overshoots its track can't tint the ground into nonsense.
 *
 * Interpolation is plain linear mixing per sRGB channel between fixed stops —
 * not perceptually uniform, but predictable and enough for a wash of colour
 * behind the buildings.
 */
export function groundColorAt(progress: number): string {
  const p = clamp01(progress);

  let i = 0;
  while (i < STOPS.length - 2 && p > STOPS[i + 1].at) i++;

  const from = STOPS[i];
  const to = STOPS[i + 1];
  const span = to.at - from.at;
  const t = span > 0 ? (p - from.at) / span : 0;

  return `#${channel(from.rgb.r, to.rgb.r, t)}${channel(from.rgb.g, to.rgb.g, t)}${channel(from.rgb.b, to.rgb.b, t)}`;
}
