<script setup lang="ts">
import ProjectFlyer from '@/components/sections/ProjectFlyer.vue'
import SprayText from '@/components/ui/SprayText.vue'
import WallLabel from '@/components/ui/WallLabel.vue'
import WallSection from '@/components/ui/WallSection.vue'
import type { HomeContent } from '@/contents'

defineProps<{ content: HomeContent['openSource'] }>()
</script>

<template>
  <WallSection v-slot="{ titleId }" :id="content.id" :index="content.index" class="open-source">
    <header class="open-source__head">
      <h2 :id="titleId" class="open-source__title">
        <SprayText :lines="content.headline" aria-hidden="true" />
        <span class="u-visually-hidden">{{ content.label }}</span>
      </h2>
      <p class="open-source__lede">{{ content.description }}</p>
    </header>

    <div class="open-source__board">
      <ProjectFlyer
        v-for="(project, i) in content.projects"
        :key="project.name"
        class="open-source__flyer"
        :project="project"
        :order="i"
      />
    </div>

    <div v-if="content.labels.length" class="open-source__labels">
      <WallLabel v-for="(label, i) in content.labels" :key="i" :text="label" :tilt="-3" />
    </div>
  </WallSection>
</template>
