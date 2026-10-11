<script setup lang="ts">
withDefaults(
  defineProps<{
    lines: readonly string[]
    face?: 'stencil' | 'display'
    tear?: boolean
  }>(),
  { face: 'stencil', tear: false },
)
</script>

<template>
  <span class="c-spray" :class="`c-spray--${face}`">
    <span class="c-spray__paint">
      <template v-for="(line, i) in lines" :key="i">
        <span class="c-spray__line">{{ line }}</span
        >{{ ' ' }}
      </template>
    </span>
    <span v-if="tear" class="c-spray__paint c-spray__tear" aria-hidden="true">
      <template v-for="(line, i) in lines" :key="i">
        <span class="c-spray__line">{{ line }}</span
        >{{ ' ' }}
      </template>
    </span>
  </span>
</template>
