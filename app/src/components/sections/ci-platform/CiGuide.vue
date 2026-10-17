<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import SprayText from '@/components/ui/SprayText.vue'
import WallSection from '@/components/ui/WallSection.vue'
import CiGuideStep from '@/components/sections/ci-platform/CiGuideStep.vue'
import CiInline from '@/components/sections/ci-platform/CiInline.vue'
import type { GuideLabels } from '@/components/sections/ci-platform/types'
import type { CiPlatformContent } from '@/contents'

const props = defineProps<{
  content: CiPlatformContent['guide']
  labels: GuideLabels
}>()

const STOCKS = ['paper', 'white', 'paper', 'white', 'cyan'] as const
const TILTS = [-0.6, 0.5, -0.4, 0.6, -0.5]

const sheets = ref<HTMLElement[]>([])
const active = ref(props.content.steps[0]?.id ?? '')
let observer: IntersectionObserver | undefined

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    (entries) => {
      const seen = entries.find((entry) => entry.isIntersecting)
      if (seen) active.value = seen.target.id
    },
    { rootMargin: '-40% 0px -55% 0px' },
  )
  sheets.value.forEach((sheet) => observer?.observe(sheet))
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
      <p class="ci-guide__aside">{{ content.aside }}</p>
      <div class="ci-guide__text">
        <p class="ci-guide__intro">{{ content.intro }}</p>
        <div class="ci-guide__brief">
          <section v-for="block in content.brief" :key="block.label" class="ci-guide__block">
            <h3 class="ci-guide__label">{{ block.label }}</h3>
            <p v-if="block.text" class="ci-guide__copy">
              <CiInline :text="block.text" :new-tab="labels.newTab" />
            </p>
            <ul
              v-if="block.points"
              class="ci-guide__points"
              :class="{ 'ci-guide__points--check': block.check }"
              role="list"
            >
              <li v-for="point in block.points" :key="point" class="ci-guide__point">
                <CiInline :text="point" :new-tab="labels.newTab" />
              </li>
            </ul>
            <p v-if="block.punch" class="ci-guide__punch">
              <span class="ci-guide__mark"><CiInline :text="block.punch" /></span>
            </p>
            <p v-if="block.aside" class="ci-guide__note">
              <CiInline :text="block.aside" :new-tab="labels.newTab" />
            </p>
          </section>
        </div>
      </div>
    </header>

    <div class="ci-guide__body">
      <nav class="ci-guide__index" :aria-label="content.navLabel">
        <ol class="ci-guide__index-list" role="list">
          <li v-for="step in content.steps" :key="step.id">
            <a
              class="ci-guide__index-link"
              :class="{ 'ci-guide__index-link--on': active === step.id }"
              :href="`#${step.id}`"
              :aria-current="active === step.id ? 'step' : undefined"
            >
              <span class="ci-guide__index-number">{{ step.number }}</span>
              {{ step.title }}
            </a>
          </li>
        </ol>
      </nav>

      <ol class="ci-guide__steps" role="list">
        <li
          v-for="(step, i) in content.steps"
          :id="step.id"
          :key="step.id"
          ref="sheets"
          class="ci-guide__step"
        >
          <PastedSheet
            :seed="`ci-guide-${step.id}`"
            :stock="STOCKS[i % STOCKS.length] ?? 'paper'"
            :torn="['bottom']"
            :tape="['top']"
            :tilt="TILTS[i % TILTS.length] ?? 0"
          >
            <div class="ci-guide__sheet">
              <CiGuideStep :step="step" :labels="labels" />
            </div>
          </PastedSheet>
        </li>
      </ol>
    </div>
  </WallSection>
</template>
