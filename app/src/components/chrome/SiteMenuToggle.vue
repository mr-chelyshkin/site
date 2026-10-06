<script setup lang="ts">
import { ref } from 'vue'
import { siteContent } from '@/contents'

const props = defineProps<{
  isOpen: boolean
  /** Id of the navigation this button opens. */
  controls: string
}>()
const emit = defineEmits<{ toggle: [isOpen: boolean] }>()

const button = ref<HTMLButtonElement | null>(null)

const focus = () => button.value?.focus()
const toggle = () => {
  focus()
  emit('toggle', !props.isOpen)
}

defineExpose({ focus })
</script>

<template>
  <button
    ref="button"
    type="button"
    class="site-menu-toggle"
    :class="{ 'site-menu-toggle--open': isOpen }"
    :aria-label="
      isOpen ? siteContent.accessibility.closeNavigation : siteContent.accessibility.openNavigation
    "
    :aria-expanded="isOpen"
    :aria-controls="controls"
    @click="toggle"
  >
    <span class="site-menu-toggle__line site-menu-toggle__line--top" />
    <span class="site-menu-toggle__line site-menu-toggle__line--middle" />
    <span class="site-menu-toggle__line site-menu-toggle__line--bottom" />
  </button>
</template>
