<script setup lang="ts">
defineProps<{ label: string }>()
defineEmits<{ replay: [] }>()
</script>

<template>
  <button type="button" class="ci-replay" @click="$emit('replay')">
    <span aria-hidden="true">↺</span> {{ label }}
  </button>
</template>
