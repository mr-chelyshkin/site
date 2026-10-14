<script setup lang="ts">
import { computed, ref } from 'vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import CiInline from '@/components/sections/ci-platform/CiInline.vue'
import CiReplay from '@/components/sections/ci-platform/CiReplay.vue'
import { usePlayback } from '@/composables/usePlayback'
import type { CiPlatformContent } from '@/contents'

const props = defineProps<{
  content: CiPlatformContent['hero']['demo']
  replayLabel: string
}>()

const root = ref<HTMLElement | null>(null)
const { frame, replay } = usePlayback(root, 6, 750)
const at = (n: number) => frame.value >= n
const terminals = computed(() => [props.content.laptop, props.content.runner])
</script>

<template>
  <div ref="root" class="ci-same-box">
    <PastedSheet
      class="ci-same-box__sheet"
      seed="ci-same-box"
      stock="paper"
      :tape="['top']"
      :tilt="-0.8"
    >
      <div class="ci-same-box__body" aria-hidden="true">
        <div class="ci-same-box__terms">
          <div v-for="(where, i) in terminals" :key="i" class="ci-same-box__term">
            <p class="ci-same-box__term-bar">{{ where }}</p>
            <p
              class="ci-same-box__line"
              :class="{ 'ci-same-box__line--typed': at(1) }"
              :style="{ '--chars': content.command.length }"
            >
              <span class="ci-same-box__prompt">$</span>
              {{ ' ' }}<span class="ci-same-box__typed">{{ content.command }}</span>
            </p>
            <p
              class="ci-same-box__line ci-same-box__line--dim"
              :class="{ 'ci-same-box__line--on': at(2) }"
            >
              {{ content.run }}
            </p>
            <p
              class="ci-same-box__line ci-same-box__line--ok"
              :class="{ 'ci-same-box__line--on': at(3) }"
            >
              {{ content.done }}
            </p>
          </div>
        </div>
        <svg
          class="ci-same-box__converge"
          :class="{ 'ci-same-box__converge--on': at(4) }"
          viewBox="0 0 600 64"
          preserveAspectRatio="none"
          focusable="false"
        >
          <path class="ci-same-box__wire" pathLength="1" d="M150 0 C 150 38, 300 28, 300 64" />
          <path class="ci-same-box__wire" pathLength="1" d="M450 0 C 450 38, 300 28, 300 64" />
        </svg>
        <div class="ci-same-box__box" :class="{ 'ci-same-box__box--on': at(5) }">
          <span class="ci-same-box__stamp" :class="{ 'ci-same-box__stamp--on': at(6) }">{{
            content.stamp
          }}</span>
          <code class="ci-same-box__image">{{ content.image }}</code>
          <ul class="ci-same-box__chips" role="list">
            <li v-for="(chip, i) in content.chips" :key="i" class="ci-same-box__chip">
              {{ chip }}
            </li>
          </ul>
        </div>
        <p class="ci-same-box__poster"><CiInline :text="content.poster" /></p>
      </div>
    </PastedSheet>
    <CiReplay :label="replayLabel" @replay="replay" />
  </div>
</template>
