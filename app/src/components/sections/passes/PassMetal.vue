<script setup lang="ts">
import face from '@/assets/images/hero-face.png'
import type { Company } from '@/contents'

/**
 * A brushed aluminum staff card, laser-etched. It needs no hardware: the
 * ball chain goes straight through its hole.
 */
defineProps<{ company: Company; number: string; holder: string; nameId: string }>()
</script>

<template>
  <div class="pass__body pass-metal">
    <span class="pass-metal__hole" aria-hidden="true" />
    <!-- First, so a screen reader meets the company before its facts; the
         kicker still shows above it. -->
    <h3 :id="nameId" class="pass-metal__name">{{ company.name }}</h3>
    <p class="pass-metal__kicker" aria-hidden="true">{{ company.kicker }}</p>
    <div class="pass-metal__mid">
      <!-- Not draggable, so pulling a pass by its photo pulls the pass. -->
      <img class="pass-metal__face" :src="face" alt="" width="42" height="56" draggable="false" />
      <!-- The same holder on every pass: etched, not read out six times. -->
      <p class="pass-metal__line">
        <span aria-hidden="true">{{ holder }}<br /></span>{{ company.role }}<br />{{ company.unit }}
      </p>
    </div>
    <p class="pass-metal__line">{{ company.note }}</p>
    <p class="pass-metal__id" aria-hidden="true">Access {{ number }} · IC-{{ number }}</p>
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
