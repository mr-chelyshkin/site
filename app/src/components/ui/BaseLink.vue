<script setup lang="ts">
import { useGlitch } from '@/composables/useGlitch'

defineProps<{ to: string }>()
const emit = defineEmits<{ click: [] }>()

const { trigger, isGlitching, glitchClass } = useGlitch({ animation: 'c-glitch-matrix' })
</script>

<template>
  <RouterLink
    :to="to"
    active-class="c-link--active"
    class="c-link"
    :class="{ [glitchClass]: isGlitching }"
    @click="emit('click')"
    @mouseenter="trigger"
  >
    <slot />
  </RouterLink>
</template>
