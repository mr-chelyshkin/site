<script setup lang="ts">
import { computed, useId } from 'vue'
import BarCode from '@/components/ui/BarCode.vue'
import face from '@/assets/images/hero-face.png'
import type { Company } from '@/contents'
import { padIndex } from '@/utils/format'
import { seeded } from '@/utils/seeded'

const props = defineProps<{
  company: Company
  index: number
  /** Name printed on the pass. */
  holder: string
}>()

const nameId = `pass-${useId()}`
const number = computed(() => padIndex(props.index))
// Each pass hangs at its own angle and drop, the same on every visit;
// neighbors lean opposite ways, but little enough that six in a row never
// cover each other's text.
const hang = computed(() => {
  const rand = seeded(`${props.company.name}:hang`)
  const lean = props.index % 2 ? 1 : -1
  return {
    '--tilt': `${(lean * (1 + rand() * 1.25)).toFixed(2)}deg`,
    // pass-physics needs at least 36px, room for the clip under the ring even
    // when the pass is lifted in hand (`slotY` ≥ `R_MIN + LIFT`); 48 to 82
    // clears it.
    '--drop': `${48 + Math.round(rand() * 34)}px`,
  }
})
</script>

<template>
  <!-- Focusable, so a keyboard can take a pass in hand, and reach every pass
       on a phone's scrolling cable. -->
  <article class="pass" :style="hang" tabindex="0" :aria-labelledby="nameId">
    <!-- Turns round the cord when the pass is poked; see usePassPhysics. -->
    <div class="pass__twist">
      <span class="pass__clip" aria-hidden="true" />
      <div class="pass__card">
        <!-- First, so a screen reader meets the company before its facts; the
             grid still shows it under the photo. -->
        <h3 :id="nameId" class="pass__name">{{ company.name }}</h3>
        <span class="pass__slot" aria-hidden="true" />
        <p class="pass__band" aria-hidden="true">
          <span>Access</span>{{ ' ' }}<span>{{ number }}</span>
        </p>
        <!-- Not draggable, so pulling a pass by its photo pulls the pass. -->
        <img class="pass__face" :src="face" alt="" width="42" height="56" draggable="false" />
        <dl class="pass__facts">
          <!-- The same holder on every pass: printed, not read out six times. -->
          <div class="pass__fact" aria-hidden="true">
            <dt class="pass__term">Name</dt>
            <dd class="pass__value">{{ holder }}</dd>
          </div>
          <div class="pass__fact">
            <dt class="pass__term">Unit</dt>
            <dd class="pass__value">{{ company.unit }}</dd>
          </div>
          <div class="pass__fact">
            <dt class="pass__term">Role</dt>
            <dd class="pass__value">{{ company.role }}</dd>
          </div>
        </dl>
        <p class="pass__note">{{ company.note }}</p>
        <span class="pass__id" aria-hidden="true">IC-{{ number }}</span>
        <BarCode class="pass__barcode" :seed="company.name" />
        <span class="pass__shade" aria-hidden="true" />
      </div>
    </div>
  </article>
</template>
