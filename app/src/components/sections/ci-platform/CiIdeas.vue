<script setup lang="ts">
import PastedSheet from '@/components/ui/PastedSheet.vue'
import WallSection from '@/components/ui/WallSection.vue'
import type { CiPlatformContent } from '@/contents'

defineProps<{
  content: CiPlatformContent['ideas']
}>()

const STOCKS = ['paper', 'white', 'grid'] as const
const TILTS = [-1.1, 0.8, -0.6]
</script>

<template>
  <WallSection v-slot="{ titleId }" :id="content.id" class="ci-ideas">
    <header class="ci-ideas__head">
      <p class="c-kicker ci-ideas__kicker">
        <span>{{ content.kicker }}</span>
      </p>
      <h2 :id="titleId" class="ci-ideas__title">{{ content.title }}</h2>
    </header>
    <ol class="ci-ideas__list" role="list">
      <li v-for="(idea, i) in content.items" :key="idea.stamp" class="ci-ideas__item">
        <PastedSheet
          :seed="`ci-idea-${idea.stamp}`"
          :stock="STOCKS[i % STOCKS.length] ?? 'paper'"
          :torn="['bottom']"
          :tape="['top']"
          :tilt="TILTS[i % TILTS.length] ?? 0"
          :order="i"
        >
          <article class="ci-idea" :class="{ 'ci-idea--cd': i === content.items.length - 1 }">
            <p class="ci-idea__stamp">{{ idea.stamp }}</p>
            <h3 class="ci-idea__title">{{ idea.title }}</h3>
            <p class="ci-idea__text">{{ idea.text }}</p>
            <pre class="ci-idea__code"><code>{{ idea.code }}</code></pre>
            <p class="ci-idea__why">{{ idea.why }}</p>
          </article>
        </PastedSheet>
      </li>
    </ol>
  </WallSection>
</template>
