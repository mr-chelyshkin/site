<script setup lang="ts">
import { computed } from 'vue'
import { seeded } from '@/utils/seeded'

/**
 * Decorative bars, the same for the same seed. The wrapper takes whatever box
 * the caller gives it and the bars stretch to fill it.
 */
const props = withDefaults(defineProps<{ seed: string; vertical?: boolean }>(), { vertical: false })

const LENGTH = 120
const bars = computed(() => {
  const rand = seeded(`${props.seed}:bars`)
  const out: { at: number; size: number }[] = []
  for (let at = 0; at < LENGTH; ) {
    const size = 1 + Math.floor(rand() * 3)
    if (rand() > 0.4) out.push({ at, size })
    at += size + 1
  }
  return out
})
</script>

<template>
  <span class="c-barcode" aria-hidden="true">
    <svg
      class="c-barcode__bars"
      :viewBox="vertical ? `0 0 10 ${LENGTH}` : `0 0 ${LENGTH} 10`"
      preserveAspectRatio="none"
      focusable="false"
    >
      <rect
        v-for="bar in bars"
        :key="bar.at"
        v-bind="
          vertical
            ? { x: 0, y: bar.at, width: 10, height: bar.size }
            : { x: bar.at, y: 0, width: bar.size, height: 10 }
        "
      />
    </svg>
  </span>
</template>
