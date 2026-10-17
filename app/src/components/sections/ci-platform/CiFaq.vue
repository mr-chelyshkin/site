<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import WallSection from '@/components/ui/WallSection.vue'
import CiInline from '@/components/sections/ci-platform/CiInline.vue'
import type { CiPlatformContent } from '@/contents'

const props = defineProps<{ content: CiPlatformContent['faq'] }>()

const id = useId()
const open = ref(0)

const toggle = (i: number) => {
  open.value = open.value === i ? -1 : i
}

const columns = computed(() => {
  const items = props.content.items.map((item, i) => ({ ...item, i }))
  const half = Math.ceil(items.length / 2)
  return [items.slice(0, half), items.slice(half)]
})
</script>

<template>
  <WallSection v-slot="{ titleId }" :id="content.id" class="ci-faq">
    <PastedSheet class="ci-faq__sheet" seed="ci-faq" stock="ink" :tape="['top']" :tilt="-0.4">
      <div class="ci-faq__body">
        <p class="c-kicker ci-faq__kicker">
          <template v-for="(part, i) in content.kicker" :key="i">
            <span>{{ part }}</span
            >{{ ' ' }}
          </template>
        </p>
        <h2 :id="titleId" class="ci-faq__title">{{ content.title }}</h2>
        <div class="ci-faq__columns">
          <div v-for="(column, c) in columns" :key="c" class="ci-faq__column">
            <div
              v-for="item in column"
              :key="item.i"
              class="ci-faq__item"
              :class="{ 'ci-faq__item--open': open === item.i }"
            >
              <h3 class="ci-faq__question">
                <button
                  :id="`${id}-q${item.i}`"
                  type="button"
                  class="ci-faq__toggle"
                  :aria-expanded="open === item.i"
                  :aria-controls="`${id}-a${item.i}`"
                  @click="toggle(item.i)"
                >
                  <span>{{ item.q }}</span>
                  <span class="ci-faq__sign" aria-hidden="true" />
                </button>
              </h3>
              <div
                :id="`${id}-a${item.i}`"
                class="ci-faq__answer"
                role="region"
                :aria-labelledby="`${id}-q${item.i}`"
                :inert="open !== item.i"
              >
                <div class="ci-faq__answer-inner">
                  <p class="ci-faq__text"><CiInline :text="item.a" /></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PastedSheet>
  </WallSection>
</template>
