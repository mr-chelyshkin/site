<script setup lang="ts">
defineProps<{ text: string }>()

const REPEAT = 6
</script>

<template>
  <div class="ci-divider">
    <p class="u-visually-hidden">{{ text }}</p>
    <div class="ci-divider__tape" aria-hidden="true">
      <span v-for="n in REPEAT" :key="n" class="ci-divider__run">{{ text }}</span>
    </div>
  </div>
</template>
