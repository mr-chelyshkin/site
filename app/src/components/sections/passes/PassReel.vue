<script setup lang="ts">
import { useId } from 'vue'
import BarCode from '@/components/ui/BarCode.vue'
import face from '@/assets/images/hero-face.png'
import type { Company } from '@/contents'

/**
 * A matte badge on a lobster clasp, hung from the retractable reel that
 * CommerceSection draws at the ring.
 */
defineProps<{ company: Company; number: string; holder: string; nameId: string }>()

// Six passes share the page, so a gradient's id is the pass's own.
const steel = `${useId()}-steel`
</script>

<template>
  <svg class="pass-reel__clasp" viewBox="0 0 15 30" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient :id="steel" x1="0" x2="1">
        <stop offset="0" stop-color="#768084" />
        <stop offset="0.45" stop-color="#e6ecee" />
        <stop offset="1" stop-color="#858f93" />
      </linearGradient>
    </defs>
    <g fill="none" :stroke="`url(#${steel})`" stroke-linecap="round">
      <circle cx="7.5" cy="3.4" r="2.6" stroke-width="1.6" />
      <path
        d="M7.5 6.2C2.8 8.4 2 16.5 3.4 21.6c1.4 5 7.4 5.2 8.8.2 1.1-4 .6-8.6-1.8-11.2"
        stroke-width="2.4"
      />
      <path d="M10.4 10.6l2.2-2" stroke-width="1.4" />
    </g>
  </svg>
  <div class="pass__body pass-reel">
    <span class="pass-reel__slot" aria-hidden="true" />
    <!-- First, so a screen reader meets the company before its facts; the
         photo's row still shows above it. -->
    <h3 :id="nameId" class="pass-reel__name">{{ company.name }}</h3>
    <div class="pass-reel__top">
      <!-- Not draggable, so pulling a pass by its photo pulls the pass. -->
      <img class="pass-reel__face" :src="face" alt="" width="42" height="56" draggable="false" />
      <svg class="pass-reel__nfc" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M8 7.5c1.6 2.7 1.6 6.3 0 9" />
          <path d="M12 5c2.7 4.3 2.7 9.7 0 14" />
          <path d="M16 2.8c3.8 5.8 3.8 12.6 0 18.4" />
        </g>
      </svg>
    </div>
    <p class="pass-reel__role">{{ company.role }}</p>
    <dl class="pass__facts pass-reel__facts">
      <!-- The same holder on every pass: printed, not read out six times. -->
      <div class="pass__fact" aria-hidden="true">
        <dt class="pass__term">Name</dt>
        <dd class="pass__value">{{ holder }}</dd>
      </div>
      <div class="pass__fact">
        <dt class="pass__term">Unit</dt>
        <dd class="pass__value">{{ company.unit }}</dd>
      </div>
    </dl>
    <p class="pass-reel__note">{{ company.note }}</p>
    <div class="pass-reel__foot" aria-hidden="true">
      <span>Access {{ number }}</span
      >{{ ' ' }}<BarCode class="pass-reel__barcode" :seed="company.name" />
    </div>
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
