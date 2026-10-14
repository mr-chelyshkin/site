<script setup lang="ts">
import { ref } from 'vue'
import { useReveal } from '@/composables/useReveal'

defineProps<{
  sketch: { command: string; from: readonly string[]; image: string; to: string }
}>()

interface Box {
  x: number
  y: number
  w: number
  h: number
  dx: number
  dy: number
}

const LAYOUTS = [
  {
    name: 'wide',
    viewBox: '0 0 480 226',
    term: { w: 176, h: 64, prompt: 12.5 },
    terms: [
      { x: 1, y: 8 },
      { x: 1, y: 148 },
    ],
    wires: ['M177 40 C 236 40, 236 116, 286 116', 'M177 180 C 236 180, 236 116, 286 116'],
    arrow: 'M278 109 L 288 116 L 278 123',
    box: { x: 300, y: 92, w: 110, h: 96, dx: 30, dy: 26 },
    note: { x: 372, y: 220 },
  },
  {
    name: 'tall',
    viewBox: '0 0 300 316',
    term: { w: 146, h: 58, prompt: 10.5 },
    terms: [
      { x: 1, y: 4 },
      { x: 153, y: 4 },
    ],
    wires: ['M74 62 C 74 112, 150 100, 150 144', 'M226 62 C 226 112, 150 100, 150 144'],
    arrow: 'M143 137 L 150 147 L 157 137',
    box: { x: 98, y: 178, w: 100, h: 86, dx: 26, dy: 24 },
    note: { x: 160, y: 304 },
  },
]

const top = ({ x, y, w, dx, dy }: Box) =>
  `${x},${y} ${x + dx},${y - dy} ${x + w + dx},${y - dy} ${x + w},${y}`
const side = ({ x, y, w, h, dx, dy }: Box) =>
  `${x + w},${y} ${x + w + dx},${y - dy} ${x + w + dx},${y + h - dy} ${x + w},${y + h}`

const root = ref<HTMLElement | null>(null)
const drawn = useReveal(root, 0.5)
</script>

<template>
  <div ref="root" class="flyer-sketch" :class="{ 'flyer-sketch--drawn': drawn }" aria-hidden="true">
    <div
      v-for="layout in LAYOUTS"
      :key="layout.name"
      class="flyer-sketch__layout"
      :class="`flyer-sketch__layout--${layout.name}`"
    >
      <svg class="flyer-sketch__svg" :viewBox="layout.viewBox" focusable="false">
        <g
          v-for="(at, i) in layout.terms"
          :key="i"
          class="flyer-sketch__source"
          :style="{ '--delay': `${i * 120}ms` }"
        >
          <rect
            class="flyer-sketch__term"
            :x="at.x"
            :y="at.y"
            :width="layout.term.w"
            :height="layout.term.h"
            rx="5"
          />
          <circle
            v-for="dot in 3"
            :key="dot"
            class="flyer-sketch__dot"
            :cx="at.x + 3 + dot * 9"
            :cy="at.y + 12"
            r="2.6"
          />
          <text
            class="flyer-sketch__where"
            :x="at.x + layout.term.w - 9"
            :y="at.y + 15"
            text-anchor="end"
          >
            {{ sketch.from[i] }}
          </text>
          <text
            class="flyer-sketch__prompt"
            :x="at.x + 12"
            :y="at.y + layout.term.h - 18"
            :style="{ fontSize: `${layout.term.prompt}px` }"
          >
            <tspan class="flyer-sketch__dollar">$</tspan>
            {{ sketch.command }}
          </text>
        </g>
        <path
          v-for="(d, i) in layout.wires"
          :key="i"
          class="flyer-sketch__wire"
          pathLength="1"
          :d="d"
          :style="{ '--delay': `${i * 120}ms` }"
        />
        <path class="flyer-sketch__wire flyer-sketch__arrow" pathLength="1" :d="layout.arrow" />
        <g class="flyer-sketch__box">
          <polygon class="flyer-sketch__face flyer-sketch__face--top" :points="top(layout.box)" />
          <polygon class="flyer-sketch__face flyer-sketch__face--side" :points="side(layout.box)" />
          <rect
            class="flyer-sketch__face flyer-sketch__face--front"
            :x="layout.box.x"
            :y="layout.box.y"
            :width="layout.box.w"
            :height="layout.box.h"
          />
          <text
            class="flyer-sketch__image"
            :x="layout.box.x + layout.box.w / 2"
            :y="layout.box.y + layout.box.h / 2 + 5"
            text-anchor="middle"
          >
            {{ sketch.image }}
          </text>
        </g>
        <text class="flyer-sketch__note" :x="layout.note.x" :y="layout.note.y" text-anchor="middle">
          {{ sketch.to }}
        </text>
      </svg>
    </div>
  </div>
</template>
