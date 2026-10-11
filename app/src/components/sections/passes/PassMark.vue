<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ logo: string }>()

const masks = import.meta.glob<string>('../../../assets/images/logos/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

const mask = computed(() => masks[`../../../assets/images/logos/${props.logo}.png`])
</script>

<template>
  <span class="pass__mark" aria-hidden="true">
    <span v-if="mask" class="pass__mark-ink" :style="{ '--logo': `url(${mask})` }" />
  </span>
</template>
