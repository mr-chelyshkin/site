<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CiScene from '@/components/sections/ci-platform/CiScene.vue'
import CiScenePanel from '@/components/sections/ci-platform/CiScenePanel.vue'
import KeyCap from '@/components/ui/KeyCap.vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import WallSection from '@/components/ui/WallSection.vue'
import { useClock } from '@/composables/useClock'
import { useInView } from '@/composables/useInView'
import { useMediaQuery } from '@/composables/useMediaQuery'
import type { CiPlatformContent } from '@/contents'

const props = defineProps<{
  content: CiPlatformContent['picture']
}>()

const stage = ref<HTMLElement | null>(null)
const inView = useInView(stage)
const clock = useClock(inView)
const wide = useMediaQuery('(min-width: 48rem)')
const selected = ref<string | null>(null)

const order = computed(() => [null, ...props.content.panel.parts.map(({ id }) => id)])
const pressed = ref<'previous' | 'next' | null>(null)
let release = 0
const step = (direction: 'previous' | 'next') => {
  const list = order.value
  const at = list.indexOf(selected.value)
  const shift = direction === 'next' ? 1 : -1
  selected.value = list[(at + shift + list.length) % list.length] ?? null
}
const press = (direction: 'previous' | 'next') => {
  step(direction)
  pressed.value = direction
  window.clearTimeout(release)
  release = window.setTimeout(() => (pressed.value = null), 140)
}
const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
const onKey = (event: KeyboardEvent) => {
  if (!inView.value || event.defaultPrevented || typing(event.target)) return
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  press(event.key === 'ArrowRight' ? 'next' : 'previous')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.clearTimeout(release)
})

const toggle = (id: string) => {
  selected.value = selected.value === id ? null : id
}
</script>

<template>
  <WallSection v-slot="{ titleId }" :id="content.id" class="ci-picture">
    <header class="ci-picture__head">
      <p class="c-kicker ci-picture__kicker">
        <span>{{ content.kicker }}</span>
      </p>
      <h2 :id="titleId" class="ci-picture__title">{{ content.title }}</h2>
      <p class="ci-picture__lede">{{ content.lede }}</p>
    </header>
    <div ref="stage" class="ci-picture__stage">
      <div v-if="wide" class="ci-picture__scheme">
        <div class="ci-picture__board">
          <PastedSheet
            class="ci-picture__sheet"
            seed="ci-picture"
            stock="grid"
            :torn="['bottom']"
            :tape="['top']"
            :tilt="-0.4"
            live
          >
            <div class="ci-picture__crop">
              <div class="ci-picture__body">
                <CiScene
                  :content="content.scene"
                  :parts="content.panel.parts"
                  :selected="selected"
                  :clock="clock"
                  @select="toggle"
                />
              </div>
            </div>
          </PastedSheet>
          <div class="ci-picture__keys">
            <KeyCap
              v-for="direction in ['previous', 'next'] as const"
              :key="direction"
              class="ci-picture__key"
              :class="[`ci-picture__key--${direction}`, { 'c-key--down': pressed === direction }]"
              :aria-label="content.panel[direction].label"
              @click="press(direction)"
            >
              <span class="ci-picture__key-icon" aria-hidden="true">{{
                direction === 'next' ? '→' : '←'
              }}</span>
              <span class="ci-picture__key-label" aria-hidden="true">{{
                content.panel[direction].key
              }}</span>
            </KeyCap>
          </div>
        </div>
      </div>
      <aside class="ci-picture__side">
        <div class="ci-frame">
          <CiScenePanel :content="content.panel" :selected="selected">
            <template #inset="{ id }">
              <CiScene
                :content="content.scene"
                :parts="content.panel.parts"
                :selected="null"
                :clock="clock"
                :zoom="id"
              />
            </template>
          </CiScenePanel>
        </div>
      </aside>
      <div class="ci-picture__parts" role="group" :aria-label="content.panel.pick">
        <button
          type="button"
          class="ci-picture__chip"
          :aria-pressed="selected === null"
          @click="selected = null"
        >
          {{ content.panel.back }}
        </button>
        <button
          v-for="item in content.panel.parts"
          :key="item.id"
          type="button"
          class="ci-picture__chip"
          :aria-pressed="selected === item.id"
          @click="selected = item.id"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
  </WallSection>
</template>
