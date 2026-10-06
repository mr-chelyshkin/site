<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import PosterSection from '@/components/ui/PosterSection.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import type { HomeContent } from '@/contents'
import { padIndex } from '@/utils/format'

const props = defineProps<{ content: HomeContent['commerce'] }>()

const readoutId = `commerce-readout-${useId()}`

// The readout follows pointer and keyboard alike; with nothing selected it
// carries the section's own lede.
const hoveredIndex = ref<number | null>(null)
const focusedIndex = ref<number | null>(null)
const selectedIndex = ref<number | null>(null)
const prefersFocus = ref(false)
const activeIndex = computed(() =>
  prefersFocus.value
    ? (focusedIndex.value ?? hoveredIndex.value ?? selectedIndex.value)
    : (hoveredIndex.value ?? focusedIndex.value ?? selectedIndex.value),
)
const activeCompany = computed(() =>
  activeIndex.value === null ? null : props.content.companies[activeIndex.value],
)
const brandColors = computed(() => ({
  '--company-primary': activeCompany.value?.colors.primary ?? 'var(--color-background-main)',
  '--company-secondary': activeCompany.value?.colors.secondary ?? 'var(--color-background-main)',
}))
const readouts = computed(() => [
  { meta: props.content.hint, note: props.content.description },
  ...props.content.companies,
])
const readoutIndex = computed(() => (activeIndex.value === null ? 0 : activeIndex.value + 1))

const selectHovered = (index: number) => {
  hoveredIndex.value = index
  prefersFocus.value = false
}
const selectFocused = (index: number) => {
  focusedIndex.value = index
  prefersFocus.value = true
}
const selectCompany = (index: number) => {
  selectedIndex.value = index
  focusedIndex.value = null
  hoveredIndex.value = null
  prefersFocus.value = true
}
const clearSelection = () => {
  selectedIndex.value = null
  focusedIndex.value = null
  hoveredIndex.value = null
}
</script>

<template>
  <PosterSection
    v-slot="{ titleId }"
    class="commerce"
    :style="brandColors"
    :index="content.index"
    :label="content.label"
    @keydown.esc.stop="clearSelection"
  >
    <SectionHeading :id="titleId" :lines="content.headline" class="u-reveal__item" />

    <ul
      class="commerce__wall u-reveal__group"
      :class="{ 'commerce__wall--tuned': activeIndex !== null }"
    >
      <li v-for="(company, index) in content.companies" :key="company.name" class="u-reveal__item">
        <button
          type="button"
          class="commerce__entry"
          :class="{ 'commerce__entry--active': activeIndex === index }"
          :aria-pressed="selectedIndex === index"
          :aria-controls="readoutId"
          @click="selectCompany(index)"
          @mouseenter="selectHovered(index)"
          @focus="selectFocused(index)"
          @mouseleave="hoveredIndex = null"
          @blur="focusedIndex = null"
        >
          <span class="commerce__entry-index" aria-hidden="true">
            {{ padIndex(index) }}
          </span>
          <span class="commerce__entry-name">{{ company.name }}</span>
        </button>
      </li>
    </ul>

    <div :id="readoutId" class="commerce__readout u-reveal__item" aria-live="polite">
      <p
        v-for="(readout, index) in readouts"
        :key="index"
        class="commerce__readout-state"
        :class="{ 'commerce__readout-state--active': readoutIndex === index }"
        :aria-hidden="readoutIndex !== index"
      >
        <span class="commerce__readout-meta">{{ readout.meta }}</span>
        <span class="commerce__readout-note">{{ readout.note }}</span>
      </p>
    </div>
  </PosterSection>
</template>
