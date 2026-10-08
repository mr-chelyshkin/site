<script setup lang="ts">
import { useId } from 'vue'
import BarCode from '@/components/ui/BarCode.vue'
import face from '@/assets/images/hero-face.png'
import type { Company } from '@/contents'

/** A printed pass under a clear laminate, on a split ring through a brass eyelet. */
defineProps<{ company: Company; number: string; holder: string; nameId: string }>()

// Six passes share the page, so a gradient's id is the pass's own.
const steel = `${useId()}-steel`
</script>

<template>
  <svg class="pass-laminated__ring" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient :id="steel" x1="0" x2="1">
        <stop offset="0" stop-color="#768084" />
        <stop offset="0.45" stop-color="#e6ecee" />
        <stop offset="1" stop-color="#858f93" />
      </linearGradient>
    </defs>
    <g fill="none" :stroke="`url(#${steel})`" stroke-width="2.2">
      <circle cx="12" cy="12" r="8.6" />
      <path
        d="M4.6 8.5A8.6 8.6 0 0 1 19.4 8.5"
        transform="translate(0 1.4)"
        stroke-width="1.6"
        opacity=".8"
      />
    </g>
  </svg>
  <div class="pass__body pass-laminated">
    <div class="pass-laminated__paper">
      <!-- First, so a screen reader meets the company before its facts; the
           grid still shows it under the photo. -->
      <h3 :id="nameId" class="pass-laminated__name">{{ company.name }}</h3>
      <p class="pass-laminated__head" aria-hidden="true">
        <span>Access {{ number }}</span
        >{{ ' ' }}<span>IC-{{ number }}</span>
      </p>
      <!-- Not draggable, so pulling a pass by its photo pulls the pass. -->
      <img
        class="pass-laminated__face"
        :src="face"
        alt=""
        width="42"
        height="56"
        draggable="false"
      />
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
