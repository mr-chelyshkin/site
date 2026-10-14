<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import SprayText from '@/components/ui/SprayText.vue'
import WallSection from '@/components/ui/WallSection.vue'
import CiGuideStep from '@/components/sections/ci-platform/CiGuideStep.vue'
import type { GuideLabels, GuideStep } from '@/components/sections/ci-platform/types'

const props = defineProps<{
  content: {
    id: string
    headline: readonly string[]
    title: string
    intro: string
    navLabel: string
    needs: { title: string; items: readonly string[] }
    steps: readonly GuideStep[]
  }
  labels: GuideLabels
}>()

const TILTS = [-0.35, 0.3, -0.2, 0.35, -0.3]

const active = ref('')
let observer: IntersectionObserver | undefined

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) active.value = entry.target.id
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  )
  for (const step of props.content.steps) {
    const element = document.getElementById(step.id)
    if (element) observer.observe(element)
  }
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <WallSection v-slot="{ titleId }" :id="content.id" class="ci-guide">
    <header class="ci-guide__head">
      <h2 :id="titleId" class="ci-guide__title">
        <SprayText :lines="content.headline" aria-hidden="true" />
        <span class="u-visually-hidden">{{ content.title }}</span>
      </h2>
      <p class="ci-guide__intro">{{ content.intro }}</p>
    </header>

    <div class="ci-guide__layout">
      <nav class="ci-guide__nav" :aria-label="content.navLabel">
        <ol class="ci-guide__nav-list" role="list">
          <li v-for="step in content.steps" :key="step.id">
            <a
              class="ci-guide__nav-link"
              :class="{ 'ci-guide__nav-link--active': active === step.id }"
              :href="`#${step.id}`"
              :aria-current="active === step.id ? 'step' : undefined"
            >
              <span class="ci-guide__nav-number">{{ step.number }}</span>
              {{ step.title }}
            </a>
          </li>
        </ol>
      </nav>

      <div class="ci-guide__steps">
        <PastedSheet
          class="ci-guide__needs"
          seed="ci-guide-needs"
          stock="cyan"
          :tape="['top-left']"
          tape-kind="drawn"
          :tilt="0.6"
        >
          <div class="ci-guide__needs-body">
            <p class="c-kicker ci-guide__needs-title">
              <span>{{ content.needs.title }}</span>
            </p>
            <ul class="ci-guide__needs-list" role="list">
              <li v-for="(item, i) in content.needs.items" :key="i" class="ci-guide__needs-item">
                {{ item }}
              </li>
            </ul>
          </div>
        </PastedSheet>

        <CiGuideStep
          v-for="(step, i) in content.steps"
          :key="step.id"
          :step="step"
          :labels="labels"
          :tilt="TILTS[i % TILTS.length] ?? 0"
        />
      </div>
    </div>
  </WallSection>
</template>
