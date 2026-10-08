<script setup lang="ts">
/**
 * Words sprayed on the wall through a stencil. Decorative by default: callers
 * put `aria-hidden` on it and carry the meaning in real text.
 */
withDefaults(
  defineProps<{
    lines: readonly string[]
    face?: 'stencil' | 'display'
    /** Repeats a band of the paint shifted sideways, like a skipped frame. */
    tear?: boolean
  }>(),
  { face: 'stencil', tear: false },
)
</script>

<template>
  <span class="c-spray" :class="`c-spray--${face}`">
    <!-- The spaces keep copied text from running the lines together. -->
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
