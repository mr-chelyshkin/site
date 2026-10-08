<script setup lang="ts">
import { ref } from 'vue'
import AccessPass from '@/components/sections/AccessPass.vue'
import SprayText from '@/components/ui/SprayText.vue'
import WallSection from '@/components/ui/WallSection.vue'
import { usePassPhysics } from '@/composables/usePassPhysics'
import type { HomeContent } from '@/contents'
import { SHAPES, kindOf } from '@/utils/pass-kinds'

defineProps<{
  content: HomeContent['commerce']
  holder: string
}>()

// The passes swing, stretch and twist under a hand, unless the reader asks for
// less motion; then the stylesheet hangs them still.
const cable = ref<HTMLElement | null>(null)
const live = usePassPhysics(cable)

// Chrome scrolls a focused element sideways only when none of it shows, and on
// a phone the next pass always peeks in, so the cable centers the pass that
// takes focus. Sideways only: scrolling the page to a partly visible pass is
// left to the browser, so a tap never moves the page. And only a cable that
// scrolls: on wider screens its overhanging ends count in `scrollWidth` too.
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

    <!-- The role, because Safari drops list semantics under `list-style: none`. -->
    <ul
      ref="cable"
      class="commerce__cable"
      :class="{ 'commerce__cable--live': live }"
      role="list"
      @focusin="centerFocusedPass"
    >
      <li
        v-for="(company, i) in content.companies"
        :key="company.name"
        class="commerce__hook"
        :class="`commerce__hook--${SHAPES[kindOf(company.pass)].cord}`"
      >
        <!-- The hook's stretch of cable and the pass's cord, drawn by script
             while the passes are live, and blank until then. The seam runs
             along the cord: a ribbon's stripe, a chain's highlights. -->
        <svg class="commerce__wire" aria-hidden="true" focusable="false">
          <polyline class="commerce__line" />
          <path class="commerce__cord" />
          <path class="commerce__seam" />
        </svg>
        <!-- A reel pass hangs from a retractable reel clipped to the ring. -->
        <span v-if="kindOf(company.pass) === 'reel'" class="commerce__reel" aria-hidden="true">
          <span class="commerce__reel-cap" />
        </span>
        <AccessPass :company="company" :index="i" :holder="holder" />
      </li>
    </ul>
  </WallSection>
</template>
