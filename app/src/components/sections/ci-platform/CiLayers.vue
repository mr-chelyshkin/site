<script setup lang="ts">
import CiInline from '@/components/sections/ci-platform/CiInline.vue'
import type { GuideLayers } from '@/components/sections/ci-platform/types'

defineProps<{ layers: GuideLayers }>()
</script>

<template>
  <figure class="ci-layers">
    <figcaption class="ci-step__label">{{ layers.label }}</figcaption>
    <ol class="ci-layers__list" role="list">
      <template v-for="(layer, i) in layers.items" :key="layer.name">
        <li class="ci-layers__layer">
          <span class="ci-layers__name">{{ layer.name }}</span>
          <code class="ci-layers__file">{{ layer.file }}</code>
          <span class="ci-layers__text">{{ layer.text }}</span>
        </li>
        <li class="ci-layers__hop" :style="{ '--hop': i }">
          <span class="ci-layers__line" aria-hidden="true"><span class="ci-layers__dot" /></span>
          <span class="ci-layers__carry"><CiInline :text="layers.hops[i] ?? ''" /></span>
        </li>
      </template>
      <li class="ci-layers__end">{{ layers.end }}</li>
    </ol>
  </figure>
</template>
