<script setup lang="ts">
import { useId } from 'vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SectionRail from '@/components/ui/SectionRail.vue'
import { useReveal } from '@/composables/useReveal'
import type { ContentPage } from '@/contents'

defineProps<{ content: ContentPage['practice'] }>()

const titleId = `practice-${useId()}`
const { target, isRevealed, isTuning } = useReveal()
</script>

<template>
  <section
    ref="target"
    class="content-practice o-poster c-reveal"
    :class="{ 'c-reveal--shown': isRevealed, 'c-reveal--tuning': isTuning }"
    :aria-labelledby="titleId"
  >
    <div class="o-poster__sheet">
      <div class="o-poster__split c-reveal__item">
        <SectionHeading :id="titleId" :lines="content.headline" />
        <p class="o-poster__aside">{{ content.description }}</p>
      </div>

      <ol class="content-practice__stack c-reveal__group">
        <li
          v-for="area in content.areas"
          :key="area.title"
          class="content-practice__layer o-poster__split c-reveal__item"
        >
          <h3 class="content-practice__layer-name">{{ area.title }}</h3>
          <div class="content-practice__layer-copy">
            <p class="content-practice__layer-caption">{{ area.caption }}</p>
            <p class="content-practice__layer-description">{{ area.description }}</p>
          </div>
        </li>
      </ol>
    </div>

    <SectionRail :index="content.index" :label="content.label" />
  </section>
</template>
