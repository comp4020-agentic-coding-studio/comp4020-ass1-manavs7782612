<script setup lang="ts">
import { computed, watch } from "vue";
import Sky from "./components/Sky.vue";
import Skyline from "./components/Skyline.vue";
import { CITIES } from "./data/cities";
import { STOPS } from "./data/buildings";
import { SKYLINE_BUILDINGS } from "./data/skylineBuildings";
import type { Stop } from "./data/types";
import { totalWorldDistance, type CameraFrame } from "./scene/camera";
import { computeBuildingPaint } from "./scene/buildingPaint";
import { groundColorAt } from "./scene/groundTint";
import { shapeForStop, silhouettePath } from "./scene/silhouette";
import { skyPhase, solarElevation } from "./scene/sun";
import { useCamera } from "./scene/useCamera";

const { camera, trackWidthPx, positions, attachTrack } = useCamera(STOPS);

// Static, computed once — keys Skyline.vue's per-stop backdrop derivation to
// the same stops/positions the camera itself uses.
const stopIds = STOPS.map((stop) => stop.id);

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
  const spec = shapeForStop(stop);
  return {
    stop,
    worldX: positions[i],
    widthM,
    path: silhouettePath(widthM, stop.heightM, spec),
    ...computeBuildingPaint(stop.id, widthM, stop.heightM, stop.floors, spec),
  };
});

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

// The real names behind Skyline.vue's decorative (aria-hidden) backdrop,
// surfaced here as plain text so the information reaches every visitor, not
// just sighted ones (CLAUDE.md rule 2's spirit) — this is the caption's own
// paragraph, not the #announcer live region, so it doesn't bloat that
// region's per-stop announcement.
const nearbyNames = computed(() =>
  (SKYLINE_BUILDINGS[focusedStop.value.id] ?? []).map((b) => b.name).join(", "),
);

function describeStop(stop: Stop, cityName: string): string {
  const height = `${Math.round(stop.heightM)} m`;
  const kind = stop.kind === "typical" ? ", a typical example, not a measured building" : "";
  return `${stop.name}, ${cityName} — ${height} tall, ${stop.floors} floors${kind}`;
}

// The on-screen caption below is the visible half of "what building is
// this"; the #announcer element (in index.html, outside this component's
// mount root — reached directly since it's a fixed, singular DOM node, not
// something this component owns) is the half a screen reader gets, since
// scrolling the track doesn't itself move focus anywhere. Both read off the
// same focusedStop, so they never disagree.
watch(
  focusedStop,
  (stop) => {
    const announcer = document.getElementById("announcer");
    if (announcer) announcer.textContent = describeStop(stop, focusedCity.value.name);
  },
  { immediate: true },
);

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
          <linearGradient id="building-warmcool" x1="0" x2="1" y1="0" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0%" stop-color="#FBF3E4" />
            <stop offset="30%" stop-color="#FBF3E4" />
            <stop offset="40%" stop-color="#C6CFD8" />
            <stop offset="50%" stop-color="#93A9BE" />
            <stop offset="100%" stop-color="#93A9BE" />
          </linearGradient>
        </defs>
      </svg>
      <Sky :city-key="focusedStop.city" />
      <Skyline :world-x="camera.x" :positions="positions" :stop-ids="stopIds" />
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
          <g :clip-path="`url(#clip-${building.stop.id})`">
            <path :d="building.path" class="building-body" />
            <rect
              v-for="(band, i) in building.bands"
              :key="`band-${i}`"
              class="building-band"
              x="0"
              :y="band.yTop"
              :width="building.widthM"
              :height="band.yBottom - band.yTop"
              :fill="band.brightness < 0 ? '#000000' : '#ffffff'"
              :opacity="Math.abs(band.brightness)"
            />
            <rect
              v-for="(win, i) in building.windows"
              :key="`win-${i}`"
              class="building-window"
              :x="win.x"
              :y="win.y"
              :width="win.width"
              :height="win.height"
              :rx="win.rx"
              :opacity="win.opacity"
            />
            <path :d="building.rimPath" class="building-rim" :stroke-width="building.rimStrokeWidth" />
            <rect class="building-lights" x="0" y="0" :width="building.widthM" :height="building.stop.heightM" />
          </g>
          <g v-if="building.mast" class="building-mast-group">
            <line
              class="building-mast"
              :x1="building.widthM / 2"
              :y1="building.mast.yBottom"
              :x2="building.widthM / 2"
              y2="0"
              :stroke-width="building.mast.strokeWidth"
            />
            <circle class="building-mast-halo" :cx="building.widthM / 2" cy="0" :r="building.mast.haloRadius" />
            <circle class="building-mast-ball" :cx="building.widthM / 2" cy="0" :r="building.mast.ballRadius" />
          </g>
        </svg>
      </div>
      <p class="journey-title" aria-hidden="true">Skyline</p>
    </div>
    <div class="stop-info">
      <p class="stop-info-name">{{ focusedStop.name }}</p>
      <p class="stop-info-detail">
        {{ focusedCity.name }} · {{ Math.round(focusedStop.heightM) }} m · {{ focusedStop.floors }} floors
        <span v-if="focusedStop.kind === 'typical'" class="stop-info-badge">typical, not measured</span>
      </p>
      <p v-if="focusedStop.note" class="stop-info-note">{{ focusedStop.note }}</p>
      <p v-if="nearbyNames" class="stop-info-nearby">Nearby: {{ nearbyNames }}</p>
    </div>
    <div
      class="track"
      tabindex="0"
      role="region"
      aria-label="Journey: scroll sideways to travel between buildings"
      :ref="attachTrack"
    >
      <div class="track-spacer" :style="{ width: `${trackWidthPx}px` }"></div>
    </div>
  </div>
</template>
