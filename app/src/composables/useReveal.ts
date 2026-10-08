import { onBeforeUnmount, onMounted, ref } from 'vue'

interface UseRevealOptions {
  /**
   * Kept at zero so a section taller than the viewport still reveals: a share
   * of such an element can never fit on screen, and the reveal would never run.
   */
  threshold?: number
  /** Holds the reveal back until the element's edge is clear of the fold. */
  rootMargin?: string
}

/** Reveals an element once, the first time it comes into view. */
export function useReveal(options: UseRevealOptions = {}) {
  const { threshold = 0, rootMargin = '0px' } = options

  const target = ref<HTMLElement | null>(null)
  const isRevealed = ref(false)

  let observer: IntersectionObserver | undefined

  onMounted(() => {
    // A reader who asked for less motion, or a browser without the observer,
    // gets the finished state with no reveal at all.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined' || !target.value) {
      isRevealed.value = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return

        observer?.disconnect()
        observer = undefined
        isRevealed.value = true
      },
      { threshold, rootMargin },
    )

    observer.observe(target.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  return { target, isRevealed }
}
