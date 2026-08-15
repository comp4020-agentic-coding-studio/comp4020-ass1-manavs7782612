<script setup lang="ts">
// A parallax backdrop for the journey, two layers deep, that now depicts the
// real, named buildings near whichever stop is currently focused (Dubai's
// actual supertall neighbours behind the Burj Khalifa, Saint Petersburg's
// real, much shorter cathedral skyline behind Lakhta Center) — sourced in
// src/data/skylineBuildings.ts under the same rule 1 discipline as
// buildings.ts (source + retrieved date on every heightM).
//
// It stays `aria-hidden`: the silhouettes are still a drawing decision, not a
// claim (blocky caps standing in for real towers, no real footprint or
// position — the same license silhouette.ts already takes for the tracked
// buildings' generic neighbours). What changed is that the *names* are now
// real facts, so those are surfaced as text instead, in App.vue's
// `.stop-info` caption — the on-screen place "what building is this" already
// lives — rather than only living in a layer nothing but sighted users can
// read (rule 2's spirit).
//
// It owns no loop, no timer and no listener (rule 5): the whole thing is a
// function of the `worldX`/`positions`/`stopIds` props the parent hands it
// from the camera, and the one rAF loop in src/scene/useCamera.ts is what
// makes `worldX` change. The crossfade between adjacent stops' backdrops
// (skylineBlend.ts) is likewise a pure function of the same `worldX` — no
// transition-end listener, no second loop.
import { computed, useId } from "vue";
import "../styles/skyline.css";
import { SKYLINE_BUILDINGS } from "../data/skylineBuildings";
import type { SkylineBuilding, SkylineShape } from "../data/types";
import { skylineBlendAt } from "../scene/skylineBlend";
import { wrappedShiftPx } from "../scene/tileDrift";

const props = defineProps<{
  /**
   * The camera's world position along the ground, in metres — the same
   * `camera.x` (`CameraFrame.x`, src/scene/camera.ts) the buildings are drawn
   * from. Metres, not pixels: the parallax factors below are the only place
   * that conversion happens for this layer.
   */
  worldX: number;
  /** Same array `useCamera(STOPS)` returns — world-metre position of every stop, in order. */
  positions: readonly number[];
  /** `STOPS[i].id` for every stop, same order/length as `positions` — keys into `SKYLINE_BUILDINGS`. */
  stopIds: readonly string[];
}>();

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Each layer is one <svg> whose viewBox is TILE_H tall, so y = TILE_H is
// always the ground line whatever pixel height the layer ends up with — the
// silhouette scales with the stage for free. Horizontally the viewBox is
// SPAN_PX wide across an element exactly SPAN_PX px wide, so one user unit is
// exactly one pixel and the wrap arithmetic below can be done in px.
const TILE_H = 100;

// Wider than any plausible stage: the svg overflows its layer and is clipped
// by .skyline's overflow, which is what lets the layer slide left by up to a
// full tile without exposing an empty edge.
const SPAN_PX = 6400;

// Two layers at different rates: the depth cue is the *difference* between
// them, and mismatched rates keep the two repeats from lining up into one
// obvious tile. Both rates are a small fraction of the foreground's 1:1,
// which is the whole parallax trick — this layer only drifts, it never zooms.
// heightRange is the same pixel range the old hand-placed FAR_BLOCKS/
// NEAR_BLOCKS used, so swapping in real data doesn't change the depth
// composition — only which building is tallest, and its shape, now does.
const LAYER_CONFIG = [
  { name: "far", pxPerMetre: 0.06, heightRange: [38, 84] as const },
  { name: "near", pxPerMetre: 0.11, heightRange: [40, 82] as const },
] as const;

// Footprint width is a drawing decision, not a sourced claim — same status as
// silhouette.ts's building widths and buildings.ts's WIDTH_FRACTIONS. Each
// shape gets a base width, varied a little per building so a tile of the
// same shape repeated doesn't read as one stamped copy.
const BASE_WIDTH: Record<SkylineShape, number> = {
  flat: 54,
  pitch: 38,
  spire: 32,
  step: 46,
  dome: 50,
};

/** Deterministic pseudo-variation from a building's own name — no Math.random anywhere in the scene, so the layout is reproducible run to run. */
function nameFrac(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return (hash % 1000) / 1000;
}

function widthFor(building: SkylineBuilding): number {
  return BASE_WIDTH[building.shape] * (0.75 + 0.5 * nameFrac(building.name));
}

/** Appends whatever extra rects/polygons a shape's cap needs on top of its body rect (which the caller has already pushed). */
function addCap(rects: Rect[], polys: string[], shape: SkylineShape, x: number, w: number, top: number): void {
  switch (shape) {
    case "spire": {
      const mast = 2.6;
      rects.push({ x: x + w / 2 - mast / 2, y: top - 12, w: mast, h: 12 });
      break;
    }
    case "step":
      rects.push({ x: x + w * 0.22, y: top - 9, w: w * 0.56, h: 9 });
      break;
    case "pitch": {
      const rise = Math.min(w * 0.3, 12);
      polys.push(`${x},${top} ${x + w / 2},${top - rise} ${x + w},${top}`);
      break;
    }
    case "dome": {
      // An onion-dome/cupola silhouette: a half-ellipse sampled into a
      // polygon (same "no curves, just enough points" approach twist-taper
      // uses in silhouette.ts), plus a short finial mast at the crown — the
      // cue that reads as a cathedral rather than a glass tower at this
      // scale, which is the whole reason this shape exists (Saint
      // Petersburg's real skyline, unlike every other stop's, is historic).
      const domeH = Math.min(w * 0.4, 16);
      const samples = 6;
      const cx = x + w / 2;
      const rx = w / 2;
      const points = [`${x},${top}`];
      for (let i = 0; i <= samples; i++) {
        const angle = Math.PI * (1 - i / samples);
        points.push(`${(cx + rx * Math.cos(angle)).toFixed(2)},${(top - domeH * Math.sin(angle)).toFixed(2)}`);
      }
      points.push(`${x + w},${top}`);
      polys.push(points.join(" "));
      const finial = 1.6;
      rects.push({ x: cx - finial / 2, y: top - domeH - 6, w: finial, h: 6 });
      break;
    }
    case "flat":
      break;
  }
}

