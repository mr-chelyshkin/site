<script setup lang="ts">
import BarCode from '@/components/ui/BarCode.vue'
import PassMark from '@/components/sections/passes/PassMark.vue'
import type { Company } from '@/contents'
import { validity } from '@/utils/format'

/**
 * An ID in a rigid clear holder, on a steel strap clip: the company's mark
 * under a security hologram, its name under the mark.
 */
defineProps<{ company: Company; number: string; holder: string; nameId: string }>()
</script>

<template>
  <span class="pass-holder__clip" aria-hidden="true" />
  <div class="pass__body pass-holder">
    <span class="pass-holder__slot" aria-hidden="true" />
    <div class="pass-holder__card">
      <p class="pass-holder__band" aria-hidden="true">
        <span>Access</span>{{ ' ' }}<span>{{ number }}</span>
      </p>
      <div class="pass-holder__brand">
        <div class="pass-holder__emblem">
          <PassMark class="pass-holder__mark" :name="company.name" />
          <span class="pass-holder__holo" aria-hidden="true" />
        </div>
        <!-- Before the facts, so a screen reader meets the company first. -->
        <h3 :id="nameId" class="pass-holder__name">{{ company.name }}</h3>
      </div>
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
        <div class="pass__fact">
          <dt class="pass__term">Valid</dt>
          <dd class="pass__value">{{ validity(company.from, company.to) }}</dd>
        </div>
      </dl>
      <p class="pass-holder__note">{{ company.note }}</p>
      <BarCode class="pass-holder__barcode" :seed="company.name" />
    </div>
    <span class="pass-holder__notch" aria-hidden="true" />
    <span class="pass__gloss" aria-hidden="true" />
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
