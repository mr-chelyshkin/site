<script setup lang="ts">
import { useId, type VNode } from 'vue'
import SectionBand from '@/components/ui/SectionBand.vue'
import SectionRail from '@/components/ui/SectionRail.vue'
import { useReveal } from '@/composables/useReveal'

/**
 * The frame every homepage section after the hero shares: poster geometry, the
 * one-time reveal and the section label. A numbered section carries its index
 * on a rail; a section without one runs open under a band instead.
 *
 * The default slot fills the sheet and receives `titleId` for the heading
 * that names the section.
 */
defineProps<{
  label: string
  index?: string
}>()
defineSlots<{ default(props: { titleId: string }): VNode[] }>()

const titleId = `section-${useId()}`
const { target, isRevealed, isTuning } = useReveal()
</script>

<template>
  <section
    ref="target"
    class="o-poster u-reveal"
    :class="{
      'o-poster--open': !index,
      'u-reveal--shown': isRevealed,
      'u-reveal--tuning': isTuning,
    }"
    :aria-labelledby="titleId"
  >
    <SectionBand v-if="!index" :label="label" />

    <div class="o-poster__sheet">
      <slot :title-id="titleId" />
    </div>

    <SectionRail v-if="index" :index="index" :label="label" />
  </section>
</template>
