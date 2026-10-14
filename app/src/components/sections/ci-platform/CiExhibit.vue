<script setup lang="ts">
import WallSection from '@/components/ui/WallSection.vue'
import CiInline from '@/components/sections/ci-platform/CiInline.vue'
import CiLinks from '@/components/sections/ci-platform/CiLinks.vue'
import type { ExhibitContent, ExhibitLabels } from '@/components/sections/ci-platform/types'

withDefaults(
  defineProps<{
    content: ExhibitContent
    labels: ExhibitLabels
    layout?: 'side' | 'stacked'
  }>(),
  { layout: 'side' },
)
</script>

<template>
  <WallSection
    v-slot="{ titleId }"
    :id="content.id"
    class="ci-exhibit"
    :class="`ci-exhibit--${layout}`"
  >
    <div class="ci-exhibit__grid">
      <div class="ci-exhibit__text">
        <p class="c-kicker ci-exhibit__kicker">
          <template v-for="(part, i) in content.kicker" :key="i">
            <span>{{ part }}</span
            >{{ ' ' }}
          </template>
        </p>
        <h2 :id="titleId" class="ci-exhibit__title"><CiInline :text="content.title" /></h2>
        <p v-for="(paragraph, i) in content.body" :key="i" class="ci-exhibit__copy">
          <CiInline :text="paragraph" />
        </p>
        <CiLinks
          v-if="content.links?.length"
          :label="content.linksLabel ?? labels.example"
          :links="content.links"
          :new-tab="labels.newTab"
        />
      </div>
      <div class="ci-exhibit__visual"><slot /></div>
    </div>
  </WallSection>
</template>
