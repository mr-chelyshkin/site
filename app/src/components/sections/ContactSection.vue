<script setup lang="ts">
import { computed } from 'vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import TearTabs from '@/components/ui/TearTabs.vue'
import WallLabel from '@/components/ui/WallLabel.vue'
import WallSection from '@/components/ui/WallSection.vue'
import type { HomeContent, SocialProfiles } from '@/contents'
import { foldAddress } from '@/utils/email'

const props = defineProps<{
  content: HomeContent['contact']
  profiles: SocialProfiles
  copied: string
}>()

// A line that runs out folds the address after its "@" rather than inside a word.
const address = computed(() => foldAddress(props.content.email))
</script>

<template>
  <WallSection v-slot="{ titleId }" :id="content.id" class="contact">
    <div class="contact__board">
      <PastedSheet class="contact__sheet" seed="contact" stock="white" :tape="['top']" :tilt="-1">
        <div class="contact__body">
          <p class="c-kicker">
            <span>{{ content.label }}</span
            >{{ ' ' }}<span>{{ content.notice }}</span>
          </p>
          <h2 :id="titleId" class="contact__title">
            <!-- The space keeps copied text and reader modes from running the lines together. -->
            <template v-for="(line, i) in content.headline" :key="i">
              <span class="contact__title-line">{{ line }}</span
              >{{ ' ' }}
            </template>
          </h2>
          <p class="contact__lead">{{ content.description }}</p>
          <!-- Hidden, the break keeps the link's name whole: Chrome would add a space at it. -->
          <a class="contact__email" :href="`mailto:${content.email}`"
            >{{ address.first }}<wbr aria-hidden="true" />{{ address.rest }}</a
          >
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

      <div class="contact__labels">
        <WallLabel
          v-for="(profile, platform, i) in profiles"
          :key="platform"
          :text="profile.label"
          :href="profile.href"
          :tilt="i % 2 ? 3 : -4"
        />
      </div>
    </div>
  </WallSection>
</template>
