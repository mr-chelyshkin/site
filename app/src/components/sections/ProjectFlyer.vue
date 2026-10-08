<script setup lang="ts">
import { computed } from 'vue'
import BarCode from '@/components/ui/BarCode.vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import QrSticker from '@/components/ui/QrSticker.vue'
import type { Project } from '@/contents'

const props = defineProps<{
  project: Project
  /** Place on the board: picks the tilt and the torn edge, and the paste-in order. */
  order: number
}>()

const STOCKS = ['paper', 'cyan', 'ink'] as const
const TILTS = [-1.6, 2.3, -0.8]
// Advance widths of Big Shoulders Display 900 capitals, digits and common
// punctuation in em, as measured in Chrome; anything else counts as a
// generous 0.55em, so an unknown character errs small.
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
const tilt = computed(() => TILTS[props.order % TILTS.length] ?? 0)
// A sticker needs a code and a first link for it to open.
const sticker = computed(() => {
  const link = props.project.links[0]
  return props.project.qr && link
    ? { code: props.project.qr, href: link.href, label: link.label }
    : null
})
// The name fills the sheet's width: its font size is `fit` times that width.
// The 0.97 leaves room for kerning.
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
    :class="[`flyer--${stock}`, { 'flyer--with-qr': sticker }]"
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
      <p class="flyer__summary">{{ project.summary }}</p>
      <dl class="flyer__specs">
        <template v-for="(spec, i) in project.specs" :key="i">
          <dt class="flyer__spec-term">{{ spec.term }}</dt>
          <dd>{{ spec.value }}</dd>
        </template>
      </dl>
      <!-- The role, because Safari drops list semantics under `list-style: none`. -->
      <ul v-if="project.links.length" class="flyer__links" role="list">
        <li v-for="link in project.links" :key="link.href">
          <a
            class="flyer__link"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`${link.label}: ${project.name} (opens in a new tab)`"
            >{{ link.label }} ↗</a
          >
        </li>
      </ul>
      <BarCode v-if="stock === 'paper'" class="flyer__barcode" :seed="project.name" vertical />
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
