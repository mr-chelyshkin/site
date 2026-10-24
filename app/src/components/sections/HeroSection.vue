<script setup lang="ts">
import { computed, ref } from 'vue'
import DitherPhoto from '@/components/ui/DitherPhoto.vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import SprayText from '@/components/ui/SprayText.vue'
import TearTabs from '@/components/ui/TearTabs.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useScrollDrift } from '@/composables/useScrollDrift'
import type { HomeContent } from '@/contents'

defineProps<{
  content: HomeContent['hero']
  email: string
  tabLabel: string
  copied: string
}>()

const bands = [
  { at: 9, height: 4.5, shift: -1.2 },
  { at: 64, height: 2.4, shift: 1.6 },
]
const smear = { at: 74, height: 6, row: 1020, shift: -4.2 }

const notice = ref<InstanceType<typeof PastedSheet> | null>(null)
const wide = useMediaQuery('(min-width: 48rem)')
useScrollDrift(
  computed(() => notice.value?.$el ?? null),
  { rate: 0.08 },
)
</script>

<template>
  <section class="hero o-wall" aria-labelledby="hero-title">
    <h1 id="hero-title" class="u-visually-hidden">{{ content.title }}</h1>

    <PastedSheet
      class="hero__poster"
      seed="hero-poster"
      stock="ink"
      :torn="['right', 'bottom']"
      :tape="['top-left', 'top-right']"
      tape-kind="real"
      :tilt="-1.6"
    >
      <DitherPhoto
        :image="content.image"
        :alt="content.imageAlt"
        :width="1680"
        :height="1379"
        :bands="bands"
        :smear="smear"
        priority
      />
    </PastedSheet>

    <SprayText class="hero__first" :lines="[content.firstName]" aria-hidden="true" />

    <PastedSheet
      ref="notice"
      near
      class="hero__notice"
      seed="hero-notice"
      stock="cyan"
      :tape="['top']"
      tape-kind="drawn"
      worn
      fold="none"
      :tilt="2.6"
    >
      <div class="hero__notice-body">
        <p class="c-kicker hero__kicker">
          <template v-for="(part, i) in content.notice.kicker" :key="i">
            <span>{{ part }}</span
            >{{ ' ' }}
          </template>
        </p>
        <p class="hero__headline">
          <template v-for="(line, i) in content.notice.headline" :key="i">
            <span class="hero__headline-line">{{ line }}</span
            >{{ ' ' }}
          </template>
        </p>
        <p class="hero__discipline">{{ content.notice.discipline }}</p>
        <ul class="hero__points" role="list">
          <li v-for="(point, i) in content.notice.points" :key="i" class="hero__point">
            {{ point }}
          </li>
        </ul>
        <p class="hero__note">{{ content.notice.note }}</p>
      </div>
      <template #foot>
        <TearTabs
          seed="hero-notice"
          :email="email"
          :label="tabLabel"
          :count="wide ? 8 : 5"
          :gone="wide ? [1, 2, 3, 5, 7] : [1, 3]"
          :copied="copied"
        />
      </template>
    </PastedSheet>

    <SprayText
      class="hero__last"
      :lines="[content.lastName]"
      face="display"
      tear
      aria-hidden="true"
    />
  </section>
</template>
