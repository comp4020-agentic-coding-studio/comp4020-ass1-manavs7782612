<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { Lifecycle } from "./lifecycle";

// Spike: proves the Vue + vue-tsc + oxlint toolchain end to end before the
// real scene lands on top of it.
const scope = new Lifecycle();
const width = ref(window.innerWidth);

scope.on(
  window,
  "resize",
  () => {
    width.value = window.innerWidth;
  },
  { passive: true },
);

onBeforeUnmount(() => scope.close());
</script>

<template>
  <p data-testid="spike">Scene mounts here (viewport {{ width }}px).</p>
</template>
