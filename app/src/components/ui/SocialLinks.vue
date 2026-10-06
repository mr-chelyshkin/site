<script setup lang="ts">
import type { Component } from 'vue'
import IconGitHub from '@/components/icons/IconGitHub.vue'
import IconLinkedIn from '@/components/icons/IconLinkedIn.vue'
import BaseExternalLink from '@/components/ui/BaseExternalLink.vue'
import type { SocialPlatform, SocialProfiles } from '@/contents'

defineProps<{ profiles: SocialProfiles }>()
const emit = defineEmits<{ click: [event: MouseEvent] }>()

const icons: Record<SocialPlatform, Component> = {
  linkedin: IconLinkedIn,
  github: IconGitHub,
}
</script>

<template>
  <ul class="c-social-links" aria-label="Social profiles">
    <li v-for="(profile, platform) in profiles" :key="platform">
      <BaseExternalLink :href="profile.href" :label="profile.label" @click="emit('click', $event)">
        <template #icon><component :is="icons[platform]" /></template>
      </BaseExternalLink>
    </li>
  </ul>
</template>
