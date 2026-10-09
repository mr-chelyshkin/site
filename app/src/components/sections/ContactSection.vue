<script setup lang="ts">
import PastedSheet from '@/components/ui/PastedSheet.vue'
import TearTabs from '@/components/ui/TearTabs.vue'
import WallSection from '@/components/ui/WallSection.vue'
import type { HomeContent, SocialProfiles } from '@/contents'

defineProps<{
  content: HomeContent['contact']
  profiles: SocialProfiles
  copied: string
}>()
</script>

<template>
  <WallSection v-slot="{ titleId }" :id="content.id" class="contact">
    <div class="contact__board">
      <PastedSheet class="contact__sheet" seed="contact" stock="white" :tape="['top']" :tilt="-1">
        <div class="contact__body">
          <p class="c-kicker">
            <span>{{ content.label }}</span>
          </p>
          <h2 :id="titleId" class="contact__title">
            <!-- The space keeps copied text and reader modes from running the lines together. -->
            <template v-for="(line, i) in content.headline" :key="i">
              <span class="contact__title-line">{{ line }}</span
              >{{ ' ' }}
            </template>
          </h2>
          <p class="contact__lead">{{ content.description }}</p>
          <!-- Where else to find me; the address is on the tabs. The role, because
               Safari drops list semantics under `list-style: none`. -->
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
            :email="content.email"
            :count="11"
            :gone="[3, 7]"
            :copied="copied"
          />
        </template>
      </PastedSheet>

      <p class="contact__hint" aria-hidden="true">{{ content.hint }}</p>

      <PastedSheet
        class="contact__booth"
        seed="booth"
        stock="white"
        :torn="['bottom']"
        :tape="['top']"
        :tilt="2.8"
        :order="1"
        aria-hidden="true"
      >
        <div class="contact__frames">
          <span v-for="n in 4" :key="n" class="contact__frame" :class="`contact__frame--${n}`" />
        </div>
      </PastedSheet>
    </div>
  </WallSection>
</template>
