<script setup lang="ts">
import { siteContent } from '@/contents'
</script>

<template>
  <header class="site-header o-wall">
    <a class="site-header__identity" :href="siteContent.links.home">
      <b class="site-header__name">{{ siteContent.brand.fullName }}</b>
      {{ ' ' }}
      <span class="site-header__role">{{ siteContent.brand.role }}</span>
    </a>
    <nav class="site-header__nav" aria-label="Sections">
      <a
        v-for="item in siteContent.navigation"
        :key="item.href"
        class="site-header__link"
        :href="item.href"
        >{{ item.label }}</a
      >
    </nav>
  </header>
</template>
