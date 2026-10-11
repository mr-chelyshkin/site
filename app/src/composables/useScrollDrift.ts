import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { useReducedMotion } from '@/composables/useReducedMotion'

interface UseScrollDriftOptions {
  rate?: number
  limit?: number
  from?: 'top' | 'view'
  measure?: Readonly<Ref<Element | null>>
}

export function useScrollDrift(
  target: Readonly<Ref<HTMLElement | null>>,
  options: UseScrollDriftOptions = {},
) {
  const { rate = 0.1, limit = 900, from = 'top', measure } = options
  const reduced = useReducedMotion()
  let frame = 0

  const apply = () => {
    frame = 0
    const box = measure?.value
    const scrolled =
      from === 'view' && box ? innerHeight / 5 - box.getBoundingClientRect().top : scrollY
    const drift = -Math.min(Math.max(scrolled, -limit), limit) * rate
    target.value?.style.setProperty('--drift', `${drift.toFixed(1)}px`)
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(apply)
  }

  const unfollow = () => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    cancelAnimationFrame(frame)
    frame = 0
  }
  const follow = () => {
    unfollow()
    if (reduced.value) {
      target.value?.style.removeProperty('--drift')
      return
    }
    apply()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
  }

  watch(reduced, follow)
  onMounted(follow)
  onBeforeUnmount(unfollow)
}
