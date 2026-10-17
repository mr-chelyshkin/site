<script setup lang="ts">
import { computed } from 'vue'
import CiInline from '@/components/sections/ci-platform/CiInline.vue'
import type { CiPlatformContent } from '@/contents'

const props = defineProps<{
  content: CiPlatformContent['picture']['panel']
  selected: string | null
}>()
defineSlots<{ inset(props: { id: string }): unknown }>()

const part = computed(() => props.content.parts.find(({ id }) => id === props.selected) ?? null)
</script>

<template>
  <div class="ci-panel" aria-live="polite">
    <Transition name="ci-panel" mode="out-in">
      <div v-if="part" :key="part.id" class="ci-panel__part">
        <p class="ci-panel__zone">{{ part.zone }}</p>
        <h3 class="ci-panel__title">{{ part.label }}</h3>
        <div class="ci-panel__inset">
          <slot name="inset" :id="part.id" />
        </div>
        <p class="ci-panel__text"><CiInline :text="part.text" /></p>
        <ul v-if="part.points.length" class="ci-panel__points" role="list">
          <li
            v-for="(point, i) in part.points"
            :key="point.title"
            class="ci-panel__point"
            :style="{ '--row': i }"
          >
            <strong class="ci-panel__point-title">{{ point.title }}</strong>
            <span class="ci-panel__point-text"><CiInline :text="point.text" /></span>
          </li>
        </ul>
      </div>
      <div v-else key="intro" class="ci-panel__part">
        <p class="ci-panel__zone">{{ content.intro.kicker }}</p>
        <h3 class="ci-panel__title">{{ content.intro.title }}</h3>
        <div class="ci-panel__inset">
          <slot name="inset" id="dot" />
        </div>
        <ul class="ci-panel__legend" role="list">
          <li v-for="item in content.intro.legend" :key="item.tone" class="ci-panel__legend-item">
            <span class="ci-panel__dot" :class="`ci-panel__dot--${item.tone}`" aria-hidden="true" />
            <span>{{ item.text }}</span>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
