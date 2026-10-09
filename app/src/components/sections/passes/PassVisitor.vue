<script setup lang="ts">
import { computed, useId } from 'vue'
import PassMark from '@/components/sections/passes/PassMark.vue'
import type { Company } from '@/contents'
import { validity } from '@/utils/format'

/**
 * A thermal-printed visitor's label in a soft vinyl sleeve, on a bulldog clip,
 * the company's mark printed on.
 */
const props = defineProps<{ company: Company; number: string; holder: string; nameId: string }>()

const purpose = computed(() => props.company.note.replace(/\.$/, ''))
// Printed on one line: every space in the name becomes a non-breaking one.
const guest = computed(() => props.holder.replace(/ /g, '\u00a0'))
// Six passes share the page, so a filter's id is the pass's own.
const soft = `${useId()}-soft`
</script>

<template>
  <span class="pass-visitor__clip" aria-hidden="true" />
  <div class="pass__body pass-visitor">
    <div class="pass-visitor__label">
      <!-- First, so a screen reader meets the company before the rest; the grid
           still shows the title above it, and "Host" over it. -->
      <div class="pass-visitor__lines">
        <h3 :id="nameId" class="pass-visitor__name">{{ company.name }}</h3>
        <p class="pass-visitor__line pass-visitor__host" aria-hidden="true">Host</p>
        <p class="pass-visitor__line">Purpose: {{ purpose }}</p>
        <p class="pass-visitor__line">Guest: {{ guest }}</p>
      </div>
      <p class="pass-visitor__title" aria-hidden="true">
        <span class="pass-visitor__kicker">{{ company.kicker }}</span
        >{{ ' ' }}<small class="pass-visitor__access">Access {{ number }}</small>
      </p>
      <PassMark class="pass-visitor__mark" :name="company.name" />
      <p class="pass-visitor__foot">
        <span>{{ company.role }}</span
        >{{ ' ' }}<span>Valid {{ validity(company.from, company.to) }}</span>
      </p>
    </div>
    <!-- Soft creases in the vinyl, catching the light. -->
    <svg
      class="pass-visitor__wrinkles"
      viewBox="0 0 206 178"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter :id="soft"><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>
      <g
        fill="none"
        stroke="rgb(255 255 255 / 22%)"
        stroke-linecap="round"
        :filter="`url(#${soft})`"
      >
        <path d="M14 40 C60 30 90 58 150 44 S196 52 200 70" stroke-width="5" />
        <path d="M6 128 C50 120 80 140 130 126" stroke-width="7" />
      </g>
      <g fill="none" stroke="rgb(255 255 255 / 40%)" stroke-width="0.8" stroke-linecap="round">
        <path d="M150 20 C164 40 170 70 166 110" />
        <path d="M22 70 C40 66 52 74 70 70" />
      </g>
    </svg>
    <span class="pass__gloss" aria-hidden="true" />
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
