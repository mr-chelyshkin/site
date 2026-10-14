<script setup lang="ts">
import PastedSheet from '@/components/ui/PastedSheet.vue'
import type { CiPlatformContent } from '@/contents'

defineProps<{ content: CiPlatformContent['finePrint']['sheet'] }>()
</script>

<template>
  <PastedSheet class="ci-fine" seed="ci-fine-print" stock="paper" :tape="['top']" :tilt="-0.6">
    <div class="ci-fine__body">
      <section class="ci-fine__column">
        <h3 class="ci-fine__title">{{ content.pinned.title }}</h3>
        <ul class="ci-fine__list" role="list">
          <li v-for="(item, i) in content.pinned.items" :key="i" class="ci-fine__item">
            {{ item }}
          </li>
        </ul>
      </section>
      <section class="ci-fine__column">
        <h3 class="ci-fine__title">{{ content.honest.title }}</h3>
        <dl class="ci-fine__terms">
          <dt class="ci-fine__term">{{ content.honest.same.label }}</dt>
          <dd>{{ content.honest.same.text }}</dd>
          <dt class="ci-fine__term">{{ content.honest.differ.label }}</dt>
          <dd>{{ content.honest.differ.text }}</dd>
        </dl>
      </section>
    </div>
  </PastedSheet>
</template>
