<script setup lang="ts">
import type { Company } from '@/contents'
import { validity } from '@/utils/format'

withDefaults(defineProps<{ company: Company; showRole?: boolean }>(), {
  showRole: true,
})
</script>

<template>
  <dl class="pass__facts">
    <div v-if="showRole" class="pass__fact">
      <dt class="pass__term">Role</dt>
      <dd class="pass__value">{{ company.role }}</dd>
    </div>
    <div class="pass__fact">
      <dt class="pass__term">Valid</dt>
      <dd class="pass__value">{{ validity(company.from, company.to) }}</dd>
    </div>
  </dl>
</template>
