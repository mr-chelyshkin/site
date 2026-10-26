<script setup lang="ts">
import PassMark from '@/components/sections/passes/PassMark.vue'
import type { Company } from '@/contents'
import { validity } from '@/utils/format'

defineProps<{ company: Company; number: string; nameId: string }>()
</script>

<template>
  <div class="pass__body pass-metal">
    <span class="pass-metal__sheen" aria-hidden="true" />
    <span class="pass-metal__hole" aria-hidden="true" />
    <h3 :id="nameId" class="u-visually-hidden">{{ company.name }}</h3>
    <p class="pass-metal__kicker" aria-hidden="true">{{ company.kicker }}</p>
    <PassMark class="pass-metal__mark" :logo="company.id" />
    <p class="pass-metal__line">{{ company.role }}</p>
    <p class="pass-metal__line pass-metal__note">{{ company.note }}</p>
    <p class="pass-metal__id">
      <span aria-hidden="true">Access {{ number }}<br /></span>Valid
      {{ validity(company.from, company.to) }}
    </p>
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
