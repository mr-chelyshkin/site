<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SectionRail from '@/components/ui/SectionRail.vue'
import { useReveal } from '@/composables/useReveal'
import { padIndex } from '@/utils/format'
import type { ContentPage } from '@/contents'

const props = defineProps<{ content: ContentPage['commerce'] }>()

const titleId = `commerce-${useId()}`
const { target, isRevealed, isTuning } = useReveal()

// The readout follows pointer and keyboard alike; with nothing selected it
// carries the section's own lede.
const hoveredIndex = ref<number | null>(null)
const focusedIndex = ref<number | null>(null)
const prefersFocus = ref(false)
const activeIndex = computed(() =>
  prefersFocus.value
    ? (focusedIndex.value ?? hoveredIndex.value)
    : (hoveredIndex.value ?? focusedIndex.value),
)
const activeCompany = computed(() =>
  activeIndex.value === null ? null : props.content.companies[activeIndex.value],
)

const selectHovered = (index: number) => {
  hoveredIndex.value = index
  prefersFocus.value = false
}
const selectFocused = (index: number) => {
  focusedIndex.value = index
  prefersFocus.value = true
}
</script>

<template>
  <section
    ref="target"
    class="content-commerce o-poster c-reveal"
    :class="{ 'c-reveal--shown': isRevealed, 'c-reveal--tuning': isTuning }"
    :aria-labelledby="titleId"
  >
    <div class="o-poster__sheet">
      <SectionHeading :id="titleId" :lines="content.headline" class="c-reveal__item" />

      <ul
        class="content-commerce__wall c-reveal__group"
        :class="{ 'content-commerce__wall--tuned': activeIndex !== null }"
      >
        <li
          v-for="(company, index) in content.companies"
          :key="company.name"
          class="c-reveal__item"
        >
          <button
            type="button"
            class="content-commerce__entry"
            :class="{ 'content-commerce__entry--active': activeIndex === index }"
            @mouseenter="selectHovered(index)"
            @focus="selectFocused(index)"
            @mouseleave="hoveredIndex = null"
            @blur="focusedIndex = null"
          >
            <span class="content-commerce__entry-index" aria-hidden="true">
              {{ padIndex(index) }}
            </span>
            <span class="content-commerce__entry-name">{{ company.name }}</span>
          </button>
        </li>
      </ul>

      <p class="content-commerce__readout c-reveal__item" aria-live="polite">
        <span class="content-commerce__readout-meta">
          {{ activeCompany ? activeCompany.meta : content.hint }}
        </span>
        <span class="content-commerce__readout-note">
          {{ activeCompany ? activeCompany.note : content.description }}
        </span>
      </p>
    </div>

    <SectionRail :index="content.index" :label="content.label" />
  </section>
</template>
