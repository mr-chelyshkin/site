<script setup lang="ts">
import PassMark from '@/components/sections/passes/PassMark.vue'
import type { Company } from '@/contents'
import { validity } from '@/utils/format'

/**
 * A clear contactless smart card, its antenna and chip showing, on a vinyl
 * strap with a snap: the company's mark printed on, the facts in a row
 * under it.
 */
defineProps<{ company: Company; number: string; holder: string; nameId: string }>()
</script>

<template>
  <span class="pass-smartcard__strap" aria-hidden="true" />
  <div class="pass__body pass-smartcard">
    <!-- The antenna: five turns of copper round the card and the bridge to its
         chip, stretched to the card's size. -->
    <svg
      class="pass-smartcard__coil"
      viewBox="0 0 168 290"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="#c98b52" stroke-width="0.9" vector-effect="non-scaling-stroke">
        <rect x="0" y="0" width="168" height="290" rx="9" />
        <rect x="3.4" y="3.4" width="161.2" height="283.2" rx="8" />
        <rect x="6.8" y="6.8" width="154.4" height="276.4" rx="7" />
        <rect x="10.2" y="10.2" width="147.6" height="269.6" rx="6" />
        <rect x="13.6" y="13.6" width="140.8" height="262.8" rx="5" />
        <path d="M17 273 L30 244" stroke-width="1.6" />
      </g>
      <rect
        x="27"
        y="234"
        width="12"
        height="12"
        rx="1.5"
        fill="#15181a"
        stroke="#d9a46b"
        stroke-width="0.8"
      />
      <g stroke="#d9a46b" stroke-width="0.6">
        <path d="M29 234 v-3 M33 234 v-3 M37 234 v-3" />
      </g>
    </svg>
    <span class="pass-smartcard__slot" aria-hidden="true" />
    <!-- Read, not shown: the mark says it. -->
    <h3 :id="nameId" class="u-visually-hidden">{{ company.name }}</h3>
    <p class="pass-smartcard__band" aria-hidden="true">
      <span>Access</span>{{ ' ' }}<span>{{ number }}</span>
    </p>
    <PassMark class="pass-smartcard__mark" :name="company.name" />
    <dl class="pass__facts pass-smartcard__facts">
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
      <div class="pass__fact">
        <dt class="pass__term">Valid</dt>
        <dd class="pass__value">{{ validity(company.from, company.to) }}</dd>
      </div>
    </dl>
    <p class="pass-smartcard__note">{{ company.note }}</p>
    <p class="pass-smartcard__foot" aria-hidden="true">
      <span>13.56 MHz</span>
    </p>
    <span class="pass__gloss" aria-hidden="true" />
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
