import { type ComponentPublicInstance, onBeforeUnmount, type Ref, shallowRef } from "vue";
import { Lifecycle } from "../lifecycle";
import {
  calibrateScales,
  type CameraFrame,
  cameraAtWorldX,
  layoutStops,
  totalWorldDistance,
  TRACK_PX_PER_METRE,
  worldXFromScrollLeft,
  type WithHeight,
} from "./camera";

const FILL_FRACTION = 0.78;
// Must match .ground's height (a % of .stage) in journey.css: buildings are
// calibrated to fill FILL_FRACTION of the space *above* the ground, not the
// whole box.
const GROUND_FRACTION = 0.2;

export interface UseCameraResult {
  camera: Ref<CameraFrame>;
  trackWidthPx: number;
  positions: number[];
  attachTrack: (el: Element | ComponentPublicInstance | null) => void;
}

/**
 * Owns the journey's one and only requestAnimationFrame loop (harness rule
 * 5): scroll and resize handlers just record the latest raw values, and a
 * single rAF tick turns those into the reactive `camera` frame the scene
 * renders from. The loop starts on the first scroll/resize and stops once
 * the camera has held still for a few frames, or the tab is hidden.
 */
export function useCamera(stops: readonly WithHeight[], spacingFactor = 3): UseCameraResult {
  const scope = new Lifecycle();
  const positions = layoutStops(stops, spacingFactor);
  const trackWidthPx = totalWorldDistance(positions) * TRACK_PX_PER_METRE;

  let trackEl: Element | null = null;

  // .journey is a fraction of the viewport (see journey.css), capped by
  // min/max-height, so its real pixel height is only known once it's
  // mounted — window.innerHeight would size buildings for a box bigger than
  // the one they're actually drawn in. Falls back to the viewport as a
  // best guess before mount.
  function availableHeightPx(): number {
    const containerHeight = trackEl?.clientHeight ?? window.innerHeight;
    return containerHeight * (1 - GROUND_FRACTION);
  }

  let scales = calibrateScales(stops, availableHeightPx(), FILL_FRACTION);
  const camera = shallowRef<CameraFrame>(cameraAtWorldX(positions[0], positions, scales));

  function recalibrate(): void {
    scales = calibrateScales(stops, availableHeightPx(), FILL_FRACTION);
  }

  let settledFrames = 0;
  let rafActive = false;
  let cancelTick: (() => void) | null = null;
  const SETTLE_FRAMES = 3;

  // Polls trackEl.scrollLeft once per frame rather than reading it in the
  // scroll handler — the handler only has to make sure this loop is running.
  function tick(): void {
    const scrollLeft = trackEl?.scrollLeft ?? 0;
    const worldX = worldXFromScrollLeft(scrollLeft, positions[0]);
    const next = cameraAtWorldX(worldX, positions, scales);
    if (next.x !== camera.value.x || next.scale !== camera.value.scale) {
      camera.value = next;
      settledFrames = 0;
    } else {
      settledFrames++;
    }

    if (settledFrames >= SETTLE_FRAMES) {
      rafActive = false;
      cancelTick = null;
      return;
    }
    cancelTick = scope.raf(tick);
  }

  function markDirty(): void {
    settledFrames = 0;
    if (!rafActive) {
      rafActive = true;
      cancelTick = scope.raf(tick);
    }
  }

  function stopLoop(): void {
    cancelTick?.();
    cancelTick = null;
    rafActive = false;
  }

  scope.on(window, "resize", () => {
    recalibrate();
    markDirty();
  }, { passive: true });

  scope.on(document, "visibilitychange", () => {
    if (document.hidden) stopLoop();
    else markDirty();
  });

  let detachScroll: (() => void) | null = null;

  function attachTrack(el: Element | ComponentPublicInstance | null): void {
    detachScroll?.();
    detachScroll = null;
    const element = el instanceof Element ? el : null;
    trackEl = element;
    if (element) {
      recalibrate();
      detachScroll = scope.on(element, "scroll", markDirty, { passive: true });
      markDirty();
    }
  }

  onBeforeUnmount(() => scope.close());

  return { camera, trackWidthPx, positions, attachTrack };
}
