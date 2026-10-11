<script setup lang="ts">
import { computed, type VNode } from 'vue'
import { seeded } from '@/utils/seeded'
import { tornClipPath, type Edge } from '@/utils/torn'

type TapeAt = 'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom-right'
type TapeKind = 'real' | 'drawn'
type Stock = 'paper' | 'white' | 'cyan' | 'ink' | 'grid'
type Fold = 'none' | 'vertical' | 'horizontal' | 'both'

const props = withDefaults(
  defineProps<{
    seed: string
    as?: string
    stock?: Stock
    torn?: readonly Edge[]
    tape?: readonly TapeAt[]
    tapeKind?: TapeKind
    worn?: boolean
    fold?: Fold
    tilt?: number
    order?: number
    live?: boolean
    near?: boolean
  }>(),
  {
    as: 'div',
    stock: 'paper',
    torn: () => ['top'],
    tape: () => [],
    tilt: 0,
    order: 0,
    worn: false,
    fold: 'both',
    live: false,
    near: false,
  },
)
defineSlots<{ default(): VNode[]; foot?(): VNode[]; over?(): VNode[] }>()

const clipPath = computed(() => tornClipPath(`${props.seed}:torn`, props.torn))
const kind = computed<TapeKind>(
  () => props.tapeKind ?? (seeded(`${props.seed}:tape-kind`)() < 0.5 ? 'real' : 'drawn'),
)

function tornOutline(rand: () => number) {
  const steps = 9
  const jag = () => rand() * 2.6
  const end = (base: number, dir: number, slant: number, from: number, to: number) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps
      const x = base + dir * (slant * (t - 0.5) + jag())
      return `${x.toFixed(2)}% ${(from + (to - from) * t).toFixed(2)}%`
    })
  const edge = (y: number, dir: number, from: number, to: number) =>
    [0.3, 0.55, 0.8].map(
      (t) => `${(from + (to - from) * t).toFixed(2)}% ${(y + dir * rand() * 1.4).toFixed(2)}%`,
    )
  const left = end(1.5, 1, (rand() - 0.5) * 7, 0, 100)
  const right = end(98.5, -1, (rand() - 0.5) * 7, 100, 0)
  return `polygon(${[...left, ...edge(100, -1, 4, 96), ...right, ...edge(0, 1, 96, 4)].join(', ')})`
}

const at = (rand: () => number, x0: number, x1: number, y0: number, y1: number) =>
  `${(x0 + rand() * (x1 - x0)).toFixed(1)}% ${(y0 + rand() * (y1 - y0)).toFixed(1)}%`

function wear(rand: () => number) {
  return {
    '--tape-sx': (0.88 + rand() * 0.26).toFixed(3),
    '--tape-sy': (0.9 + rand() * 0.2).toFixed(3),
    '--crease-x': `${(22 + rand() * 56).toFixed(1)}%`,
    '--crease-angle': `${(70 + rand() * 40).toFixed(1)}deg`,
    '--bubble-a': at(rand, 12, 88, 25, 75),
    '--bubble-b': at(rand, 12, 88, 25, 75),
    '--speck-a': at(rand, 8, 92, 15, 85),
    '--speck-b': at(rand, 8, 92, 15, 85),
    '--mottle': at(rand, 15, 85, 20, 80),
  }
}

function drawnPath(rand: () => number) {
  const j = (n: number) => (n + (rand() - 0.5) * 2.4).toFixed(1)
  const teeth = (x: number, out: number, ys: number[]) =>
    ys.map((y, i) => `L${j(i % 2 ? x : x + out)} ${j(y)}`).join(' ')
  const down = [8, 13, 19, 25, 31]
  return [
    `M${j(5)} ${j(4)}`,
    `Q${j(75)} ${j(2)} ${j(145)} ${j(4)}`,
    teeth(145, 3.5, down),
    `L${j(145)} ${j(37)}`,
    `Q${j(75)} ${j(39)} ${j(5)} ${j(37)}`,
    teeth(5, -3.5, [...down].reverse()),
    'Z',
  ].join(' ')
}

const wearStyle = computed(() => {
  const rand = seeded(`${props.seed}:wear`)
  const spot = () => `${(15 + rand() * 70).toFixed(1)}% ${(15 + rand() * 70).toFixed(1)}%`
  return {
    '--fold-v': props.fold === 'vertical' || props.fold === 'both' ? 1 : 0,
    '--fold-h': props.fold === 'horizontal' || props.fold === 'both' ? 1 : 0,
    '--fold-x': `${(44 + rand() * 12).toFixed(1)}%`,
    '--fold-y': `${(38 + rand() * 24).toFixed(1)}%`,
    '--crumple-a': spot(),
    '--crumple-b': spot(),
    '--crumple-c': spot(),
  }
})

const tapes = computed(() => {
  const rand = seeded(`${props.seed}:tape`)
  const base: Record<TapeAt, number> = {
    'top-left': -36,
    top: -3,
    'top-right': 32,
    'bottom-left': 34,
    'bottom-right': -30,
  }
  return props.tape.map((at) => ({
    at,
    angle: base[at] + (rand() - 0.5) * 8,
    clip: tornOutline(rand),
    path: drawnPath(rand),
    wear: wear(rand),
  }))
})
</script>

<template>
  <component
    :is="as"
    class="c-sheet"
    :class="[`c-sheet--${stock}`, { 'c-sheet--live': live, 'c-sheet--near': near }]"
    :style="{ '--tilt': `${tilt}deg`, '--paste-order': order }"
  >
    <span
      v-if="worn && fold !== 'none'"
      class="c-sheet__lift"
      :style="wearStyle"
      aria-hidden="true"
    />
    <span v-if="live" class="c-sheet__shadow" aria-hidden="true">
      <span class="c-sheet__shadow-shape" :style="{ clipPath }" />
    </span>
    <div class="c-sheet__paper" :style="{ clipPath }">
      <slot />
      <span v-if="worn" class="c-sheet__wear" :style="wearStyle" aria-hidden="true" />
    </div>
    <slot name="foot" />
    <span
      v-for="(t, i) in tapes"
      :key="i"
      class="c-sheet__tape"
      :class="[`c-sheet__tape--${t.at}`, `c-sheet__tape--${kind}`]"
      :style="{ '--tape-angle': `${t.angle}deg`, '--tape-clip': t.clip, ...t.wear }"
      aria-hidden="true"
    >
      <svg
        v-if="kind === 'drawn'"
        class="c-sheet__tape-ink"
        viewBox="0 0 150 40"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path class="c-sheet__tape-body" :d="t.path" />
        <path class="c-sheet__tape-shine" d="M14 9 Q60 7 104 9" />
        <path
          class="c-sheet__tape-hatch"
          d="M14 31 l7 -7 M22 32 l7 -7 M124 31 l7 -7 M132 31 l7 -7"
        />
      </svg>
    </span>
    <slot name="over" />
  </component>
</template>
