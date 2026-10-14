<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ text: string }>()

interface Part {
  kind: 'text' | 'code' | 'struck'
  text: string
}

const parts = computed<Part[]>(() =>
  props.text
    .split(/(`[^`]+`|~[^~]+~)/)
    .filter(Boolean)
    .map((part) => {
      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
        return { kind: 'code', text: part.slice(1, -1) }
      }
      if (part.length > 2 && part.startsWith('~') && part.endsWith('~')) {
        return { kind: 'struck', text: part.slice(1, -1) }
      }
      return { kind: 'text', text: part }
    }),
)
</script>

<template>
  <template v-for="(part, i) in parts" :key="i">
    <code v-if="part.kind === 'code'" class="ci-inline-code">{{ part.text }}</code>
    <s v-else-if="part.kind === 'struck'" class="ci-inline-struck">{{ part.text }}</s>
    <template v-else>{{ part.text }}</template>
  </template>
</template>
