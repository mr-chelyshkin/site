<script setup lang="ts">
import PosterSection from '@/components/ui/PosterSection.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import type { HomeContent } from '@/contents'

defineProps<{ content: HomeContent['practice'] }>()
</script>

<template>
  <PosterSection
    v-slot="{ titleId }"
    class="practice"
    :index="content.index"
    :label="content.label"
  >
    <div class="o-poster__split u-reveal__item">
      <SectionHeading :id="titleId" :lines="content.headline" />
      <p class="o-poster__aside">{{ content.description }}</p>
    </div>

    <ol class="practice__stack u-reveal__group">
      <li
        v-for="area in content.areas"
        :key="area.title"
        class="practice__layer o-poster__split u-reveal__item"
      >
        <h3 class="practice__layer-name">{{ area.title }}</h3>
        <div class="practice__layer-copy">
          <p class="practice__layer-caption">{{ area.caption }}</p>
          <p class="practice__layer-description">{{ area.description }}</p>
        </div>
      </li>
    </ol>
  </PosterSection>
</template>
