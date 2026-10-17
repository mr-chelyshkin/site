<script setup lang="ts">
import keycap from '@/assets/images/keycap.webp'
</script>

<template>
  <button type="button" class="c-key">
    <img class="c-key__cap" :src="keycap" alt="" width="240" height="255" />
    <span class="c-key__legend"><slot /></span>
  </button>
</template>
