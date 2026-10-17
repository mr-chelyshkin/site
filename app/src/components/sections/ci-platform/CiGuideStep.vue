<script setup lang="ts">
import CiCode from '@/components/sections/ci-platform/CiCode.vue'
import CiInline from '@/components/sections/ci-platform/CiInline.vue'
import CiLayers from '@/components/sections/ci-platform/CiLayers.vue'
import CiLinks from '@/components/sections/ci-platform/CiLinks.vue'
import type { GuideLabels, GuideStep } from '@/components/sections/ci-platform/types'

defineProps<{
  step: GuideStep
  labels: GuideLabels
}>()
</script>

<template>
  <article class="ci-step" :aria-labelledby="`${step.id}-title`">
    <header class="ci-step__head">
      <span class="ci-step__number" aria-hidden="true">{{ step.number }}</span>
      <h3 :id="`${step.id}-title`" class="ci-step__title">{{ step.title }}</h3>
    </header>

    <p class="ci-step__why"><CiInline :text="step.why" /></p>

    <CiLayers v-if="step.layers" :layers="step.layers" />

    <p class="ci-step__label">{{ labels.do }}</p>
    <ol class="ci-step__actions" role="list">
      <li v-for="(action, i) in step.actions" :key="i" class="ci-step__action">
        <CiInline :text="action" />
      </li>
    </ol>

    <div v-if="step.code?.length" class="ci-step__code">
      <CiCode
        v-for="(block, i) in step.code"
        :key="i"
        :label="block.label"
        :code="block.code"
        :copy-label="labels.copy"
        :copied-label="labels.copied"
      />
    </div>

    <p v-if="step.check" class="ci-step__check">
      <span class="ci-step__check-label">{{ labels.check }}</span
      >{{ ' ' }}<CiInline :text="step.check" />
    </p>

    <CiLinks
      v-if="step.links.length"
      :label="labels.example"
      :links="step.links"
      :new-tab="labels.newTab"
    />
  </article>
</template>
