import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useReducedMotion } from '@/composables/useReducedMotion'

export function usePlayback(target: Ref<Element | null>, frames: number, frameMs: number) {
  const frame = ref(0)
  const reduced = useReducedMotion()
  let timer = 0
  let observer: IntersectionObserver | undefined

  const stop = () => {
    window.clearInterval(timer)
    timer = 0
  }

  const replay = () => {
    stop()
    if (reduced.value) {
      frame.value = frames
      return
    }
    frame.value = 0
    timer = window.setInterval(() => {
      frame.value += 1
      if (frame.value >= frames) stop()
    }, frameMs)
  }

  onMounted(() => {
    if (!target.value || typeof IntersectionObserver === 'undefined') {
      replay()
      return
    }
    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer?.disconnect()
        observer = undefined
        replay()
      },
      { threshold: 0.3 },
    )
    observer.observe(target.value)
  })

  watch(
    reduced,
    (still) => {
      if (!still) return
      stop()
      frame.value = frames
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    observer?.disconnect()
    stop()
  })

  return { frame, replay, reduced }
}
