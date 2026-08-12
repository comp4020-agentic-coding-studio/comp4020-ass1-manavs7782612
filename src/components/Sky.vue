<script setup lang="ts">
// The backdrop behind the journey: a full-bleed sky whose colour is the *real*
// sky over whichever city the visitor is currently looking at, right now.
// Elevation of the sun comes from the city's latitude/longitude and this
// instant via `sun.ts` — real astronomy, zero requests, nothing pre-baked
// (harness rule 4).
//
// `new Date()` is read inside a `computed`, which means it is sampled once per
// city change rather than once per animation frame: the sun climbs about a
// quarter of a degree a minute, so a browsing session cannot see the
// difference, and the one rAF loop in `useCamera.ts` stays the only thing
// running (harness rule 5). No listener, no timer, no interval here.
//
// Every colour lives in `src/styles/sky.css`, keyed off the `sky-<phase>`
// class on the root element — the component's only output is which phase it
// is, so stylelint can see the whole palette (CLAUDE.md, "Stack facts").
import { computed } from "vue";
import { CITIES } from "../data/cities";
import type { City } from "../data/types";
import { skyPhase, solarElevation, type SkyPhase } from "../scene/sun";
import "../styles/sky.css";

/** Painted when `cityKey` names a city that isn't in the dataset. */
const FALLBACK_CITY_KEY = "canberra";

const props = defineProps<{
  /** Key into `CITIES` — the city whose local sky this layer paints. */
  cityKey: string;
}>();

// Defensive: an unknown key paints Canberra (where the journey starts) rather
// than throwing and taking the whole scene down with it.
const city = computed<City>(() => {
  const found: City | undefined = CITIES[props.cityKey];
  return found ?? CITIES[FALLBACK_CITY_KEY];
});

/** Degrees of the sun above that city's horizon at this moment. */
const elevationDeg = computed(() => solarElevation(new Date(), city.value.lat, city.value.lon));

/** Which twilight band that elevation falls in — the only thing the CSS needs. */
const phase = computed<SkyPhase>(() => skyPhase(elevationDeg.value));

// Handy for a parent that wants to label the sky ("nautical twilight in Dubai")
// without recomputing the astronomy.
defineExpose({ phase, elevationDeg, city });
</script>

<template>
  <div class="sky" :class="`sky-${phase}`" aria-hidden="true">
    <div class="sky-stars"></div>
    <div class="sky-stars sky-stars-far"></div>
  </div>
</template>
