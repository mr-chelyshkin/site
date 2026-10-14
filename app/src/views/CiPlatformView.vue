<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import CiExhibit from '@/components/sections/ci-platform/CiExhibit.vue'
import CiFinale from '@/components/sections/ci-platform/CiFinale.vue'
import CiFinePrint from '@/components/sections/ci-platform/CiFinePrint.vue'
import CiGuide from '@/components/sections/ci-platform/CiGuide.vue'
import CiPicture from '@/components/sections/ci-platform/CiPicture.vue'
import CiSameBox from '@/components/sections/ci-platform/CiSameBox.vue'
import ProjectFlyer from '@/components/sections/ProjectFlyer.vue'
import SprayText from '@/components/ui/SprayText.vue'
import WallLabel from '@/components/ui/WallLabel.vue'
import { ciPlatformContent as content, siteContent } from '@/contents'
import { vMagnet } from '@/directives/magnet'
import '@/styles/ci-platform.scss'

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
          <p class="ci-hero__lede">{{ content.hero.lead }}</p>
        </div>
        <div class="ci-hero__demo">
          <CiSameBox :content="content.hero.demo" :replay-label="content.labels.replay" />
        </div>
      </div>
    </header>

    <CiExhibit :content="content.picture" :labels="content.labels" layout="stacked">
      <CiPicture
        :content="content.picture.scheme"
        :steps="content.picture.steps"
        :replay-label="content.labels.replay"
        :toc-label="content.labels.toc"
      />
    </CiExhibit>

    <CiGuide :content="content.guide" :labels="content.labels" />

    <div class="ci-part o-wall" aria-hidden="true">
      <SprayText :lines="[content.parts.epilogue]" />
    </div>
    <CiExhibit :content="content.finePrint" :labels="content.labels">
      <CiFinePrint :content="content.finePrint.sheet" />
    </CiExhibit>
    <CiExhibit :content="content.mine" :labels="content.labels" layout="stacked">
      <div class="ci-mine">
        <ProjectFlyer
          v-for="(project, i) in content.mine.projects"
          :key="project.name"
          :project="project"
          :order="i"
        />
      </div>
    </CiExhibit>

    <CiFinale :content="content.finale" :back="content.back" />
  </div>
</template>
