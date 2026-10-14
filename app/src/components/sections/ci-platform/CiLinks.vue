<script setup lang="ts">
import type { ExhibitLink } from '@/components/sections/ci-platform/types'

defineProps<{
  label: string
  links: readonly ExhibitLink[]
  newTab: string
}>()
</script>

<template>
  <p class="ci-links">
    <span class="c-kicker ci-links__label">{{ label }}</span
    >{{ ' ' }}
    <template v-for="link in links" :key="link.href">
      <a
        class="ci-links__link"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="`${link.label} (${newTab})`"
        >{{ link.label }} ↗</a
      >{{ ' ' }}
    </template>
  </p>
</template>
