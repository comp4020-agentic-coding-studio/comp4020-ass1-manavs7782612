<script setup lang="ts">
import { computed, watch } from "vue";
import Sky from "./components/Sky.vue";
import Skyline from "./components/Skyline.vue";
import { CITIES } from "./data/cities";
import { STOPS } from "./data/buildings";
import { SKYLINE_BUILDINGS } from "./data/skylineBuildings";
import type { Stop } from "./data/types";
import { totalWorldDistance, type CameraFrame } from "./scene/camera";
import { groundColorAt } from "./scene/groundTint";
import { phaseForStopIndex } from "./scene/journeyPhase";
import { useCamera } from "./scene/useCamera";

const { camera, trackWidthPx, positions, attachTrack } = useCamera(STOPS);

// Hand-illustrated per-building art (src/assets/buildings/{stop.id}.svg),
// bundled at build time so this stays a static site with zero runtime
// requests — keyed by stop id since glob order isn't guaranteed to match STOPS.
const buildingImages = import.meta.glob<string>("./assets/buildings/*.svg", {
  query: "?url",
  import: "default",
  eager: true,
});
const buildingImageByStopId: Record<string, string> = {};
for (const [path, url] of Object.entries(buildingImages)) {
  const id = path.replace("./assets/buildings/", "").replace(".svg", "");
  buildingImageByStopId[id] = url;
}

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

const buildings = STOPS.map((stop, i) => ({
  stop,
  worldX: positions[i],
  widthM: widthForStop(stop),
  imageUrl: buildingImageByStopId[stop.id],
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

// Which stop the camera is closest to right now, in world space.
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

const focusedIndex = computed(() => nearestStopIndex(camera.value.x));
const focusedStop = computed(() => STOPS[focusedIndex.value]);
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

// Which of the five twilight bands this stop falls in, by its position along
// the twenty-stop journey rather than any live clock (src/scene/journeyPhase.ts)
// — day at the house, night at the Burj Khalifa. Drives both the sky (passed
// down to <Sky>) and the buildings' window-light layer below.
const phase = computed(() => phaseForStopIndex(focusedIndex.value, STOPS.length));
</script>

<template>
  <div class="journey" :data-phase="phase">
    <div class="stage" aria-hidden="true">
      <Sky :phase="phase" />
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
          <image
            :href="building.imageUrl"
            width="100%"
            height="100%"
            :x="0"
            :y="0"
            preserveAspectRatio="xMidYMax meet"
          />
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
