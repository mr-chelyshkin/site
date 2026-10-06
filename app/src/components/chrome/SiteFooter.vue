<script setup lang="ts">
import BaseContainer from '@/components/ui/BaseContainer.vue'
import SocialLinks from '@/components/ui/SocialLinks.vue'
import { siteContent } from '@/contents'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <BaseContainer class="site-footer__content">
      <div class="site-footer__identity">
        <p class="site-footer__name">{{ siteContent.brand.fullName }}</p>
        <p class="site-footer__copyright">&copy; {{ year }}</p>
      </div>
      <SocialLinks :profiles="siteContent.socialProfiles" />
    </BaseContainer>
  </footer>
</template>
