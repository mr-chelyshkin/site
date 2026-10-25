<script setup lang="ts">
import BarCode from '@/components/ui/BarCode.vue'
import PassFacts from '@/components/sections/passes/PassFacts.vue'
import PassMark from '@/components/sections/passes/PassMark.vue'
import type { Company } from '@/contents'

defineProps<{ company: Company; number: string; nameId: string }>()
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
          <PassMark class="pass-holder__mark" :logo="company.id" />
          <span class="pass-holder__holo" aria-hidden="true" />
        </div>
        <h3 :id="nameId" class="pass-holder__name">{{ company.name }}</h3>
      </div>
      <PassFacts :company="company" />
      <p class="pass-holder__note">{{ company.note }}</p>
      <BarCode class="pass-holder__barcode" :seed="company.name" />
    </div>
    <span class="pass-holder__notch" aria-hidden="true" />
    <span class="pass__gloss" aria-hidden="true" />
    <span class="pass__shade" aria-hidden="true" />
  </div>
</template>
