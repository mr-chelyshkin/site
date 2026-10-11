<script setup lang="ts">
import { useId, type VNode } from 'vue'
import SprayText from '@/components/ui/SprayText.vue'
import { useReveal } from '@/composables/useReveal'

withDefaults(
  defineProps<{
    id: string
    index?: string
    numeralAt?: 'left' | 'right'
  }>(),
  { numeralAt: 'left' },
)
defineSlots<{ default(props: { titleId: string }): VNode[] }>()

const titleId = `section-${useId()}`
const { target, isRevealed } = useReveal()
</script>

<template>
  <section
    :id="id"
    ref="target"
    class="c-wall-section u-paste"
    :class="{ 'u-paste--shown': isRevealed }"
    :aria-labelledby="titleId"
  >
    <SprayText
      v-if="index"
      class="c-wall-section__numeral"
      :class="`c-wall-section__numeral--${numeralAt}`"
      :lines="[index]"
      aria-hidden="true"
    />
    <div class="o-wall">
      <slot :title-id="titleId" />
    </div>
  </section>
</template>
