<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { foldAddress } from '@/utils/email'

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
// The address may fold after its last "@", which stays on the first line.
const address = computed(() => foldAddress(props.email))

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
      }"
      :tabindex="firstIntact === n - 1 ? 0 : -1"
      v-bind="firstIntact === n - 1 ? { 'aria-label': `Copy ${email}` } : { 'aria-hidden': 'true' }"
      @click="tear(n - 1, $event)"
    >
      <span class="c-tear-tabs__text" aria-hidden="true"
        >{{ address.first }}<wbr />{{ address.rest }}</span
      >
    </button>
    <span class="u-visually-hidden" aria-live="polite" aria-atomic="true">{{ status }}</span>
  </div>
</template>
