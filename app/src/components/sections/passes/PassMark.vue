<script setup lang="ts">
import { computed } from 'vue'

/**
 * The company's logo where a photo would be, in the pass's own ink: the logo's
 * shape masks the current color, so each kind prints, etches or screens it its
 * own way. The shapes come from scripts/optimize-images.js; a company without
 * one leaves the place blank.
 */
const props = defineProps<{ name: string }>()

const masks = import.meta.glob<string>('../../../assets/images/logos/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
const mask = computed(() => masks[`../../../assets/images/logos/${slug(props.name)}.png`])
</script>

<template>
  <span class="pass__mark" aria-hidden="true">
    <span v-if="mask" class="pass__mark-ink" :style="{ '--logo': `url(${mask})` }" />
  </span>
</template>
