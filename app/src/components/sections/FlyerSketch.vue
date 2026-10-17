<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useReveal } from '@/composables/useReveal'
import type { ProjectSketch, SketchNote } from '@/contents'

const props = defineProps<{
  sketch: ProjectSketch
}>()

interface Layout {
  name: string
  width: number
  top: number
  height: number
  cx: number
  half: number
  text: number
  fit: { title: number; body: number }
  middles: readonly number[]
  caption: { x: number; y: number }
}

const ARROWS = [
  [22, 44],
  [80, 96],
  [132, 148],
  [184, 208],
  [238, 272],
] as const
const BOXES = [48, 100, 152] as const
const NOTE_DELAYS = [950, 1200, 2150]
const TITLE_LEAD = 24
const BODY_GAP = 22
const BODY_LEAD = 22

const LAYOUTS: Layout[] = [
  {
    name: 'wide',
    width: 484,
    top: 0,
    height: 322,
    cx: 120,
    half: 48,
    text: 200,
    fit: { title: 32, body: 41 },
    middles: [45, 116, 303],
    caption: { x: 330, y: 12 },
  },
  {
    name: 'tall',
    width: 348,
    top: -20,
    height: 368,
    cx: 112,
    half: 40,
    text: 184,
    fit: { title: 18, body: 24 },
    middles: [42, 130, 303],
    caption: { x: 184, y: -4 },
  },
]

const pencilArrow = (from: number, to: number) =>
  `M0 ${from} V${to} M-4 ${to - 6} L0 ${to} L4 ${to - 6}`
const penArrow = (from: number, to: number) => {
  const len = to - from
  return `M1 ${from} C 0 ${from + len * 0.35}, 2 ${from + len * 0.65}, 1 ${to + 1} M-3 ${to - 5} L1 ${to + 1} L5 ${to - 5}`
}

const join = (atoms: readonly string[], max: number) =>
  atoms.reduce<string[]>((lines, atom) => {
    const last = lines.at(-1)
    if (last !== undefined && last.length + atom.length < max) {
      lines[lines.length - 1] = `${last} ${atom}`
    } else {
      lines.push(atom)
    }
    return lines
  }, [])

function place(note: SketchNote, fit: Layout['fit'], middle: number) {
  const title = join(note.title, fit.title)
  const body = join(note.body, fit.body)
  const bodyTop = (title.length - 1) * TITLE_LEAD + BODY_GAP
  const span = body.length ? bodyTop + (body.length - 1) * BODY_LEAD : bodyTop - BODY_GAP
  const top = middle - span / 2
  return {
    title: title.map((text, i) => ({ text, y: top + i * TITLE_LEAD })),
    body: body.map((text, i) => ({ text, y: top + bodyTop + i * BODY_LEAD })),
  }
}

const layouts = computed(() =>
  LAYOUTS.map((layout) => {
    const { width: w, cx, half, text } = layout
    const brace = cx + half + 8
    return {
      ...layout,
      notes: props.sketch.notes.map((note, i) => ({
        ...place(note, layout.fit, layout.middles[i] ?? 0),
        delay: NOTE_DELAYS[i] ?? 0,
      })),
      pointer: `M${text - 4} 26 C ${text - 30} 20, ${cx + 26} 26, ${cx + 10} 33 M${cx + 16} 27 L${cx + 9} 33 L${cx + 17} 37`,
      brace: `M${brace} 50 q8 0 8 8 V108 q0 8 8 8 q-8 0 -8 8 V176 q0 8 -8 8`,
      frame: `M${-half - 6} 271 L${half + 6} 270 L${half + 8} 314 L${-half - 5} 315 Z`,
      tape: `M0 244 H${w} L${w - 4} 248 L${w} 252 L${w - 4} 256 L${w} 260 L${w - 4} 264 L${w} 267 H0 L4 263 L0 259 L4 255 L0 251 L4 247 Z`,
    }
  }),
)

const label = computed(() =>
  props.sketch.notes.map(({ title, body }) => [...title, ...body].join(' ')).join('. '),
)

const uid = useId()
const root = ref<HTMLElement | null>(null)
const drawn = useReveal(root, 0.5)
</script>

