<script setup lang="ts">
import type { GuideZones } from '@/components/sections/ci-platform/types'

defineProps<{ content: GuideZones }>()
</script>

<template>
  <figure class="ci-zones">
    <div class="ci-zones__grid" role="img" :aria-label="content.label">
      <div class="ci-zones__zone">
        <p class="ci-zones__label">{{ content.reproducible.label }}</p>
        <ul class="ci-zones__items" role="list">
          <li v-for="(item, i) in content.reproducible.items" :key="i" class="ci-zones__item">
            {{ item }}
          </li>
        </ul>
      </div>
      <div class="ci-zones__gate">
        <span>{{ content.gate }}</span>
      </div>
      <div class="ci-zones__zone ci-zones__zone--privileged">
        <p class="ci-zones__label">{{ content.privileged.label }}</p>
        <ul class="ci-zones__items" role="list">
          <li v-for="(item, i) in content.privileged.items" :key="i" class="ci-zones__item">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
    <figcaption class="ci-zones__note">{{ content.note }}</figcaption>
  </figure>
</template>
