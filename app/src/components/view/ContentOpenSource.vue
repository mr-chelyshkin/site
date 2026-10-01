<script setup lang="ts">
import { useId } from 'vue'
import ExternalLinkList from '@/components/ui/ExternalLinkList.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SectionRail from '@/components/ui/SectionRail.vue'
import { useReveal } from '@/composables/useReveal'
import { padIndex } from '@/utils/format'
import type { ContentPage } from '@/contents'

defineProps<{ content: ContentPage['openSource'] }>()

const titleId = `open-source-${useId()}`
const { target, isRevealed, isTuning } = useReveal()
</script>

<template>
  <section
    ref="target"
    class="content-open-source o-poster c-reveal"
    :class="{ 'c-reveal--shown': isRevealed, 'c-reveal--tuning': isTuning }"
    :aria-labelledby="titleId"
  >
    <div class="o-poster__sheet">
      <div class="o-poster__split c-reveal__item">
        <SectionHeading :id="titleId" :lines="content.headline" />
        <p class="o-poster__aside">{{ content.description }}</p>
      </div>

      <ul class="content-open-source__grid c-reveal__group">
        <li
          v-for="(project, index) in content.projects"
          :key="project.name"
          class="content-open-source__plate c-reveal__item"
        >
          <p class="content-open-source__plate-index" aria-hidden="true">{{ padIndex(index) }}</p>
          <h3 class="content-open-source__plate-name">{{ project.name }}</h3>
          <p class="content-open-source__plate-summary">{{ project.summary }}</p>

          <dl class="content-open-source__specs">
            <template v-for="spec in project.specs" :key="spec.term">
              <dt class="content-open-source__spec-term">{{ spec.term }}</dt>
              <dd class="content-open-source__spec-value">{{ spec.value }}</dd>
            </template>
          </dl>

          <ExternalLinkList :links="project.links" :label-prefix="`${project.name} on`" />
        </li>
      </ul>
    </div>

    <SectionRail :index="content.index" :label="content.label" />
  </section>
</template>
