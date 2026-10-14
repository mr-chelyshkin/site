<script setup lang="ts">
import { ref } from 'vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import WallLabel from '@/components/ui/WallLabel.vue'
import WallSection from '@/components/ui/WallSection.vue'
import { usePlayback } from '@/composables/usePlayback'
import type { CiPlatformContent } from '@/contents'
import { vMagnet } from '@/directives/magnet'

const props = defineProps<{
  content: CiPlatformContent['finale']
  back: CiPlatformContent['back']
}>()

const root = ref<HTMLElement | null>(null)
const { frame } = usePlayback(root, props.content.checklist.length, 420)
</script>

<template>
  <WallSection v-slot="{ titleId }" :id="content.id" class="ci-finale">
    <div ref="root" class="ci-finale__wrap">
      <PastedSheet
        class="ci-finale__sheet"
        seed="ci-finale"
        stock="cyan"
        :tape="['top']"
        tape-kind="drawn"
        :tilt="-1.2"
      >
        <div class="ci-finale__body">
          <p class="c-kicker">
            <template v-for="(part, i) in content.kicker" :key="i">
              <span>{{ part }}</span
              >{{ ' ' }}
            </template>
          </p>
          <h2 :id="titleId" class="ci-finale__title">{{ content.title }}</h2>
          <p class="ci-finale__copy">{{ content.body }}</p>
          <ul class="ci-finale__list" role="list">
            <li
              v-for="(item, i) in content.checklist"
              :key="i"
              class="ci-finale__item"
              :class="{ 'ci-finale__item--done': frame >= i + 1 }"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </PastedSheet>
      <a v-magnet class="ci-finale__back" :href="back.href" :aria-label="back.label">
        <WallLabel :text="`← ${back.label}`" :tilt="2" />
      </a>
    </div>
  </WallSection>
</template>
