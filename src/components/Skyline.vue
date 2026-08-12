<script setup lang="ts">
// A decorative parallax backdrop for the journey: a generic distant skyline
// that drifts sideways *slower* than the twenty tracked buildings, so the world
// reads as having depth instead of being one flat plane.
//
// It is deliberately not a depiction of anywhere. The tracked buildings carry
// the real, sourced heights (harness rule 1); this layer carries no
// information at all, which is why it's aria-hidden and why nothing here is
// conveyed by colour or motion alone (rule 2). Shapes are inline SVG, so there
// is no image to request (rule 4).
//
// It owns no loop, no timer and no listener (rule 5): the whole thing is a
// function of the `worldX` prop the parent hands it from the camera, and the
// one rAF loop in src/scene/useCamera.ts is what makes that prop change.
import { computed, useId } from "vue";
import "../styles/skyline.css";

const props = defineProps<{
  /**
   * The camera's world position along the ground, in metres — the same
   * `camera.x` (`CameraFrame.x`, src/scene/camera.ts) the buildings are drawn
   * from. Metres, not pixels: the parallax factors below are the only place
   * that conversion happens for this layer.
   */
  worldX: number;
}>();

type Cap = "flat" | "pitch" | "spire" | "step";

interface Block {
  x: number;
  w: number;
  h: number;
  cap: Cap;
}

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

const block = (x: number, w: number, h: number, cap: Cap = "flat"): Block => ({ x, w, h, cap });

// Hand-authored so the repeat is deterministic (no Math.random anywhere in the
// scene). Every shape, cap included, stays inside [0, tile] x [0, TILE_H] —
// a <pattern> clips at its tile edge, and a clipped tower reads as a mistake.
const FAR_BLOCKS: readonly Block[] = [
  block(0, 54, 52),
  block(58, 38, 68),
  block(100, 64, 44),
  block(168, 30, 78, "spire"),
  block(202, 46, 58),
  block(252, 72, 38),
  block(328, 34, 66, "pitch"),
  block(366, 52, 50),
  block(422, 40, 84),
  block(466, 58, 46),
  block(528, 36, 62, "step"),
  block(568, 68, 40),
];

const NEAR_BLOCKS: readonly Block[] = [
  block(0, 40, 58),
  block(44, 28, 76),
  block(76, 52, 48),
  block(132, 24, 80, "spire"),
  block(160, 46, 62, "step"),
  block(210, 34, 52, "pitch"),
  block(248, 58, 70),
  block(310, 30, 44),
  block(344, 44, 82),
  block(392, 26, 56, "pitch"),
  block(422, 34, 66),
];

/** Turns blocks into flat lists of SVG primitives, so the template stays dumb. */
function shapesFor(blocks: readonly Block[]): { rects: Rect[]; polys: string[] } {
  const rects: Rect[] = [];
  const polys: string[] = [];

  for (const b of blocks) {
    const top = TILE_H - b.h;
    rects.push({ x: b.x, y: top, w: b.w, h: b.h });

    if (b.cap === "spire") {
      const mast = 2.6;
      rects.push({ x: b.x + b.w / 2 - mast / 2, y: top - 12, w: mast, h: 12 });
    } else if (b.cap === "step") {
      rects.push({ x: b.x + b.w * 0.22, y: top - 9, w: b.w * 0.56, h: 9 });
    } else if (b.cap === "pitch") {
      const rise = Math.min(b.w * 0.3, 12);
      polys.push(`${b.x},${top} ${b.x + b.w / 2},${top - rise} ${b.x + b.w},${top}`);
    }
  }

  return { rects, polys };
}

// Two layers at different rates and different tile widths: the depth cue is
// the *difference* between them, and mismatched periods keep the two repeats
// from lining up into one obvious tile. Both rates are a small fraction of the
// foreground's 1:1, which is the whole parallax trick — this layer only
// drifts, it never zooms (the buildings' scale is not its business).
const LAYERS = [
  { name: "far", tilePx: 640, pxPerMetre: 0.06, blocks: FAR_BLOCKS },
  { name: "near", tilePx: 460, pxPerMetre: 0.11, blocks: NEAR_BLOCKS },
] as const;

// Pattern ids have to be unique per instance: two Skylines on one page would
// otherwise both resolve url(#…) to whichever defs came first.
const uid = useId();

const layers = LAYERS.map((layer) => ({
  name: layer.name,
  tilePx: layer.tilePx,
  patternId: `skyline-${layer.name}-${uid}`,
  ...shapesFor(layer.blocks),
}));

/**
 * How far left to slide a layer, in px, wrapped into one tile width. The
 * pattern repeats every `tilePx`, so a shift of `n * tilePx` is
 * indistinguishable from no shift — taking the offset modulo the tile keeps
 * the number small and the drift seamless however far the journey runs.
 */
function wrappedShiftPx(worldX: number, pxPerMetre: number, tilePx: number): number {
  const drift = worldX * pxPerMetre;
  if (!Number.isFinite(drift)) return 0;
  return ((drift % tilePx) + tilePx) % tilePx;
}

const layerStyles = computed(() =>
  LAYERS.map((layer) => ({
    transform: `translateX(${(-wrappedShiftPx(props.worldX, layer.pxPerMetre, layer.tilePx)).toFixed(2)}px)`,
  })),
);
</script>

<template>
  <div class="skyline" aria-hidden="true">
    <div
      v-for="(layer, i) in layers"
      :key="layer.name"
      class="skyline-layer"
      :class="`skyline-${layer.name}`"
      :style="layerStyles[i]"
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
</template>
