<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import coffeeStain from '@/assets/images/coffee-stain.webp'
import crtSticker from '@/assets/images/crt-sticker.webp'
import keyboardSticker from '@/assets/images/keyboard-sticker.webp'
import bookSticker from '@/assets/images/book-sticker.webp'
import FlyerSketch from '@/components/sections/FlyerSketch.vue'
import BarCode from '@/components/ui/BarCode.vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import QrSticker from '@/components/ui/QrSticker.vue'
import type { Project } from '@/contents'

const props = defineProps<{
  project: Project
  order: number
}>()

const STOCKS = ['paper', 'cyan', 'ink', 'grid'] as const
const PHOTOS: Partial<Record<string, { src: string; width: number; height: number }>> = {
  crt: { src: crtSticker, width: 520, height: 481 },
  keyboard: { src: keyboardSticker, width: 560, height: 395 },
  book: { src: bookSticker, width: 360, height: 467 },
}
const TILTS = [-1.6, 2.3, -0.8]
const ADVANCES: Partial<Record<string, number>> = {
  A: 0.478,
  B: 0.472,
  C: 0.49,
  D: 0.495,
  E: 0.408,
  F: 0.406,
  G: 0.493,
  H: 0.485,
  I: 0.23,
  J: 0.453,
  K: 0.497,
  L: 0.402,
  M: 0.745,
  N: 0.543,
  O: 0.497,
  P: 0.471,
  Q: 0.497,
  R: 0.477,
  S: 0.474,
  T: 0.419,
  U: 0.487,
  V: 0.494,
  W: 0.8,
  X: 0.471,
  Y: 0.465,
  Z: 0.418,
  0: 0.507,
  1: 0.274,
  2: 0.49,
  3: 0.504,
  4: 0.511,
  5: 0.515,
  6: 0.499,
  7: 0.485,
  8: 0.501,
  9: 0.499,
  '-': 0.446,
  '.': 0.25,
  '/': 0.41,
  '&': 0.619,
  '+': 0.536,
  ' ': 0.202,
}

const stock = computed(() => STOCKS.find((s) => s === props.project.stock) ?? 'paper')
const photos = computed(() =>
  (props.project.photos ?? []).flatMap((key) => {
    const photo = PHOTOS[key]
    return photo ? [{ key, ...photo }] : []
  }),
)
const summary = computed(() =>
  props.project.summary
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((text) =>
      text.length > 2 && text.startsWith('*') && text.endsWith('*')
        ? { text: text.slice(1, -1), mark: true }
        : { text, mark: false },
    ),
)
const tilt = computed(() => TILTS[props.order % TILTS.length] ?? 0)
const sticker = computed(() => {
  const link = props.project.links[0]
  return props.project.qr && link
    ? { code: props.project.qr, href: link.href, label: link.label }
    : null
})
const fit = computed(() => {
  const em = [...props.project.name.toUpperCase()].reduce(
    (sum, c) => sum + (ADVANCES[c] ?? 0.55),
    0,
  )
  return (0.97 / em).toFixed(4)
})
</script>

<template>
  <PastedSheet
    as="article"
    class="flyer"
    :class="[`flyer--${stock}`, { 'flyer--with-qr': sticker, 'flyer--with-photos': photos.length }]"
    :seed="project.name"
    :stock="stock"
    :torn="order % 2 ? ['top'] : ['bottom']"
    :tape="['top']"
    :tilt="tilt"
    :order="order"
    :style="{ '--fit': fit }"
  >
    <div class="flyer__body">
      <p class="c-kicker">
        <template v-for="(part, i) in project.kicker" :key="i">
          <span>{{ part }}</span
          >{{ ' ' }}
        </template>
      </p>
      <h3 class="flyer__name">{{ project.name }}</h3>
      <FlyerSketch v-if="project.sketch" class="flyer__sketch" :sketch="project.sketch" />
      <div class="flyer__spread">
        <div v-if="photos.length" class="flyer__photos">
          <img
            v-for="photo in photos"
            :key="photo.key"
            class="flyer__photo"
            :class="`flyer__photo--${photo.key}`"
            :src="photo.src"
            alt=""
            :width="photo.width"
            :height="photo.height"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="flyer__text">
          <p class="flyer__summary">
            <template v-for="(part, i) in summary" :key="i">
              <span v-if="part.mark" class="flyer__mark">{{ part.text }}</span>
              <template v-else>{{ part.text }}</template>
            </template>
          </p>
          <ul v-if="project.points?.length" class="flyer__points" role="list">
            <li v-for="point in project.points" :key="point" class="flyer__point">{{ point }}</li>
          </ul>
          <dl v-if="project.specs.length" class="flyer__specs">
            <template v-for="(spec, i) in project.specs" :key="i">
              <dt class="flyer__spec-term">{{ spec.term }}</dt>
              <dd class="flyer__spec-value">{{ spec.value }}</dd>
            </template>
          </dl>
          <ul v-if="project.links.length" class="flyer__links" role="list">
            <li v-for="link in project.links" :key="link.href">
              <RouterLink v-if="link.href.startsWith('/')" class="flyer__link" :to="link.href"
                >{{ link.label }} →</RouterLink
              >
              <a
                v-else
                class="flyer__link"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`${link.label}: ${project.name} (opens in a new tab)`"
                >{{ link.label }} ↗</a
              >
            </li>
          </ul>
        </div>
      </div>
      <BarCode v-if="stock === 'paper'" class="flyer__barcode" :seed="project.name" vertical />
      <img
        v-if="project.stain"
        class="flyer__stain"
        :src="coffeeStain"
        alt=""
        width="480"
        height="600"
        loading="lazy"
        decoding="async"
      />
    </div>
    <template v-if="sticker" #over>
      <QrSticker
        class="flyer__qr"
        :code="sticker.code"
        :href="sticker.href"
        :label="`Scan → ${sticker.label}`"
      />
    </template>
  </PastedSheet>
</template>
