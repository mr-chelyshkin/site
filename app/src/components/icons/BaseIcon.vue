<script setup lang="ts">
import { computed, type SVGAttributes } from 'vue'
import type { IconProps } from '@/components/icons/types'

const props = withDefaults(defineProps<IconProps>(), { size: 20 })
const accessibility = computed<SVGAttributes>(() =>
  props.label ? { role: 'img', 'aria-label': props.label } : { 'aria-hidden': true },
)
</script>

<template>
  <svg
    class="c-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="currentColor"
    v-bind="accessibility"
    focusable="false"
  >
    <slot />
  </svg>
</template>
