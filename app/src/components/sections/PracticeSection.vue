<script setup lang="ts">
import { computed, ref } from 'vue'
import ExplodedStack from '@/components/sections/ExplodedStack.vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import WallLabel from '@/components/ui/WallLabel.vue'
import WallSection from '@/components/ui/WallSection.vue'
import { useElementWidth } from '@/composables/useElementWidth'
import type { HomeContent } from '@/contents'

defineProps<{ content: HomeContent['practice'] }>()

// From this sheet width the drawing is laid out as on paper, callouts beside
// it; below it everything flows in one column.
const WIDE_SHEET = 880

const drawing = ref<HTMLElement | null>(null)
const width = useElementWidth(drawing)
const wide = computed(() => width.value >= WIDE_SHEET)
</script>

<template>
  <WallSection v-slot="{ titleId }" :id="content.id" :index="content.index" class="practice">
    <PastedSheet
      class="practice__sheet"
      seed="practice"
      stock="grid"
      :tape="['top-left', 'top-right']"
      :tilt="0.5"
    >
      <div ref="drawing" class="practice__drawing" :class="{ 'practice__drawing--wide': wide }">
        <div class="c-kicker practice__kicker">
          <h2 :id="titleId" class="practice__title">({{ content.index }}) {{ content.label }}</h2>
          {{ ' ' }}<span>{{ content.sheet }}</span>
        </div>

        <p class="practice__statement">
          <template v-for="(segment, i) in content.statement" :key="i">
            <span
              v-if="segment.mark"
              class="practice__mark"
              :class="`practice__mark--${segment.mark}`"
              >{{ segment.text }}</span
            >
            <template v-else>{{ segment.text }}</template>
          </template>
        </p>

        <ExplodedStack class="practice__stack" :layers="content.layers" :wide="wide" />

        <p class="practice__figure">{{ content.figure }}</p>

        <dl class="practice__title-block">
          <div
            v-for="(row, i) in content.titleBlock"
            :key="i"
            class="practice__title-row"
            :class="{ 'practice__title-row--main': i === 0 }"
          >
            <dt class="practice__title-term">{{ row.term }}</dt>
            <dd class="practice__title-value">{{ row.value }}</dd>
          </div>
        </dl>
      </div>
    </PastedSheet>

    <WallLabel
      v-for="(label, i) in content.labels"
      :key="i"
      class="practice__label"
      :class="`practice__label--${i + 1}`"
      :text="label"
      :tilt="i % 2 ? -6 : -5"
    />
  </WallSection>
</template>
