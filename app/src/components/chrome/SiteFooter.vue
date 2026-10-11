<script setup lang="ts">
import { siteContent } from '@/contents'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__tape">
      <div class="site-footer__row o-wall">
        <span>{{ siteContent.brand.fullName }}</span>
        {{ ' ' }}
        <span>{{ siteContent.brand.role }}</span>
        {{ ' ' }}
        <span>&copy; {{ year }}</span>
      </div>
    </div>
  </footer>
</template>
