<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** File name in `assets/qr/`, from `scripts/qr.swift`. */
  code: string
  href: string
  label: string
}>()

const codes = import.meta.glob<string>('../../assets/qr/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})
const src = computed(() => {
  const url = codes[`../../assets/qr/${props.code}.png`]
  if (!url) throw new Error(`QR code not found: ${props.code}`)
  return url
})
</script>

<template>
  <!-- A scan target for a phone. Keyboards and screen readers use the links
       printed on the flyer, so the sticker stays out of their way. -->
  <a
    class="c-qr"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    tabindex="-1"
    aria-hidden="true"
  >
    <img class="c-qr__code" :src="src" alt="" width="130" height="130" />
    <span class="c-qr__label">{{ label }}</span>
  </a>
</template>