interface DerivedLayer {
  name: (typeof LAYER_CONFIG)[number]["name"];
  patternId: string;
  tilePx: number;
  rects: Rect[];
  polys: string[];
}

/** Where each building falls between the stop's own shortest and tallest, 0..1 — computed once across the whole stop so both layers agree on relative scale before either maps into its own pixel range. */
function relativeHeights(buildings: readonly SkylineBuilding[]): number[] {
  const heights = buildings.map((b) => b.heightM);
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  return heights.map((h) => (max > min ? (h - min) / (max - min) : 0.5));
}

/**
 * Turns one stop's real buildings into the two rendered layers, replacing the
 * old hand-placed FAR_BLOCKS/NEAR_BLOCKS: buildings alternate into far/near
 * by index so each layer gets a mix, height maps from the stop's own real
 * heightM range into that layer's fixed pixel range (see LAYER_CONFIG), and
 * width is a drawing decision per shape. The running x position becomes that
 * layer's tile width — a computed tile instead of a fixed 640/460px one, same
 * tiling/pattern-repeat mechanism as before.
 */
function deriveLayers(buildings: readonly SkylineBuilding[], patternSeed: string): DerivedLayer[] {
  const relatives = relativeHeights(buildings);
  const GAP = 14;

  return LAYER_CONFIG.map((layer, layerIndex) => {
    const rects: Rect[] = [];
    const polys: string[] = [];
    let x = 0;

    buildings.forEach((building, i) => {
      if (i % LAYER_CONFIG.length !== layerIndex) return;
      const h = layer.heightRange[0] + relatives[i] * (layer.heightRange[1] - layer.heightRange[0]);
      const w = widthFor(building);
      const top = TILE_H - h;
      rects.push({ x, y: top, w, h });
      addCap(rects, polys, building.shape, x, w, top);
      x += w + GAP;
    });

    return {
      name: layer.name,
      patternId: `skyline-${layer.name}-${patternSeed}`,
      tilePx: Math.max(x - GAP, 1),
      rects,
      polys,
    };
  });
}

// Pattern ids have to be unique per instance (from/to) and per Skyline
// component on the page — two <pattern>s sharing an id would otherwise both
// resolve url(#…) to whichever defs came first.
const uid = useId();

/**
 * Which two stops' backdrops are in play right now and how far the crossfade
 * between them has progressed — see skylineBlend.ts for why this rides the
 * same worldX-driven computed() the drift transform already uses (rule 5: no
 * new loop/timer/listener).
 */
const blend = computed(() => skylineBlendAt(props.worldX, props.positions, props.stopIds));

function layerStyles(layers: DerivedLayer[]): { transform: string }[] {
  return layers.map((layer, i) => ({
    transform: `translateX(${(-wrappedShiftPx(props.worldX, LAYER_CONFIG[i].pxPerMetre, layer.tilePx)).toFixed(2)}px)`,
  }));
}

// Two full instances (the stop being left, the stop being approached),
// stacked and cross-opacity'd, rather than swapping the layer contents in
// place — that's what turns the stop-to-stop change from a jump-cut into a
// crossfade. Most of a journey between two stops renders `frac` at 0 or 1
// (one instance fully invisible), so this costs nothing extra except right
// at a transition.
const instances = computed(() => {
  const fromBuildings = SKYLINE_BUILDINGS[blend.value.fromId] ?? [];
  const toBuildings = SKYLINE_BUILDINGS[blend.value.toId] ?? [];
  const fromLayers = deriveLayers(fromBuildings, `${uid}-from`);
  const toLayers = deriveLayers(toBuildings, `${uid}-to`);
  return [
    { key: "from", opacity: 1 - blend.value.frac, layers: fromLayers, styles: layerStyles(fromLayers) },
    { key: "to", opacity: blend.value.frac, layers: toLayers, styles: layerStyles(toLayers) },
  ];
});
</script>

<template>
  <div class="skyline" aria-hidden="true">
    <div
      v-for="instance in instances"
      :key="instance.key"
      class="skyline-instance"
      :style="{ opacity: instance.opacity }"
    >
      <div
        v-for="(layer, i) in instance.layers"
        :key="layer.name"
        class="skyline-layer"
        :class="`skyline-${layer.name}`"
        :style="instance.styles[i]"
      >
        <svg
          class="skyline-strip"
          role="presentation"
          :width="SPAN_PX"
          :viewBox="`0 0 ${SPAN_PX} ${TILE_H}`"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              :id="layer.patternId"
              :width="layer.tilePx"
              :height="TILE_H"
              patternUnits="userSpaceOnUse"
            >
              <rect
                v-for="(rect, ri) in layer.rects"
                :key="`r${ri}`"
                class="skyline-shape"
                :x="rect.x"
                :y="rect.y"
                :width="rect.w"
                :height="rect.h"
              />
              <polygon
                v-for="(points, pi) in layer.polys"
                :key="`p${pi}`"
                class="skyline-shape"
                :points="points"
              />
            </pattern>
          </defs>
          <rect :width="SPAN_PX" :height="TILE_H" :fill="`url(#${layer.patternId})`" />
        </svg>
      </div>
    </div>
  </div>
</template>
