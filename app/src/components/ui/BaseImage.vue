<script setup lang="ts">
import { computed, ref } from 'vue'
import imageWidths from '@/assets/image-widths.json'

const props = withDefaults(
  defineProps<{
    /** Name of a photo in `assets/images-source/`, without its extension. */
    src: string
    alt: string
    /** Intrinsic size, so the layout holds its space before the file loads. */
    width: number
    height: number
    /** Generated width used for the plain `src` fallback. */
    assetWidth?: number
    sizes?: string
    /** Above-the-fold images load eagerly and with high fetch priority. */
    priority?: boolean
  }>(),
  {
    assetWidth: 800,
    sizes: '(max-width: 768px) 400px, (max-width: 1200px) 800px, 1200px',
    priority: false,
  },
)

// `scripts/optimize-images.js` writes one `<name>-<width>.webp` per width.
const imageUrls = import.meta.glob<string>('../../assets/images/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

const imageUrl = (width: number) => {
  const path = `../../assets/images/${props.src}-${width}.webp`
  const url = imageUrls[path]

  if (!url) throw new Error(`Image asset not found: ${path}`)

  return url
}

const fallbackSrc = computed(() => imageUrl(props.assetWidth))
const srcset = computed(() => imageWidths.map((width) => `${imageUrl(width)} ${width}w`).join(', '))

const isLoaded = ref(false)
const hasError = ref(false)

const handleLoad = () => {
  hasError.value = false
  isLoaded.value = true
}
const handleError = () => {
  hasError.value = true
}
</script>

<template>
  <!-- `srcset`, `sizes` and `loading` precede `src` so the first request
       already knows how to choose and when to load. -->
  <img
    :srcset="srcset"
    :sizes="sizes"
    :loading="priority ? 'eager' : 'lazy'"
    :fetchpriority="priority ? 'high' : 'auto'"
    :width="width"
    :height="height"
    :src="fallbackSrc"
    :alt="alt"
    class="c-image"
    :class="{ 'c-image--loaded': isLoaded, 'c-image--error': hasError }"
    @load="handleLoad"
    @error="handleError"
  />
</template>
