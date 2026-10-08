<script setup lang="ts">
import { computed, useId } from 'vue'
import face from '@/assets/images/hero-face.png'
import type { Company } from '@/contents'
import { seeded } from '@/utils/seeded'

/** A thermal-printed visitor's label in a soft vinyl sleeve, on a bulldog clip. */
const props = defineProps<{ company: Company; number: string; holder: string; nameId: string }>()

const QR_SIZE = 21
// The corners where a QR code keeps its three finder squares.
const FINDERS = [
  [0, 0],
  [QR_SIZE - 7, 0],
  [0, QR_SIZE - 7],
] as const

// Whether a QR cell belongs to a finder square: 1 printed, 0 blank (the square's
// white ring and the quiet ring round it), -1 a data cell.
function finderCell(x: number, y: number) {
  for (const [fx, fy] of FINDERS) {
    const dx = x - fx
    const dy = y - fy
    if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {
      if (dx < 0 || dx > 6 || dy < 0 || dy > 6) return 0
      const ring = dx === 0 || dx === 6 || dy === 0 || dy === 6
      const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
      return ring || core ? 1 : 0
    }
  }
  return -1
}

// Something that looks like a QR code, the same on every visit: the finder
// squares, and seeded data cells. One path, as one shape paints faster than
// hundreds of cells.
const qr = computed(() => {
  const rand = seeded(`${props.company.name}:qr`)
  let d = ''
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      const cell = finderCell(x, y)
      if (cell === 1 || (cell === -1 && rand() > 0.52)) d += `M${x} ${y}h1v1h-1z`
    }
  }
  return d
})

const purpose = computed(() => props.company.note.replace(/\.$/, ''))
// Printed on one line: every space in the name becomes a non-breaking one.
const guest = computed(() => props.holder.replace(/ /g, '\u00a0'))
// Six passes share the page, so a filter's id is the pass's own.
const soft = `${useId()}-soft`
</script>

<template>
  <span class="pass-visitor__clip" aria-hidden="true" />
  <div class="pass__body pass-visitor">
    <div class="pass-visitor__label">
      <!-- First, so a screen reader meets the company before the rest; the grid
           still shows the title above it, and "Host" over it. -->
      <div class="pass-visitor__lines">
        <h3 :id="nameId" class="pass-visitor__name">{{ company.name }}</h3>
        <p class="pass-visitor__line pass-visitor__host" aria-hidden="true">Host</p>
        <p class="pass-visitor__line">Purpose: {{ purpose }}</p>
        <p class="pass-visitor__line">Guest: {{ guest }}</p>
      </div>
      <p class="pass-visitor__title" aria-hidden="true">
        <span class="pass-visitor__kicker">{{ company.kicker }}</span
        >{{ ' ' }}<small class="pass-visitor__access">Access {{ number }}</small>
      </p>
      <!-- Not draggable, so pulling a pass by its photo pulls the pass. -->
      <img class="pass-visitor__face" :src="face" alt="" width="42" height="56" draggable="false" />
      <svg
        class="pass-visitor__qr"
        :viewBox="`0 0 ${QR_SIZE} ${QR_SIZE}`"
        shape-rendering="crispEdges"
        aria-hidden="true"
        focusable="false"
      >
        <path :d="qr" />
      </svg>
      <p class="pass-visitor__foot">
        <span>{{ company.role }}</span
        >{{ ' ' }}<span aria-hidden="true">Valid today</span>
      </p>
    </div>
    <!-- Soft creases in the vinyl, catching the light. -->
    <svg
      class="pass-visitor__wrinkles"
      viewBox="0 0 206 178"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter :id="soft"><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>
      <g
        fill="none"
        stroke="rgb(255 255 255 / 22%)"
        stroke-linecap="round"
        :filter="`url(#${soft})`"
      >
        <path d="M14 40 C60 30 90 58 150 44 S196 52 200 70" stroke-width="5" />
        <path d="M6 128 C50 120 80 140 130 126" stroke-width="7" />
      </g>
      <g fill="none" stroke="rgb(255 255 255 / 40%)" stroke-width="0.8" stroke-linecap="round">
        <path d="M150 20 C164 40 170 70 166 110" />
        <path d="M22 70 C40 66 52 74 70 70" />
      </g>
    </svg>
    <span class="pass__gloss" aria-hidden="true" />
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
