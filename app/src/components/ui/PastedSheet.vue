<script setup lang="ts">
import { computed, type VNode } from 'vue'
import { seeded } from '@/utils/seeded'
import { tornClipPath, type Edge } from '@/utils/torn'

type TapeAt = 'top-left' | 'top' | 'top-right'
/** Clear office tape as a camera sees it, or tape as a pen draws it. */
type TapeKind = 'real' | 'drawn'
type Stock = 'paper' | 'white' | 'cyan' | 'ink' | 'grid'

/**
 * Paper pasted to the wall. The wrapper carries the tilt and the shadow; the
 * paper inside is clipped to its torn outline; tape sits over the edges. The
 * `over` slot holds things stuck on top, such as a sticker, outside the clip.
 * The `foot` slot hangs from the bottom edge, outside the clip too, so tear-off
 * tabs that are gone leave a gap to the wall and a torn one falls past the edge;
 * don't tear the bottom edge of a sheet that has a foot.
 */
const props = withDefaults(
  defineProps<{
    /** Keeps the outline and the tape the same on every load. */
    seed: string
    as?: string
    stock?: Stock
    torn?: readonly Edge[]
    tape?: readonly TapeAt[]
    /** Which tape holds it up; by default the seed picks, so sheets differ. */
    tapeKind?: TapeKind
    /** Rotation in degrees; small screens use less of it. */
    tilt?: number
    /** Place in the section's paste-in sequence. */
    order?: number
  }>(),
  { as: 'div', stock: 'paper', torn: () => ['top'], tape: () => [], tilt: 0, order: 0 },
)
defineSlots<{ default(): VNode[]; foot?(): VNode[]; over?(): VNode[] }>()

const clipPath = computed(() => tornClipPath(`${props.seed}:torn`, props.torn))
const kind = computed<TapeKind>(
  () => props.tapeKind ?? (seeded(`${props.seed}:tape-kind`)() < 0.5 ? 'real' : 'drawn'),
)

// A tape's cut ends: teeth from the dispenser, in percent of the tape so they
// scale with it, each a little different.
function serrated(rand: () => number) {
  const teeth = 7
  const end = (x: (depth: number) => number, from: number, to: number) =>
    Array.from({ length: teeth * 2 + 1 }, (_, i) => {
      const depth = i % 2 ? 1.6 + rand() * 2.2 : 0
      return `${x(depth).toFixed(2)}% ${(from + ((to - from) * i) / (teeth * 2)).toFixed(2)}%`
    })
  return `polygon(${[...end((d) => d, 0, 100), ...end((d) => 100 - d, 100, 0)].join(', ')})`
}

// The same outline as a pen draws it, in the 150 × 40 box of the drawing, with a
// wobble on every point.
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

const tapes = computed(() => {
  const rand = seeded(`${props.seed}:tape`)
  const base: Record<TapeAt, number> = { 'top-left': -36, top: -3, 'top-right': 32 }
  return props.tape.map((at) => ({
    at,
    angle: base[at] + (rand() - 0.5) * 8,
    clip: serrated(rand),
    path: drawnPath(rand),
  }))
})
</script>

<template>
  <component
    :is="as"
    class="c-sheet"
    :class="`c-sheet--${stock}`"
    :style="{ '--tilt': `${tilt}deg`, '--paste-order': order }"
  >
    <div class="c-sheet__paper" :style="{ clipPath }">
      <slot />
    </div>
    <slot name="foot" />
    <span
      v-for="(t, i) in tapes"
      :key="i"
      class="c-sheet__tape"
      :class="[`c-sheet__tape--${t.at}`, `c-sheet__tape--${kind}`]"
      :style="{ '--tape-angle': `${t.angle}deg`, '--tape-clip': t.clip }"
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
