<script setup lang="ts">
import { computed, useId, type Component } from 'vue'
import PassHolder from '@/components/sections/passes/PassHolder.vue'
import PassLaminated from '@/components/sections/passes/PassLaminated.vue'
import PassMetal from '@/components/sections/passes/PassMetal.vue'
import PassReel from '@/components/sections/passes/PassReel.vue'
import PassSmartCard from '@/components/sections/passes/PassSmartCard.vue'
import PassVisitor from '@/components/sections/passes/PassVisitor.vue'
import type { Company } from '@/contents'
import { padIndex } from '@/utils/format'
import { SHAPES, kindOf, type PassKind } from '@/utils/pass-kinds'
import { seeded } from '@/utils/seeded'

const props = defineProps<{
  company: Company
  index: number
  /** Name printed on the pass. */
  holder: string
}>()

const KINDS: Record<PassKind, Component> = {
  holder: PassHolder,
  reel: PassReel,
  laminated: PassLaminated,
  smartcard: PassSmartCard,
  metal: PassMetal,
  visitor: PassVisitor,
}

const nameId = `pass-${useId()}`
const number = computed(() => padIndex(props.index))
const kind = computed(() => kindOf(props.company.pass))
// Each pass hangs at its own angle and drop, the same on every visit;
// neighbors lean opposite ways, but little enough that six in a row never
// cover each other's text. A reel hangs lower, under its reel. The kind's
// shape goes to the stylesheet and to usePassPhysics.
const hang = computed(() => {
  const rand = seeded(`${props.company.name}:hang`)
  const lean = props.index % 2 ? 1 : -1
  const shape = SHAPES[kind.value]
  return {
    '--tilt': `${(lean * (1 + rand() * 1.25)).toFixed(2)}deg`,
    // pass-physics needs each pivot at least 16px past `hookY + tie`, room for
    // the hardware under the hook even lifted in hand. The reel clears that by
    // only 3px at the shortest drop: 48 + 32 + 13 = 93 against 90.
    '--drop': `${48 + Math.round(rand() * 34) + shape.dropExtra}px`,
    '--w': `${shape.width}px`,
    '--slot': `${shape.slot}px`,
    '--tie': `${shape.tie}px`,
    '--hook-y': `${shape.hookY}px`,
  }
})
</script>

<template>
  <!-- Focusable, so a keyboard can take a pass in hand, and reach every pass
       on a phone's scrolling cable. -->
  <article
    class="pass"
    :class="`pass--${kind}`"
    :style="hang"
    :data-kind="kind"
    tabindex="0"
    :aria-labelledby="nameId"
  >
    <!-- Turns round the cord when the pass is poked; see usePassPhysics. -->
    <div class="pass__twist">
      <component
        :is="KINDS[kind]"
        :company="company"
        :number="number"
        :holder="holder"
        :name-id="nameId"
      />
    </div>
  </article>
</template>
