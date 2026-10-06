<script setup lang="ts">
import BaseLink from '@/components/ui/BaseLink.vue'
import SocialLinks from '@/components/ui/SocialLinks.vue'
import { siteContent } from '@/contents'

defineProps<{
  id: string
  isOpen: boolean
}>()
const emit = defineEmits<{ close: [] }>()

const close = () => emit('close')
</script>

<template>
  <div v-if="isOpen" class="site-navigation__scrim" @click="close" />
  <nav
    :id="id"
    class="site-navigation"
    :class="{ 'site-navigation--open': isOpen }"
    :inert="!isOpen"
  >
    <div class="site-navigation__content">
      <ul class="site-navigation__list">
        <li class="site-navigation__item">
          <BaseLink :to="siteContent.links.home" @click="close">
            {{ siteContent.actions.home }}
          </BaseLink>
        </li>
      </ul>
      <SocialLinks
        class="site-navigation__socials"
        :profiles="siteContent.socialProfiles"
        @click="close"
      />
    </div>
  </nav>
</template>
