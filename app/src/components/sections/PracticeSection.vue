<script setup lang="ts">
import { computed, ref } from 'vue'
import ExplodedStack from '@/components/sections/ExplodedStack.vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
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
      :tape="['top-left', 'top-right', 'bottom-left', 'bottom-right']"
      :tilt="0.5"
      live
    >
      <div ref="drawing" class="practice__drawing" :class="{ 'practice__drawing--wide': wide }">
        <div class="c-kicker practice__kicker">
          <h2 :id="titleId" class="practice__title">({{ content.index }}) {{ content.label }}</h2>
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
      </div>
    </PastedSheet>
  </WallSection>
</template>
