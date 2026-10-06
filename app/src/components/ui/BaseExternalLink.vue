<script setup lang="ts">
import type { VNode } from 'vue'

defineProps<{
  href: string
  label: string
}>()
defineSlots<{ icon(): VNode[] }>()
const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <a
    class="c-external-link"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="`${label} (opens in a new tab)`"
    @click="emit('click', $event)"
  >
    <span class="c-external-link__icon"><slot name="icon" /></span>
    <span class="c-external-link__label">{{ label }}</span>
  </a>
</template>
