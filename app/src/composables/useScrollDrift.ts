import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Sets `--drift` on an element: how far, in pixels, what reads it should rise
 * as the page scrolls, `rate` of the scroll and no further than `limit` of it.
 * A layer that rises faster than the page reads as standing in front of it.
 * Measured at most once a frame; readers who prefer reduced motion get none.
 */
export function useScrollDrift(target: Ref<HTMLElement | null>, rate = 0.1, limit = 900) {
  let frame = 0
  const apply = () => {
    frame = 0
    target.value?.style.setProperty('--drift', `${(-Math.min(scrollY, limit) * rate).toFixed(1)}px`)
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(apply)
  }

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    apply()
    window.addEventListener('scroll', schedule, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', schedule)
    if (frame) cancelAnimationFrame(frame)
  })
}
