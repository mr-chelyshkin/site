import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useReducedMotion } from '@/composables/useReducedMotion'

export function useReveal(target: Ref<Element | null>, threshold = 0) {
  const isRevealed = ref(false)
  const reduced = useReducedMotion()

  let observer: IntersectionObserver | undefined

  const reveal = () => {
    observer?.disconnect()
    observer = undefined
    isRevealed.value = true
  }

  onMounted(() => {
    if (reduced.value || typeof IntersectionObserver === 'undefined' || !target.value) {
      reveal()
      return
    }
    observer = new IntersectionObserver(
      (entries) => {
        const seen = (entry: IntersectionObserverEntry) =>
          entry.isIntersecting && entry.intersectionRatio >= threshold
        if (entries.some(seen)) reveal()
      },
      { threshold },
    )
    observer.observe(target.value)
  })

  watch(reduced, (still) => {
    if (still) reveal()
  })

  onBeforeUnmount(() => observer?.disconnect())

  return isRevealed
}
