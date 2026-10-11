<script setup lang="ts">
withDefaults(defineProps<{ text: string; tilt?: number }>(), { tilt: 0 })
</script>

<template>
  <span class="c-label" :style="{ '--tilt': `${tilt}deg` }" aria-hidden="true">{{ text }}</span>
</template>
