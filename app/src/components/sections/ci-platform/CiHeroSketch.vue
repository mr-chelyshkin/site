<script setup lang="ts">
import { ref } from 'vue'
import FlyerSketch from '@/components/sections/FlyerSketch.vue'
import CiReplay from '@/components/sections/ci-platform/CiReplay.vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import type { ProjectSketch } from '@/contents'

defineProps<{
  sketch: ProjectSketch
  replayLabel: string
}>()

const run = ref(0)
</script>

<template>
  <div class="ci-hero-sketch">
    <PastedSheet
      class="ci-hero-sketch__sheet"
      seed="ci-hero-sketch"
      stock="grid"
      :tape="['top']"
      :tilt="-0.8"
    >
      <div class="ci-hero-sketch__body">
        <FlyerSketch :key="run" :sketch="sketch" />
      </div>
    </PastedSheet>
    <CiReplay :label="replayLabel" @replay="run++" />
  </div>
</template>
