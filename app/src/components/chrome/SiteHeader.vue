<script setup lang="ts">
import { onMounted, onUnmounted, ref, useId, watch } from 'vue'
import SiteMenuToggle from '@/components/chrome/SiteMenuToggle.vue'
import SiteNavigation from '@/components/chrome/SiteNavigation.vue'
import BaseContainer from '@/components/ui/BaseContainer.vue'
import { useScrollLock } from '@/composables/useScrollLock'
import { siteContent } from '@/contents'

const navigationId = `navigation-${useId()}`
const header = ref<HTMLElement | null>(null)
const menuToggle = ref<InstanceType<typeof SiteMenuToggle> | null>(null)
const isMenuOpen = ref(false)
const { lock, unlock } = useScrollLock()

const toggleMenu = (isOpen: boolean) => {
  isMenuOpen.value = isOpen
}
const closeMenu = () => {
  isMenuOpen.value = false
  menuToggle.value?.focus()
}
const closeOnFocusLeave = (event: FocusEvent) => {
  if (event.relatedTarget instanceof Node && !header.value?.contains(event.relatedTarget)) {
    isMenuOpen.value = false
  }
}
const closeOnEscape = (event: KeyboardEvent) => {
  if (isMenuOpen.value && event.key === 'Escape') {
    event.preventDefault()
    closeMenu()
  }
}

watch(isMenuOpen, (isOpen) => (isOpen ? lock() : unlock()))
onMounted(() => document.addEventListener('keydown', closeOnEscape))
onUnmounted(() => {
  unlock()
  document.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
  <header ref="header" class="site-header" @focusout="closeOnFocusLeave">
    <BaseContainer class="site-header__bar">
      <a
        class="site-header__identity"
        :href="siteContent.links.home"
        :aria-label="`${siteContent.brand.fullName}, home`"
      >
        <img class="site-header__logo" src="/favicon.svg" alt="" width="28" height="28" />
        <span class="site-header__name">{{ siteContent.brand.fullName }}</span>
      </a>
      <SiteMenuToggle
        ref="menuToggle"
        :is-open="isMenuOpen"
        :controls="navigationId"
        @toggle="toggleMenu"
      />
    </BaseContainer>
    <SiteNavigation :id="navigationId" :is-open="isMenuOpen" @close="closeMenu" />
  </header>
</template>
