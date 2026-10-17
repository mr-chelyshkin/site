<script setup lang="ts">
import { computed } from 'vue'
import { boxFaces, svgPoints, type Box, type Projector } from '@/utils/isometric'

const props = defineProps<{
  box: Box
  project: Projector
  side?: string
}>()

const faces = computed(() => boxFaces(props.project, props.box))
const sideStyle = computed(() => (props.side ? { fill: props.side } : undefined))
</script>

<template>
  <g class="ci-solid">
    <polygon class="ci-solid__right" :style="sideStyle" :points="svgPoints(faces.right)" />
    <polygon class="ci-solid__front" :style="sideStyle" :points="svgPoints(faces.front)" />
    <polygon class="ci-solid__top" :points="svgPoints(faces.top)" />
  </g>
</template>
