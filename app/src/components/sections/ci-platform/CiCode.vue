<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const props = defineProps<{
  label: string
  code: string
  copyLabel: string
  copiedLabel: string
}>()

const copied = ref(false)
let timer = 0

const copy = async () => {
  try {
    await navigator.clipboard.writeText(props.code)
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
  <figure class="ci-code">
    <figcaption class="ci-code__head">
      <span class="c-kicker ci-code__label">{{ label }}</span>
      <button
        type="button"
        class="ci-code__copy"
        :class="{ 'ci-code__copy--done': copied }"
        @click="copy"
      >
        {{ copied ? copiedLabel : copyLabel }}
      </button>
    </figcaption>
    <pre class="ci-code__body"><code>{{ code }}</code></pre>
    <span class="u-visually-hidden" aria-live="polite">{{ copied ? copiedLabel : '' }}</span>
  </figure>
</template>
