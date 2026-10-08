<script setup lang="ts">
import BarCode from '@/components/ui/BarCode.vue'
import face from '@/assets/images/hero-face.png'
import type { Company } from '@/contents'

/** A photo ID in a rigid clear holder, on a steel strap clip. */
defineProps<{ company: Company; number: string; holder: string; nameId: string }>()
</script>

<template>
  <span class="pass-holder__clip" aria-hidden="true" />
  <div class="pass__body pass-holder">
    <span class="pass-holder__slot" aria-hidden="true" />
    <div class="pass-holder__card">
      <!-- First, so a screen reader meets the company before its facts; the
           grid still shows it under the photo. -->
      <h3 :id="nameId" class="pass-holder__name">{{ company.name }}</h3>
      <p class="pass-holder__band" aria-hidden="true">
        <span>Access</span>{{ ' ' }}<span>{{ number }}</span>
      </p>
      <div class="pass-holder__photo">
        <!-- Not draggable, so pulling a pass by its photo pulls the pass. -->
        <img
          class="pass-holder__face"
          :src="face"
          alt=""
          width="42"
          height="56"
          draggable="false"
        />
        <span class="pass-holder__holo" aria-hidden="true" />
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
      </dl>
      <p class="pass-holder__note">{{ company.note }}</p>
      <span class="pass-holder__id" aria-hidden="true">IC-{{ number }}</span>
      <BarCode class="pass-holder__barcode" :seed="company.name" />
    </div>
    <span class="pass-holder__notch" aria-hidden="true" />
    <span class="pass__gloss" aria-hidden="true" />
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
