<script setup lang="ts">
import { computed, useId } from 'vue'
import BaseImage from '@/components/ui/BaseImage.vue'
import { useGlitch } from '@/composables/useGlitch'
import type { HomeContent } from '@/contents'

const props = defineProps<{ content: HomeContent['hero'] }>()

const titleId = `hero-${useId()}`
const signalFilterId = `hero-signal-${useId()}`
const { isGlitching, trigger, glitchClass } = useGlitch()

// The photo, its torn strips and the face layer draw the same frame from one
// source, so the browser makes a single request for all of them.
const photo = computed(() => ({
  src: props.content.image,
  width: 1600,
  assetWidth: 1600,
  height: 900,
  // In tall frames, cover scales the landscape image to the hero's height.
  sizes: '(min-aspect-ratio: 16/9) 100vw, 178vh',
  priority: true,
}))

const tears = [
  { top: '16%', bottom: '82%', shift: '-2.5%' },
  { top: '38%', bottom: '57%', shift: '4%' },
  { top: '59%', bottom: '33%', shift: '-5%' },
  { top: '84%', bottom: '14%', shift: '3%' },
]
</script>

<template>
  <section class="hero" :aria-labelledby="titleId">
    <svg class="hero__filters" aria-hidden="true" focusable="false">
      <defs>
        <filter
          :id="signalFilterId"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          primitiveUnits="objectBoundingBox"
          color-interpolation-filters="sRGB"
        >
          <feComponentTransfer in="SourceGraphic" result="contrast">
            <feFuncR type="linear" slope="1.28" intercept="-0.16" />
            <feFuncG type="linear" slope="1.28" intercept="-0.16" />
            <feFuncB type="linear" slope="1.28" intercept="-0.16" />
          </feComponentTransfer>
          <feColorMatrix
            in="contrast"
            type="matrix"
            values="0.0733 0.2467 0.0249 0 0
                    0.1541 0.5185 0.0523 0 0
                    0.1601 0.5385 0.0544 0 0
                    0 0 0 1 0"
            result="cool"
          />
          <feOffset in="cool" dx="-0.022" result="cool-shift" />
          <feColorMatrix
            in="contrast"
            type="matrix"
            values="0.1786 0.6008 0.0606 0 0
                    0.1169 0.3934 0.0397 0 0
                    0.0829 0.2789 0.0282 0 0
                    0 0 0 1 0"
            result="warm"
          />
          <feOffset in="warm" dx="0.016" result="warm-shift" />
          <feBlend in="cool-shift" in2="warm-shift" mode="screen" />
        </filter>
      </defs>
    </svg>

    <div class="hero__image">
      <div class="hero__exposure" :style="{ filter: `url(#${signalFilterId})` }">
        <BaseImage class="hero__photo" v-bind="photo" :alt="content.imageAlt" />
        <div
          v-for="tear in tears"
          :key="tear.top"
          class="hero__tear"
          :style="{
            '--tear-top': tear.top,
            '--tear-bottom': tear.bottom,
            '--tear-shift': tear.shift,
          }"
          aria-hidden="true"
        >
          <BaseImage v-bind="photo" alt="" />
        </div>
      </div>
      <div class="hero__signal" aria-hidden="true">
        <span v-for="block in 5" :key="block" class="hero__signal-block" />
      </div>
      <BaseImage class="hero__face" v-bind="photo" alt="" aria-hidden="true" />
    </div>

    <h1 :id="titleId" class="hero__title" :aria-label="content.title">
      <span class="hero__headline" aria-hidden="true">
        <span v-for="line in content.headline" :key="line" class="hero__line">
          {{ line }}
        </span>
      </span>
      <span class="hero__discipline" aria-hidden="true">
        <span @mouseenter="trigger">
          <span class="hero__discipline-text" :class="{ [glitchClass]: isGlitching }">
            {{ content.discipline }}
          </span>
        </span>
      </span>
    </h1>
  </section>
</template>
