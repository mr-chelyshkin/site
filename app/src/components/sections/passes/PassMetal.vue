<script setup lang="ts">
import PassMark from '@/components/sections/passes/PassMark.vue'
import type { Company } from '@/contents'
import { validity } from '@/utils/format'

/**
 * A brushed aluminum staff card, laser-etched: the company's mark large where
 * a name would be. It needs no hardware: the ball chain goes straight through
 * its hole.
 */
defineProps<{ company: Company; number: string; holder: string; nameId: string }>()
</script>

<template>
  <div class="pass__body pass-metal">
    <span class="pass-metal__hole" aria-hidden="true" />
    <!-- Read, not shown: the mark says it. -->
    <h3 :id="nameId" class="u-visually-hidden">{{ company.name }}</h3>
    <p class="pass-metal__kicker" aria-hidden="true">{{ company.kicker }}</p>
    <PassMark class="pass-metal__mark" :name="company.name" />
    <!-- The same holder on every pass: etched, not read out six times. -->
    <p class="pass-metal__line pass-metal__who">
      <span aria-hidden="true">{{ holder }}<br /></span>{{ company.role }}<br />{{ company.unit }}
    </p>
    <p class="pass-metal__line pass-metal__who">{{ company.note }}</p>
    <p class="pass-metal__id">
      <span aria-hidden="true">Access {{ number }}<br /></span>Valid
      {{ validity(company.from, company.to) }}
    </p>
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