<template>
  <div
    ref="root"
    class="flyer-sketch"
    :class="{ 'flyer-sketch--drawn': drawn }"
    role="img"
    :aria-label="label"
  >
    <div
      v-for="layout in layouts"
      :key="layout.name"
      class="flyer-sketch__layout"
      :class="`flyer-sketch__layout--${layout.name}`"
    >
      <svg
        class="flyer-sketch__svg"
        :viewBox="`0 ${layout.top} ${layout.width} ${layout.height}`"
        focusable="false"
        aria-hidden="true"
      >
        <defs>
          <filter :id="`${uid}-${layout.name}`" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="2.4" />
          </filter>
        </defs>

        <g :transform="`rotate(-1.2 ${layout.width / 2} 255)`">
          <path class="flyer-sketch__tape" :d="layout.tape" />
        </g>
        <text class="flyer-sketch__split" x="4" y="244">{{ sketch.split.above }}</text>
        <text class="flyer-sketch__split" x="4" y="298">{{ sketch.split.below }}</text>
        <text class="flyer-sketch__caption" :x="layout.caption.x" :y="layout.caption.y">
          {{ sketch.caption }}
        </text>

        <g :transform="`translate(${layout.cx} 0)`">
          <g class="flyer-sketch__pencil" :filter="`url(#${uid}-${layout.name})`">
            <path v-for="[from, to] in ARROWS" :key="from" :d="pencilArrow(from, to)" />
            <rect
              v-for="y in BOXES"
              :key="y"
              class="flyer-sketch__box"
              :x="-layout.half"
              :y="y"
              :width="layout.half * 2"
              height="32"
              rx="3"
            />
            <circle cx="0" cy="224" r="14" />
            <path d="M-7 224.5 L-2 229.5 L7 218.5" />
            <rect
              class="flyer-sketch__box"
              :x="-layout.half"
              y="276"
              :width="layout.half * 2"
              height="32"
              rx="3"
            />
          </g>
          <text class="flyer-sketch__label" x="0" y="14">{{ sketch.trigger }}</text>
          <text v-for="(y, i) in BOXES" :key="y" class="flyer-sketch__label" x="0" :y="y + 20.5">
            {{ sketch.tasks[i] }}
          </text>
          <text class="flyer-sketch__label" x="0" y="296.5">{{ sketch.deploy }}</text>

          <g class="flyer-sketch__pen" :filter="`url(#${uid}-${layout.name})`">
            <path
              v-for="([from, to], i) in ARROWS"
              :key="from"
              class="flyer-sketch__stroke"
              pathLength="1"
              :d="penArrow(from, to)"
              :style="{ '--delay': `${250 + i * 110}ms` }"
            />
            <path
              class="flyer-sketch__stroke flyer-sketch__stroke--strike"
              pathLength="1"
              d="M-23 170 C -10 169, 8 168, 24 166"
            />
            <path
              class="flyer-sketch__stroke flyer-sketch__stroke--caret"
              pathLength="1"
              d="M-20 190 L-8 196 L-20 202"
            />
            <path
              class="flyer-sketch__stroke flyer-sketch__stroke--frame"
              pathLength="1"
              :d="layout.frame"
            />
          </g>
          <g class="flyer-sketch__lock" :transform="`translate(${layout.half + 6} 270)`">
            <path d="M-6 1 V-4 a6 6 0 0 1 12 0 V1" />
            <rect x="-10" y="0" width="20" height="15" rx="2.5" />
          </g>
          <text
            class="flyer-sketch__mark flyer-sketch__mark--rewrite"
            :x="-layout.half - 10"
            y="174"
          >
            {{ sketch.rewrite }}
          </text>
          <text class="flyer-sketch__mark flyer-sketch__mark--insert" x="-26" y="203">
            {{ sketch.insert }}
          </text>
        </g>

        <g class="flyer-sketch__pen" :filter="`url(#${uid}-${layout.name})`">
          <path
            class="flyer-sketch__stroke flyer-sketch__stroke--pointer"
            pathLength="1"
            :d="layout.pointer"
          />
          <path
            class="flyer-sketch__stroke flyer-sketch__stroke--brace"
            pathLength="1"
            :d="layout.brace"
          />
        </g>
        <g
          v-for="(note, i) in layout.notes"
          :key="i"
          class="flyer-sketch__note"
          :style="{ '--delay': `${note.delay}ms` }"
        >
          <text
            v-for="line in note.title"
            :key="line.y"
            class="flyer-sketch__note-title"
            :x="layout.text"
            :y="line.y"
          >
            {{ line.text }}
          </text>
          <text v-for="line in note.body" :key="line.y" :x="layout.text" :y="line.y">
            {{ line.text }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>
