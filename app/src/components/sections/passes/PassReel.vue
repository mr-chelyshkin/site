<script setup lang="ts">
import { useId } from 'vue'
import BarCode from '@/components/ui/BarCode.vue'
import PassMark from '@/components/sections/passes/PassMark.vue'
import type { Company } from '@/contents'
import { validity } from '@/utils/format'

/**
 * A matte badge on a clear vinyl strap, snapped through its slot, hung from
 * the retractable reel that CommerceSection draws at the ring; the company's
 * mark screened on, beside the role.
 */
defineProps<{ company: Company; number: string; holder: string; nameId: string }>()

// Six passes share the page, so a gradient's id is the pass's own.
const id = useId()
const sheen = `${id}-sheen`
const stud = `${id}-stud`
</script>

<template>
  <!-- In the card's own units: x from its middle, y down from its top edge. -->
  <svg class="pass-reel__clasp" viewBox="-12 -21 24 34" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient :id="sheen" x1="0" x2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0.06" />
        <stop offset="0.28" stop-color="#fff" stop-opacity="0.34" />
        <stop offset="0.5" stop-color="#fff" stop-opacity="0.08" />
        <stop offset="1" stop-color="#fff" stop-opacity="0.2" />
      </linearGradient>
      <radialGradient :id="stud" cx="0.36" cy="0.3" r="0.8">
        <stop offset="0" stop-color="#fbfdfd" />
        <stop offset="0.35" stop-color="#c3cbce" />
        <stop offset="0.8" stop-color="#646e72" />
        <stop offset="1" stop-color="#3f474b" />
      </radialGradient>
    </defs>
    <!-- The strap's back layer, up from behind the card to the snap. -->
    <rect class="pass-reel__strap" x="-7.5" y="-8" width="15" height="8" />
    <!-- The front layer: punched at its rounded top for the line, down over
         the card and into the slot, where it folds round behind. -->
    <path
      class="pass-reel__strap"
      d="M-7.5-14Q-7.5-17.6-4-17.6H4Q7.5-17.6 7.5-14V10Q7.5 11.6 5.9 11.6H-5.9Q-7.5 11.6-7.5 10Z"
    />
    <path
      class="pass-reel__sheen"
      :fill="`url(#${sheen})`"
      d="M-7.5-14Q-7.5-17.6-4-17.6H4Q7.5-17.6 7.5-14V10Q7.5 11.6 5.9 11.6H-5.9Q-7.5 11.6-7.5 10Z"
    />
    <path class="pass-reel__fold" d="M-6.2 11.1H6.2" />
    <circle class="pass-reel__hole" cx="0" cy="-14.4" r="1.5" />
    <!-- The line loops through the hole from its crimp. -->
    <path class="pass-reel__loop" d="M0-16.4C-1.9-15.8-1.9-13.3 0-13.1 1.9-13.3 1.9-15.8 0-16.4" />
    <rect class="pass-reel__crimp" x="-1.2" y="-18.9" width="2.4" height="3" rx="0.9" />
    <!-- The snap that closes the strap round the card. -->
    <circle class="pass-reel__snap" :fill="`url(#${stud})`" cx="0" cy="-5.6" r="4.4" />
    <circle class="pass-reel__snap-dome" cx="0" cy="-5.6" r="2.1" />
  </svg>
  <div class="pass__body pass-reel">
    <span class="pass-reel__slot" aria-hidden="true" />
    <!-- Read, not shown: the mark says it. -->
    <h3 :id="nameId" class="u-visually-hidden">{{ company.name }}</h3>
    <div class="pass-reel__top">
      <p class="pass-reel__role">{{ company.role }}</p>
      <PassMark class="pass-reel__mark" :name="company.name" />
    </div>
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
      <div class="pass__fact">
        <dt class="pass__term">Valid</dt>
        <dd class="pass__value">{{ validity(company.from, company.to) }}</dd>
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
