<script setup lang="ts">
import { computed, type VNode } from 'vue'
import { seeded } from '@/utils/seeded'
import { tornClipPath, type Edge } from '@/utils/torn'

type TapeAt = 'top-left' | 'top' | 'top-right'
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
    /** Rotation in degrees; small screens use less of it. */
    tilt?: number
    /** Place in the section's paste-in sequence. */
    order?: number
  }>(),
  { as: 'div', stock: 'paper', torn: () => ['top'], tape: () => [], tilt: 0, order: 0 },
)
defineSlots<{ default(): VNode[]; foot?(): VNode[]; over?(): VNode[] }>()

const clipPath = computed(() => tornClipPath(`${props.seed}:torn`, props.torn))
const tapes = computed(() => {
  const rand = seeded(`${props.seed}:tape`)
  const base: Record<TapeAt, number> = { 'top-left': -36, top: -3, 'top-right': 32 }
  return props.tape.map((at) => ({ at, angle: base[at] + (rand() - 0.5) * 8 }))
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
      :class="`c-sheet__tape--${t.at}`"
      :style="{ '--tape-angle': `${t.angle}deg` }"
      aria-hidden="true"
    />
    <slot name="over" />
  </component>
</template>
