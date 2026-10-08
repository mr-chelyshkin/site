<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

interface Band {
  /** Top of the band, in percent of the photo's height. */
  at: number
  /** In percent of the photo's height. */
  height: number
  /** Sideways slip, in percent of the photo's width. */
  shift: number
}

/**
 * A 1-bit render from `scripts/optimize-images.js`, scaled up without
 * smoothing, with bands where the cyan channel slips and one smeared row.
 */
const props = withDefaults(
  defineProps<{
    image: string
    alt: string
    /** The render's own size in pixels. */
    width: number
    height: number
    bands?: readonly Band[]
    /** A band filled with one row of the render; `row` counts its rows from 0 at the top. */
    smear?: Band & { row: number }
    /** Above the fold: loaded at once and first. */
    priority?: boolean
  }>(),
  { bands: () => [], priority: false },
)

const renders = import.meta.glob<string>('../../assets/images/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})
const url = (name: string) => {
  const found = renders[`../../assets/images/${name}.png`]
  if (!found) throw new Error(`Image render not found: ${name} (run npm run optimize-images)`)
  return found
}
const base = computed(() => url(props.image))
const ghost = computed(() => (props.bands.length ? url(`${props.image}-cyan`) : ''))
// The render stretched to `height` bands tall, so each of its rows fills the band,
// and positioned so that the band shows row `row`.
const smearStyle = computed<CSSProperties>(() => {
  const smear = props.smear
  if (!smear) return {}
  return {
    backgroundImage: `url(${base.value})`,
    backgroundSize: `100% ${props.height * 100}%`,
    backgroundPosition: `0 ${(smear.row / (props.height - 1)) * 100}%`,
    top: `${smear.at}%`,
    height: `${smear.height}%`,
    translate: `${smear.shift}% 0`,
  }
})
</script>

<template>
  <div class="c-dither">
    <!-- `loading` precedes `src` so the first request already knows when to load. -->
    <img
      class="c-dither__base"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      :decoding="priority ? 'auto' : 'async'"
      :width="width"
      :height="height"
      :src="base"
      :alt="alt"
    />
    <span
      v-for="(band, i) in bands"
      :key="i"
      class="c-dither__layer c-dither__ghost"
      :style="{
        backgroundImage: `url(${ghost})`,
        clipPath: `inset(${band.at}% 0 ${100 - band.at - band.height}% 0)`,
        translate: `${band.shift}% 0`,
      }"
      aria-hidden="true"
    />
    <span
      v-if="smear"
      class="c-dither__layer c-dither__smear"
      :style="smearStyle"
      aria-hidden="true"
    />
  </div>
</template>
