<script setup lang="ts">
import { useId } from 'vue'
import BarCode from '@/components/ui/BarCode.vue'
import PassFacts from '@/components/sections/passes/PassFacts.vue'
import PassMark from '@/components/sections/passes/PassMark.vue'
import type { Company } from '@/contents'

defineProps<{ company: Company; number: string; nameId: string }>()

const id = useId()
const steel = `${id}-steel`
const through = `${id}-through`
</script>

<template>
  <svg class="pass-laminated__ring" viewBox="-12 -8 24 30" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient :id="steel" x1="0" x2="1">
        <stop offset="0" stop-color="#768084" />
        <stop offset="0.45" stop-color="#e6ecee" />
        <stop offset="1" stop-color="#858f93" />
      </linearGradient>
      <clipPath :id="through">
        <rect x="-12" y="-8" width="24" height="8" />
        <circle cx="0" cy="16.5" r="3.6" />
      </clipPath>
    </defs>
    <g class="pass-laminated__ring-back" :clip-path="`url(#${through})`">
      <path d="M0-3A6.5 8.5 0 0 0 0 14" />
      <path d="M-.7-3A6.5 8.5 0 0 0-.7 14" />
    </g>
    <g class="pass-laminated__ring-front" :stroke="`url(#${steel})`">
      <path d="M0-3A6.5 8.5 0 0 1 0 14" stroke-width="2" />
      <path class="pass-laminated__ring-seam" d="M-.7-3A6.5 8.5 0 0 1 3.69 11.77" />
      <path d="M-.7-3A6.5 8.5 0 0 1 3.69 11.77" stroke-width="1.3" />
    </g>
  </svg>
  <div class="pass__body pass-laminated">
    <div class="pass-laminated__paper">
      <h3 :id="nameId" class="u-visually-hidden">{{ company.name }}</h3>
      <p class="pass-laminated__head" aria-hidden="true">
        <span>Access {{ number }}</span>
      </p>
      <PassMark class="pass-laminated__mark" :logo="company.id" />
      <PassFacts :company="company" />
      <p class="pass-laminated__note">{{ company.note }}</p>
      <BarCode class="pass-laminated__barcode" :seed="company.name" />
    </div>
    <span class="pass-laminated__eyelet" aria-hidden="true" />
    <span class="pass-laminated__bubble pass-laminated__bubble--left" aria-hidden="true" />
    <span class="pass-laminated__bubble pass-laminated__bubble--right" aria-hidden="true" />
    <span class="pass__gloss" aria-hidden="true" />
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
