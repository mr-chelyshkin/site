<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import CiFaq from '@/components/sections/ci-platform/CiFaq.vue'
import CiGuide from '@/components/sections/ci-platform/CiGuide.vue'
import CiHeroSketch from '@/components/sections/ci-platform/CiHeroSketch.vue'
import CiBends from '@/components/sections/ci-platform/CiBends.vue'
import CiBigPicture from '@/components/sections/ci-platform/CiBigPicture.vue'
import CiDivider from '@/components/sections/ci-platform/CiDivider.vue'
import CiIdeas from '@/components/sections/ci-platform/CiIdeas.vue'
import SprayText from '@/components/ui/SprayText.vue'
import WallLabel from '@/components/ui/WallLabel.vue'
import { ciPlatformContent as content, siteContent } from '@/contents'
import { vMagnet } from '@/directives/magnet'
import '@/styles/ci-platform.scss'

const project = siteContent.home.openSource.projects.find(({ name }) => name === content.title)

let previousTitle = ''

onMounted(() => {
  previousTitle = document.title
  document.title = `${content.title} | ${siteContent.brand.fullName}`
})

onBeforeUnmount(() => {
  document.title = previousTitle
})
</script>

<template>
  <div class="ci-platform">
    <header class="ci-hero o-wall">
      <a v-magnet class="ci-hero__back" :href="content.back.href" :aria-label="content.back.label">
        <WallLabel :text="`← ${content.back.label}`" :tilt="-3" />
      </a>
      <div class="ci-hero__grid">
        <div class="ci-hero__intro">
          <p class="c-kicker ci-hero__kicker">
            <span>{{ content.hero.kicker }}</span>
          </p>
          <h1 class="ci-hero__title">
            <SprayText :lines="content.hero.headline" aria-hidden="true" />
            <span class="u-visually-hidden">{{ content.title }}</span>
          </h1>
          <p class="ci-hero__statement">
            <template v-for="(line, i) in content.hero.statement" :key="i">
              <span class="ci-hero__statement-line">{{ line }}</span
              >{{ ' ' }}
            </template>
          </p>
          <p class="ci-hero__jump">
            <a
              v-for="link in content.hero.jump"
              :key="link.href"
              class="ci-hero__jump-link"
              :href="link.href"
            >
              <span aria-hidden="true">↓</span> {{ link.label }}
            </a>
          </p>
        </div>
        <div v-if="project?.sketch" class="ci-hero__demo">
          <CiHeroSketch :sketch="project.sketch" :replay-label="content.labels.replay" />
        </div>
      </div>
    </header>

    <CiIdeas :content="content.ideas" />

    <CiBigPicture :content="content.picture" />

    <CiBends :content="content.bends" />

    <CiDivider :text="content.divider.text" />

    <CiGuide :content="content.guide" :labels="content.labels" />

    <CiFaq :content="content.faq" />

    <div class="ci-back o-wall">
      <a v-magnet class="ci-back__link" :href="content.back.href" :aria-label="content.back.label">
        <WallLabel :text="`← ${content.back.label}`" :tilt="2" />
      </a>
    </div>
  </div>
</template>
