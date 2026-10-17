<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ text: string; newTab?: string }>()

interface Part {
  kind: 'text' | 'code' | 'struck' | 'mark' | 'link'
  text: string
  href?: string
}

const LINK = /^\[([^\]]+)\]\(([^)]+)\)$/

const parts = computed<Part[]>(() =>
  props.text
    .split(/(`[^`]+`|~[^~]+~|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/)
    .filter(Boolean)
    .map((part) => {
      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
        return { kind: 'code', text: part.slice(1, -1) }
      }
      if (part.length > 2 && part.startsWith('~') && part.endsWith('~')) {
        return { kind: 'struck', text: part.slice(1, -1) }
      }
      if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
        return { kind: 'mark', text: part.slice(2, -2) }
      }
      const link = LINK.exec(part)
      if (link?.[1] && link[2]) {
        return { kind: 'link', text: link[1], href: link[2] }
      }
      return { kind: 'text', text: part }
    }),
)
</script>

<template>
  <template v-for="(part, i) in parts" :key="i">
    <code v-if="part.kind === 'code'" class="ci-inline-code">{{ part.text }}</code>
    <s v-else-if="part.kind === 'struck'" class="ci-inline-struck">{{ part.text }}</s>
    <mark v-else-if="part.kind === 'mark'" class="ci-inline-mark">{{ part.text }}</mark>
    <a
      v-else-if="part.kind === 'link'"
      class="ci-inline-link"
      :href="part.href"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="newTab ? `${part.text} (${newTab})` : undefined"
      >{{ part.text }}</a
    >
    <template v-else>{{ part.text }}</template>
  </template>
</template>
