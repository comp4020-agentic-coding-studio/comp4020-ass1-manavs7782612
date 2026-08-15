<script setup lang="ts">
// The backdrop behind the journey: a full-bleed sky in one of the five
// standard twilight bands. Which band is the parent's call (App.vue derives
// it from how far along the twenty-stop journey the visitor is, via
// src/scene/journeyPhase.ts) — this component only paints it.
//
// Every colour lives in `src/styles/sky.css`, keyed off the `sky-<phase>`
// class on the root element, so stylelint can see the whole palette
// (CLAUDE.md, "Stack facts").
import type { SkyPhase } from "../scene/sun";
import "../styles/sky.css";

defineProps<{
  /** Which of the five twilight bands to paint. */
  phase: SkyPhase;
}>();
</script>

<template>
  <div class="sky" :class="`sky-${phase}`" aria-hidden="true">
    <div class="sky-stars"></div>
    <div class="sky-stars sky-stars-far"></div>
  </div>
</template>
