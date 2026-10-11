import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { clamp01 } from '@/utils/math'

interface UseScrollProgressOptions {
  start?: number
  span?: number
  anchor?: number
}

export function useScrollProgress(
  target: Ref<Element | null>,
  options: UseScrollProgressOptions = {},
) {
  const { start = 0.9, span = 0.7, anchor = 0 } = options
  const progress = ref(0)
  const reduced = useReducedMotion()
  let frame = 0
  let observer: ResizeObserver | undefined

  const measure = () => {
    frame = 0
    const viewport = document.documentElement.clientHeight
    if (!target.value || viewport <= 0) return
    const rect = target.value.getBoundingClientRect()
    const point = rect.top + rect.height * anchor
    progress.value = clamp01((viewport * start - point) / (viewport * span))
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(measure)
  }

  const unfollow = () => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    observer?.disconnect()
    observer = undefined
    cancelAnimationFrame(frame)
    frame = 0
  }
  const follow = () => {
    unfollow()
    if (reduced.value) {
      progress.value = 1
      return
    }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    if (target.value) {
      observer = new ResizeObserver(schedule)
      observer.observe(target.value)
    }
  }

  watch(reduced, follow)
  onMounted(follow)
  onBeforeUnmount(unfollow)

  return progress
}
