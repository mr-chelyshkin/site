<script setup lang="ts">
/** Embossed label-maker tape: a link when `href` is set, otherwise a decorative tag. */
withDefaults(defineProps<{ text: string; href?: string; tilt?: number }>(), { tilt: 0 })
</script>

<template>
  <a
    v-if="href"
    class="c-label c-label--link"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="`${text} (opens in a new tab)`"
    :style="{ '--tilt': `${tilt}deg` }"
    >{{ text }} ↗</a
  >
  <span v-else class="c-label" :style="{ '--tilt': `${tilt}deg` }" aria-hidden="true">{{
    text
  }}</span>
</template>
