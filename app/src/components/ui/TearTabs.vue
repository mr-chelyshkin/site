<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { foldAddress } from '@/utils/email'
import { seeded } from '@/utils/seeded'

/**
 * The address on tabs along the bottom of a notice. A tab copies it and tears
 * off; without clipboard access it opens the mail client instead. Only the
 * first intact tab is in the tab order and the accessibility tree. Each tab is
 * cut from the stock of the sheet around it, so the strip goes in the sheet's
 * `foot` slot.
 */
const props = withDefaults(
  defineProps<{
    email: string
    count: number
    /** Tabs already gone when the page loads. */
    gone?: readonly number[]
    /** Announced after a copy. */
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
// What a tab torn off before the page loaded leaves behind: a scrap along the
// perforation, its edge ragged and askew, different on every tab. A polygon in
// percent of the scrap's box: the top edge, then the tear from right to left.
const scraps = computed(() =>
  Object.fromEntries(
    props.gone.map((i) => {
      const rand = seeded(`tear-tab:${i}`)
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
// The address may fold after its last "@", which stays on the first line.
const address = computed(() => foldAddress(props.email))

// Brushed by a mouse, an intact tab swings on its perforation, away from the
// side the pointer came in from, and settles; the swing plays out after the
// pointer has moved on. Each swinging tab's direction, 1 or -1, by index.
const swaying = ref(new Map<number, number>())
const brush = (i: number, event: PointerEvent) => {
  if (event.pointerType !== 'mouse' || isMissing(i) || swaying.value.has(i)) return
  const { left, width } = (event.currentTarget as HTMLElement).getBoundingClientRect()
  // In from the left pushes the bottom right: counterclockwise round the top.
  swaying.value = new Map(swaying.value).set(i, event.clientX < left + width / 2 ? -1 : 1)
}
const settle = (i: number) => {
  if (!swaying.value.has(i)) return
  const next = new Map(swaying.value)
  next.delete(i)
  swaying.value = next
}

const tear = async (i: number, event: MouseEvent) => {
  // Read now: `currentTarget` is cleared once the click has been dispatched.
  const tab = event.currentTarget
  try {
    await navigator.clipboard.writeText(props.email)
  } catch {
    window.location.href = `mailto:${props.email}`
    return
  }
  // The last tab only copies, so the address stays on the wall and focus keeps a tab.
  if (intact.value.length > 1) {
    const hadFocus = document.activeElement === tab
    torn.value = new Set(torn.value).add(i)
    if (hadFocus) {
      // The torn tab has left the tab order; the next intact one is now the only tab in it.
      await nextTick()
      root.value?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
    }
  }
  // Announced last, as moving focus can cancel speech already queued. Every other
  // copy adds a no-break space, so the text changes and is read again.
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
      <span class="c-tear-tabs__text" aria-hidden="true"
        >{{ address.first }}<wbr />{{ address.rest }}</span
      >
    </button>
    <span class="u-visually-hidden" aria-live="polite" aria-atomic="true">{{ status }}</span>
  </div>
</template>
