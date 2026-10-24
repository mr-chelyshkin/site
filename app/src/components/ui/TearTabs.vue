<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { seeded } from '@/utils/seeded'

const props = withDefaults(
  defineProps<{
    seed: string
    email: string
    label: string
    count: number
    gone?: readonly number[]
    copied: string
  }>(),
  { gone: () => [] },
)

const root = ref<HTMLElement | null>(null)
const torn = ref(new Set<number>())
const status = ref('')
const isMissing = (i: number) => props.gone.includes(i) || torn.value.has(i)
const intact = computed(() =>
  Array.from({ length: props.count }, (_, i) => i).filter((i) => !isMissing(i)),
)
const firstIntact = computed<number | undefined>(() => intact.value[0])
const scraps = computed(() =>
  Object.fromEntries(
    props.gone.map((i) => {
      const rand = seeded(`${props.seed}:tear-tab:${i}`)
      const from = 25 + rand() * 75
      const to = 25 + rand() * 75
      const tear = Array.from({ length: 13 }, (_, k) => {
        const t = 1 - k / 12
        const y = Math.min(100, Math.max(12, from + (to - from) * t + (rand() - 0.5) * 28))
        return `${(t * 100).toFixed(1)}% ${y.toFixed(1)}%`
      })
      return [i, `polygon(0 0, 100% 0, ${tear.join(', ')})`]
    }),
  ),
)

const swaying = ref(new Map<number, number>())
const brush = (i: number, event: PointerEvent) => {
  if (event.pointerType !== 'mouse' || isMissing(i) || swaying.value.has(i)) return
  const { left, width } = (event.currentTarget as HTMLElement).getBoundingClientRect()
  swaying.value = new Map(swaying.value).set(i, event.clientX < left + width / 2 ? -1 : 1)
}
const settle = (i: number) => {
  if (!swaying.value.has(i)) return
  const next = new Map(swaying.value)
  next.delete(i)
  swaying.value = next
}

const tear = async (i: number, event: MouseEvent) => {
  const tab = event.currentTarget
  try {
    await navigator.clipboard.writeText(props.email)
  } catch {
    window.location.href = `mailto:${props.email}`
    return
  }
  if (intact.value.length > 1) {
    const hadFocus = document.activeElement === tab
    torn.value = new Set(torn.value).add(i)
    if (hadFocus) {
      await nextTick()
      root.value?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
    }
  }
  status.value = status.value === props.copied ? `${props.copied}\u00a0` : props.copied
}
</script>

<template>
  <div ref="root" class="c-tear-tabs">
    <button
      v-for="n in count"
      :key="n"
      type="button"
      class="c-tear-tabs__tab"
      :class="{
        'c-tear-tabs__tab--gone': gone.includes(n - 1),
        'c-tear-tabs__tab--torn': torn.has(n - 1),
        'c-tear-tabs__tab--sway': swaying.has(n - 1) && !torn.has(n - 1),
      }"
      :style="scraps[n - 1] ? { '--scrap': scraps[n - 1] } : { '--sway-dir': swaying.get(n - 1) }"
      :tabindex="firstIntact === n - 1 ? 0 : -1"
      v-bind="firstIntact === n - 1 ? { 'aria-label': `Copy ${email}` } : { 'aria-hidden': 'true' }"
      @click="tear(n - 1, $event)"
      @pointerenter="brush(n - 1, $event)"
      @animationend="settle(n - 1)"
    >
      <span class="c-tear-tabs__text" aria-hidden="true">{{ label }}</span>
    </button>
    <span class="u-visually-hidden" aria-live="polite" aria-atomic="true">{{ status }}</span>
  </div>
</template>
