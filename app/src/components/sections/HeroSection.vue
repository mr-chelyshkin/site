<script setup lang="ts">
import DitherPhoto from '@/components/ui/DitherPhoto.vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import SprayText from '@/components/ui/SprayText.vue'
import TearTabs from '@/components/ui/TearTabs.vue'
import type { HomeContent } from '@/contents'

defineProps<{
  content: HomeContent['hero']
  email: string
  copied: string
}>()

// Where the cyan channel slips, in percent of the photo, kept off the face; the
// smear stretches row 1020 of the render across its band.
const bands = [
  { at: 9, height: 4.5, shift: -1.2 },
  { at: 64, height: 2.4, shift: 1.6 },
]
const smear = { at: 74, height: 6, row: 1020, shift: -4.2 }
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
      class="hero__notice"
      seed="hero-notice"
      stock="cyan"
      :tape="['top']"
      tape-kind="drawn"
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
          <!-- The space keeps copied text and reader modes from running the lines together. -->
          <template v-for="(line, i) in content.notice.headline" :key="i">
            <span class="hero__headline-line">{{ line }}</span
            >{{ ' ' }}
          </template>
        </p>
        <p class="hero__discipline">{{ content.notice.discipline }}</p>
        <!-- The role, because Safari drops list semantics under `list-style: none`. -->
        <ul class="hero__points" role="list">
          <li v-for="(point, i) in content.notice.points" :key="i" class="hero__point">
            {{ point }}
          </li>
        </ul>
        <p class="hero__note">{{ content.notice.note }}</p>
      </div>
      <template #foot>
        <TearTabs :email="email" :count="8" :gone="[2, 5]" :copied="copied" />
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
