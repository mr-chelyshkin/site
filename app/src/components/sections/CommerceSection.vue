<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import nailStart from '@/assets/images/cable-nail-a.webp'
import nailEnd from '@/assets/images/cable-nail-b.webp'
import AccessPass from '@/components/sections/AccessPass.vue'
import SprayText from '@/components/ui/SprayText.vue'
import WallSection from '@/components/ui/WallSection.vue'
import { usePassPhysics } from '@/composables/usePassPhysics'
import type { HomeContent } from '@/contents'
import { SHAPES, kindOf } from '@/utils/pass-kinds'

const props = defineProps<{
  content: HomeContent['commerce']
  email: string
}>()

const cable = ref<HTMLElement | null>(null)
const { live, revoked, restore } = usePassPhysics(cable)

const announcement = computed(
  () => `${props.content.revoked.headline.join(' ')}. ${props.content.revoked.note}`,
)

function rehang() {
  restore()
  void nextTick(() =>
    cable.value?.querySelector<HTMLElement>('.pass')?.focus({ preventScroll: true }),
  )
}

const nails = { '--nail-start': `url(${nailStart})`, '--nail-end': `url(${nailEnd})` }

const shown = ref(0)
const two = (n: number) => String(n).padStart(2, '0')
let frame = 0

const track = () => {
  frame = 0
  const list = cable.value
  if (!list) return
  const { left, width } = list.getBoundingClientRect()
  const middle = left + width / 2
  let gap = Infinity
  ;[...list.children].forEach((hook, i) => {
    const box = hook.getBoundingClientRect()
    const off = Math.abs(box.left + box.width / 2 - middle)
    if (off < gap) {
      gap = off
      shown.value = i
    }
  })
}
const onScroll = () => {
  if (!frame) frame = requestAnimationFrame(track)
}

onBeforeUnmount(() => cancelAnimationFrame(frame))

function centerFocusedPass(event: FocusEvent) {
  const list = event.currentTarget as HTMLElement
  const hook = (event.target as Element).closest('.commerce__hook')
  const scrolls = getComputedStyle(list).overflowX !== 'visible'
  if (!hook || !scrolls || list.scrollWidth <= list.clientWidth) return
  const c = list.getBoundingClientRect()
  const h = hook.getBoundingClientRect()
  list.scrollBy({ left: h.left + h.width / 2 - (c.left + c.width / 2) })
}
</script>

<template>
  <WallSection
    v-slot="{ titleId }"
    :id="content.id"
    :index="content.index"
    numeral-at="right"
    class="commerce"
  >
    <header class="commerce__head">
      <h2 :id="titleId" class="commerce__title">
        <SprayText :lines="content.headline" aria-hidden="true" />
        <span class="u-visually-hidden">{{ content.label }}</span>
      </h2>
      <p class="commerce__lede">{{ content.description }}</p>
    </header>

    <div class="commerce__board">
      <ul
        ref="cable"
        class="commerce__cable"
        :class="{ 'commerce__cable--live': live }"
        :style="nails"
        role="list"
        @focusin="centerFocusedPass"
        @scroll.passive="onScroll"
      >
        <li
          v-for="(company, i) in content.companies"
          :key="company.id"
          class="commerce__hook"
          :class="`commerce__hook--${SHAPES[kindOf(company.pass)].cord}`"
        >
          <svg class="commerce__wire" aria-hidden="true" focusable="false">
            <polyline class="commerce__line" />
            <path class="commerce__cord" />
            <path class="commerce__seam" />
          </svg>
          <span class="commerce__nail commerce__nail--start" aria-hidden="true" />
          <span class="commerce__nail commerce__nail--end" aria-hidden="true" />
          <span v-if="kindOf(company.pass) === 'reel'" class="commerce__reel" aria-hidden="true">
            <span class="commerce__reel-cap" />
          </span>
          <AccessPass :company="company" :index="i" />
        </li>
      </ul>
      <p class="commerce__count" aria-hidden="true">
        {{ two(shown + 1) }} / {{ two(content.companies.length) }}
      </p>

      <div v-if="revoked" class="commerce__revoked">
        <SprayText
          class="commerce__revoked-title"
          :lines="content.revoked.headline"
          aria-hidden="true"
        />
        <p class="commerce__revoked-note">
          <span class="u-visually-hidden">{{ content.revoked.headline.join(' ') }}. </span>
          {{ content.revoked.note }}
          <a class="commerce__cta" :href="`mailto:${email}`">{{ content.revoked.cta }}</a>
        </p>
        <button type="button" class="commerce__rehang" @click="rehang">
          {{ content.revoked.restore }}
        </button>
      </div>
      <p class="u-visually-hidden" role="status">{{ revoked ? announcement : '' }}</p>
    </div>
  </WallSection>
</template>
