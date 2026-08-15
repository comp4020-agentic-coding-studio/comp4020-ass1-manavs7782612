// Which of the five twilight bands the sky (and the buildings' window
// lights) shows, keyed to *how far along the journey* the visitor is rather
// than to any real clock. The house starts the trip in daylight and the Burj
// Khalifa ends it at night; the twenty stops split evenly into the five
// standard bands (src/scene/sun.ts's `SkyPhase`) in that order, four stops
// each.
//
// sun.ts's real-astronomy solar calculator is unused by this default path —
// it's still there, tested, and correct, in case a future version wants each
// city's actual local time back.
import type { SkyPhase } from "./sun";

const PHASE_ORDER: readonly SkyPhase[] = ["day", "civil", "nautical", "astronomical", "night"];

/**
 * Splits `total` stops into `PHASE_ORDER.length` equal, ordered bands and
 * returns which band `index` falls in — stop 0 is always "day", the last
 * stop is always "night".
 */
export function phaseForStopIndex(index: number, total: number): SkyPhase {
  const bandSize = total / PHASE_ORDER.length;
  const bandIndex = Math.min(PHASE_ORDER.length - 1, Math.floor(index / bandSize));
  return PHASE_ORDER[bandIndex];
}
