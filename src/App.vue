<script setup lang="ts">
import { STOPS } from "./data/buildings";
import { scrollLeftFromWorldX, type CameraFrame } from "./scene/camera";
import { useCamera } from "./scene/useCamera";

const { camera, trackWidthPx, positions, attachTrack } = useCamera(STOPS);

// A placeholder footprint until silhouette.ts gives each building its real
// shape (build-order step "the look") — just enough width that a rectangle
// reads as a building rather than a line.
const buildings = STOPS.map((stop, i) => ({
  stop,
  worldX: positions[i],
  widthM: Math.max(stop.heightM * 0.35, 3),
}));

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
</script>

<template>
  <div class="journey">
    <div class="stage" aria-hidden="true">
      <div class="ground"></div>
      <div class="anchor">
        <div
          v-for="building in buildings"
          :key="building.stop.id"
          class="building"
          :style="buildingStyle(building, camera)"
        ></div>
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
