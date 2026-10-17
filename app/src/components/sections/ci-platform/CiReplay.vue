<script setup lang="ts">
import KeyCap from '@/components/ui/KeyCap.vue'

defineProps<{ label: string }>()
defineEmits<{ replay: [] }>()
</script>

<template>
  <KeyCap class="ci-replay" @click="$emit('replay')">
    <span class="ci-replay__icon" aria-hidden="true">↺</span>
    <span class="ci-replay__label">{{ label }}</span>
  </KeyCap>
</template>
