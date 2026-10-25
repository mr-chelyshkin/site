<script setup lang="ts">
import { useId } from 'vue'
import BarCode from '@/components/ui/BarCode.vue'
import PassFacts from '@/components/sections/passes/PassFacts.vue'
import PassMark from '@/components/sections/passes/PassMark.vue'
import type { Company } from '@/contents'

defineProps<{ company: Company; number: string; nameId: string }>()

const id = useId()
const sheen = `${id}-sheen`
const stud = `${id}-stud`
</script>

<template>
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
    <rect class="pass-reel__strap" x="-7.5" y="-8" width="15" height="8" />
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
    <rect class="pass-reel__crimp" x="-1.2" y="-18.9" width="2.4" height="3" rx="0.9" />
    <circle class="pass-reel__snap" :fill="`url(#${stud})`" cx="0" cy="-5.6" r="4.4" />
    <circle class="pass-reel__snap-dome" cx="0" cy="-5.6" r="2.1" />
  </svg>
  <div class="pass__body pass-reel">
    <span class="pass-reel__glow" aria-hidden="true" />
    <span class="pass-reel__slot" aria-hidden="true" />
    <h3 :id="nameId" class="u-visually-hidden">{{ company.name }}</h3>
    <div class="pass-reel__top">
      <p class="pass-reel__role">{{ company.role }}</p>
      <PassMark class="pass-reel__mark" :logo="company.id" />
    </div>
    <PassFacts class="pass-reel__facts" :company="company" :show-role="false" />
    <p class="pass-reel__note">{{ company.note }}</p>
    <div class="pass-reel__foot" aria-hidden="true">
      <span>Access {{ number }}</span
      >{{ ' ' }}<BarCode class="pass-reel__barcode" :seed="company.name" />
    </div>
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
