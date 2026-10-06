<script setup lang="ts">
import ExternalLinkList from '@/components/ui/ExternalLinkList.vue'
import PosterSection from '@/components/ui/PosterSection.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import type { HomeContent } from '@/contents'
import { padIndex } from '@/utils/format'

defineProps<{ content: HomeContent['openSource'] }>()
</script>

<template>
  <PosterSection
    v-slot="{ titleId }"
    class="open-source"
    :index="content.index"
    :label="content.label"
  >
    <div class="o-poster__split u-reveal__item">
      <SectionHeading :id="titleId" :lines="content.headline" />
      <p class="o-poster__aside">{{ content.description }}</p>
    </div>

    <ul class="open-source__grid u-reveal__group">
      <li
        v-for="(project, index) in content.projects"
        :key="project.name"
        class="open-source__plate u-reveal__item"
      >
        <p class="open-source__plate-index" aria-hidden="true">{{ padIndex(index) }}</p>
        <h3 class="open-source__plate-name">{{ project.name }}</h3>
        <p class="open-source__plate-summary">{{ project.summary }}</p>

        <dl class="open-source__specs">
          <template v-for="spec in project.specs" :key="spec.term">
            <dt class="open-source__spec-term">{{ spec.term }}</dt>
            <dd class="open-source__spec-value">{{ spec.value }}</dd>
          </template>
        </dl>

        <ExternalLinkList :links="project.links" :label-prefix="`${project.name} on`" />
      </li>
    </ul>
  </PosterSection>
</template>
