<script setup lang="ts">
import ExternalLinkList from '@/components/ui/ExternalLinkList.vue'
import PosterSection from '@/components/ui/PosterSection.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import type { HomeContent, SocialProfiles } from '@/contents'

// Outside the numbered index: no rail, no number, its own surface. The page
// stops describing work here and asks for a reply instead.
defineProps<{
  content: HomeContent['contact']
  profiles: SocialProfiles
}>()
</script>

<template>
  <PosterSection v-slot="{ titleId }" class="contact" :label="content.label">
    <div class="o-poster__split u-reveal__item">
      <SectionHeading :id="titleId" :lines="content.headline" />
      <p class="o-poster__aside contact__lead">{{ content.description }}</p>
    </div>

    <div class="contact__reply u-reveal__item">
      <a class="contact__email" :href="content.email.href">
        {{ content.email.label }}
      </a>

      <ExternalLinkList :links="Object.values(profiles)" />
    </div>
  </PosterSection>
</template>
