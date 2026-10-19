<script setup lang="ts">
import { computed, ref } from 'vue'
import CvPrinter from '@/components/sections/CvPrinter.vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import TearTabs from '@/components/ui/TearTabs.vue'
import WallSection from '@/components/ui/WallSection.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useScrollDrift } from '@/composables/useScrollDrift'
import type { HomeContent, SocialProfiles } from '@/contents'

defineProps<{
  content: HomeContent['contact']
  profiles: SocialProfiles
  copied: string
  name: string
  companies: HomeContent['commerce']['companies']
}>()

const board = ref<HTMLElement | null>(null)
const wide = useMediaQuery('(min-width: 48rem)')
const sheet = ref<InstanceType<typeof PastedSheet> | null>(null)
useScrollDrift(
  computed(() => sheet.value?.$el ?? null),
  { rate: 0.08, from: 'view', measure: board },
)
</script>

<template>
  <WallSection v-slot="{ titleId }" :id="content.id" class="contact">
    <div ref="board" class="contact__board">
      <PastedSheet
        ref="sheet"
        near
        class="contact__sheet"
        seed="contact"
        stock="white"
        :tape="['top']"
        :tilt="-1"
      >
        <div class="contact__body">
          <p class="c-kicker">
            <span>{{ content.label }}</span>
          </p>
          <h2 :id="titleId" class="contact__title">
            <template v-for="(line, i) in content.headline" :key="i">
              <span class="contact__title-line">{{ line }}</span
              >{{ ' ' }}
            </template>
          </h2>
          <p class="contact__lead">{{ content.description }}</p>
          <ul class="contact__links" role="list">
            <li v-for="(profile, platform) in profiles" :key="platform">
              <a
                class="contact__link"
                :href="profile.href"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ profile.label }}
              </a>
            </li>
          </ul>
        </div>
        <template #foot>
          <TearTabs
            class="contact__tabs"
            seed="contact"
            :email="content.email"
            :count="wide ? 11 : 6"
            :gone="wide ? [3, 7] : [2]"
            :copied="copied"
          />
        </template>
      </PastedSheet>

      <p class="contact__hint" aria-hidden="true">{{ content.hint }}</p>

      <CvPrinter
        class="contact__printer"
        :printer="content.printer"
        :name="name"
        :email="content.email"
        :companies="companies"
      />
    </div>
  </WallSection>
</template>
