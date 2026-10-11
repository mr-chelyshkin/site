<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

interface Band {
  at: number
  height: number
  shift: number
}

const props = withDefaults(
  defineProps<{
    image: string
    alt: string
    width: number
    height: number
    bands?: readonly Band[]
    smear?: Band & { row: number }
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
