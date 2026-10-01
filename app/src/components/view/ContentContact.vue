<script setup lang="ts">
import { useId } from 'vue'
import ExternalLinkList from '@/components/ui/ExternalLinkList.vue'
import SectionBand from '@/components/ui/SectionBand.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import { useReveal } from '@/composables/useReveal'
import type { ContentPage } from '@/contents'
import type { SocialProfiles } from '@/types/ui'

defineProps<{
  content: ContentPage['contact']
  profiles: SocialProfiles
}>()

const titleId = `contact-${useId()}`
const { target, isRevealed, isTuning } = useReveal()
</script>

<template>
  <!-- Outside the numbered index: no rail, no number, its own surface. The page
       stops describing work here and asks for a reply instead. -->
  <section
    ref="target"
    class="content-contact o-poster o-poster--open c-reveal"
    :class="{ 'c-reveal--shown': isRevealed, 'c-reveal--tuning': isTuning }"
    :aria-labelledby="titleId"
  >
    <SectionBand :label="content.label" />

    <div class="o-poster__sheet">
      <div class="o-poster__split c-reveal__item">
        <SectionHeading :id="titleId" :lines="content.headline" />
        <p class="o-poster__aside content-contact__lead">{{ content.description }}</p>
      </div>

      <div class="content-contact__reply c-reveal__item">
        <a class="content-contact__email" :href="content.email.href">
          {{ content.email.label }}
        </a>

        <ExternalLinkList :links="Object.values(profiles)" />
      </div>
    </div>
  </section>
</template>
