<script setup lang="ts">
import { computed } from "vue";
import Sky from "./components/Sky.vue";
import Skyline from "./components/Skyline.vue";
import { CITIES } from "./data/cities";
import { STOPS } from "./data/buildings";
import type { Stop } from "./data/types";
import { scrollLeftFromWorldX, totalWorldDistance, type CameraFrame } from "./scene/camera";
import { groundColorAt } from "./scene/groundTint";
import { shapeForStop, silhouettePath } from "./scene/silhouette";
import { skyPhase, solarElevation } from "./scene/sun";
import { useCamera } from "./scene/useCamera";

const { camera, trackWidthPx, positions, attachTrack } = useCamera(STOPS);

// Footprint width is a drawing decision, not a sourced claim (silhouette.ts) —
// the three Canberra dwellings need family-specific ratios to read as a house,
// a townhouse and a low block rather than three towers; every supertall
// shares one ratio since none of their footprints are part of what the
// journey is measuring.
const WIDTH_FRACTIONS: Record<string, number> = {
  house: 2.6,
  townhouse: 1.4,
  apartment: 0.9,
};
const TOWER_WIDTH_FRACTION = 0.16;

function widthForStop(stop: Stop): number {
  return stop.heightM * (WIDTH_FRACTIONS[stop.id] ?? TOWER_WIDTH_FRACTION);
}

const buildings = STOPS.map((stop, i) => {
  const widthM = widthForStop(stop);
  return {
    stop,
    worldX: positions[i],
    widthM,
    path: silhouettePath(widthM, stop.heightM, shapeForStop(stop)),
  };
});

const snapPoints = positions.map((x, i) => ({
  id: STOPS[i].id,
  leftPx: scrollLeftFromWorldX(x, positions[0]),
}));

function buildingStyle(building: (typeof buildings)[number], frame: CameraFrame) {
  const widthPx = building.widthM * frame.scale;
  const heightPx = building.stop.heightM * frame.scale;
  const screenX = (building.worldX - frame.x) * frame.scale - widthPx / 2;
  return {
    transform: `translateX(${screenX}px)`,
    width: `${widthPx}px`,
    height: `${heightPx}px`,
  };
}

const totalDistance = totalWorldDistance(positions);

// 0 at the house, 1 at the Burj — drives the ground's colour wash. Not a fact
// the page asserts, just atmosphere (groundTint.ts).
const progress = computed(() => (camera.value.x - positions[0]) / totalDistance);

// Which stop the camera is closest to right now, in world space — the sky
// shown is that stop's *actual* city, not a fixed one, so the twilight band
// changes as the visitor travels from Canberra to Dubai.
function nearestStopIndex(worldX: number): number {
  let best = 0;
  let bestDistance = Infinity;
  positions.forEach((position, i) => {
    const distance = Math.abs(position - worldX);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  });
  return best;
}

const focusedStop = computed(() => STOPS[nearestStopIndex(camera.value.x)]);
const focusedCity = computed(() => CITIES[focusedStop.value.city] ?? CITIES.canberra);

// Same real-astronomy call Sky.vue makes internally, reused here only to gate
// the buildings' window-light layer — sampled once per focused-city change,
// not per frame (harness rule 5).
const phase = computed(() =>
  skyPhase(solarElevation(new Date(), focusedCity.value.lat, focusedCity.value.lon)),
);
</script>

<template>
  <div class="journey" :data-phase="phase">
    <div class="stage" aria-hidden="true">
      <svg class="defs-only" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="building-windows" width="4" height="5" patternUnits="userSpaceOnUse">
            <rect x="1" y="1" width="1.2" height="1.6" />
            <rect x="2.6" y="1" width="1.2" height="1.6" />
            <rect x="1" y="3" width="1.2" height="1.6" />
            <rect x="2.6" y="3" width="1.2" height="1.6" />
          </pattern>
        </defs>
      </svg>
      <Sky :city-key="focusedStop.city" />
      <Skyline :world-x="camera.x" />
      <div class="ground" :style="{ background: groundColorAt(progress) }"></div>
      <div class="anchor">
        <svg
          v-for="building in buildings"
          :key="building.stop.id"
          class="building"
          :style="buildingStyle(building, camera)"
          :viewBox="`0 0 ${building.widthM} ${building.stop.heightM}`"
          preserveAspectRatio="xMidYMax meet"
        >
          <defs>
            <clipPath :id="`clip-${building.stop.id}`">
              <path :d="building.path" />
            </clipPath>
          </defs>
          <path :d="building.path" class="building-body" />
          <rect
            class="building-lights"
            x="0"
            y="0"
            :width="building.widthM"
            :height="building.stop.heightM"
            :clip-path="`url(#clip-${building.stop.id})`"
          />
        </svg>
      </div>
    </div>
    <div
      class="track"
      tabindex="0"
      role="region"
      aria-label="Journey: scroll sideways to travel between buildings"
      :ref="attachTrack"
    >
      <div class="track-spacer" :style="{ width: `${trackWidthPx}px` }">
        <div
          v-for="point in snapPoints"
          :key="`${point.id}-snap`"
          class="snap-point"
          :style="{ left: `${point.leftPx}px` }"
        ></div>
      </div>
    </div>
  </div>
</template>
