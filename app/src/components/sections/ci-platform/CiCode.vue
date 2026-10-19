<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import KeyCap from '@/components/ui/KeyCap.vue'
import { highlight } from '@/components/sections/ci-platform/highlight'

const props = defineProps<{
  label: string
  code: string
  copyLabel: string
  copiedLabel: string
  moreLabel: string
  lessLabel: string
}>()

const FOLD_AFTER = 14

const lines = computed(() => highlight(props.code, /dockerfile/i.test(props.label)))
const long = computed(() => lines.value.length > FOLD_AFTER)
const open = ref(false)
const root = ref<HTMLElement | null>(null)

const toggle = async () => {
  open.value = !open.value
  if (open.value) return
  await nextTick()
  if ((root.value?.getBoundingClientRect().top ?? 0) < 0) root.value?.scrollIntoView()
}
const copied = ref(false)
let timer = 0

const writeText = async (text: string) => {
  if (window.isSecureContext && navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const area = document.createElement('textarea')
  area.value = text
  area.readOnly = true
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.left = '0'
  area.style.opacity = '0'
  document.body.append(area)
  area.select()
  const done = document.execCommand('copy')
  area.remove()
  focused?.focus({ preventScroll: true })
  if (!done) throw new Error('Copy failed')
}

const copy = async () => {
  try {
    await writeText(props.code)
  } catch {
    return
  }
  copied.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    copied.value = false
  }, 1600)
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <figure ref="root" class="ci-code" :class="{ 'ci-code--long': long, 'ci-code--open': open }">
    <figcaption class="ci-code__head">
      <span class="c-kicker ci-code__label">{{ label }}</span>
    </figcaption>
    <pre
      class="ci-code__body"
    ><code><span v-for="(line, i) in lines" :key="i" class="ci-code__line"><span v-for="(token, j) in line" :key="j" :class="token.kind === 'plain' ? undefined : `ci-tok ci-tok--${token.kind}`">{{ token.text }}</span></span></code></pre>
    <div v-if="long" class="ci-code__fold">
      <button type="button" class="ci-code__more" :aria-expanded="open" @click="toggle">
        {{ open ? lessLabel : moreLabel.replace('{n}', String(lines.length)) }}
      </button>
    </div>
    <KeyCap
      class="ci-code__key"
      :class="{ 'c-key--down': copied }"
      :aria-label="`${copyLabel}: ${label}`"
      @click="copy"
    >
      <svg class="ci-code__key-icon" viewBox="0 0 14 14" aria-hidden="true">
        <path v-if="copied" d="M2.5 7.5 5.5 10.5 11.5 3.5" />
        <template v-else>
          <rect x="4.5" y="4.5" width="8" height="8" rx="1" />
          <path d="M9.5 2.5V2a.5.5 0 0 0-.5-.5H2A.5.5 0 0 0 1.5 2v7a.5.5 0 0 0 .5.5h.5" />
        </template>
      </svg>
      <span class="ci-code__key-label" aria-hidden="true">{{
        copied ? copiedLabel : copyLabel
      }}</span>
    </KeyCap>
    <span class="u-visually-hidden" aria-live="polite">{{ copied ? copiedLabel : '' }}</span>
  </figure>
</template>
