<script setup lang="ts">
import PastedSheet from '@/components/ui/PastedSheet.vue'
import WallSection from '@/components/ui/WallSection.vue'
import type { CiPlatformContent } from '@/contents'

defineProps<{
  content: CiPlatformContent['bends']
}>()
</script>

<template>
  <WallSection v-slot="{ titleId }" :id="content.id" class="ci-bends">
    <header class="ci-bends__head">
      <svg class="ci-bends__arrow" viewBox="0 0 560 520" aria-hidden="true" focusable="false">
        <path d="M28 0 V320 Q28 450 158 450 H500" />
        <path d="M452 396 L512 450 L452 504" />
      </svg>
      <p class="c-kicker ci-bends__kicker">
        <span>{{ content.kicker }}</span>
      </p>
      <h2 :id="titleId" class="ci-bends__title">{{ content.title }}</h2>
    </header>
    <PastedSheet
      class="ci-bends__sheet"
      seed="ci-bends"
      stock="white"
      :torn="['bottom']"
      :tape="['top']"
      :tilt="0.5"
    >
      <div class="ci-bends__body">
        <section class="ci-bends__column">
          <h3 class="ci-bends__stamp">{{ content.stays.label }}</h3>
          <ul class="ci-bends__list ci-bends__list--stays" role="list">
            <li v-for="item in content.stays.items" :key="item" class="ci-bends__item">
              {{ item }}
            </li>
          </ul>
        </section>
        <section class="ci-bends__column ci-bends__column--bends">
          <h3 class="ci-bends__stamp ci-bends__stamp--bends">{{ content.bend.label }}</h3>
          <ul class="ci-bends__list ci-bends__list--bends" role="list">
            <li v-for="item in content.bend.items" :key="item" class="ci-bends__item">
              {{ item }}
            </li>
          </ul>
        </section>
      </div>
    </PastedSheet>
  </WallSection>
</template>
