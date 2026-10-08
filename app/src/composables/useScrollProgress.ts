import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

interface UseScrollProgressOptions {
  /** Viewport fraction from the top where progress starts, once the followed point passes it. */
  start?: number
  /** Viewport fraction the followed point travels from 0 to 1. */
  span?: number
  /** The point followed, as a fraction of the element's height: 0 its top, 1 its bottom. */
  anchor?: number
}

/**
 * Progress from 0 to 1 of an element rising through the viewport, measured at
 * most once a frame: on scroll, on window resize, and when the element's own box
 * changes (for an SVG shape that is its size in user units, so a scaled drawing
 * relies on the resize listener), as when a layout switch moves the element
 * without a scroll. Readers who prefer reduced motion get 1 at once.
 */
export function useScrollProgress(
  target: Ref<Element | null>,
  options: UseScrollProgressOptions = {},
) {
  const { start = 0.9, span = 0.7, anchor = 0 } = options
  const progress = ref(0)
  let frame = 0
  let observer: ResizeObserver | undefined

  const measure = () => {
    frame = 0
    // The layout viewport, which holds still while a mobile browser's toolbar
    // slides away, unlike `innerHeight`. One with no height, such as a hidden
    // frame's, would make the ratio NaN.
    const viewport = document.documentElement.clientHeight
    if (!target.value || viewport <= 0) return
    const rect = target.value.getBoundingClientRect()
    const point = rect.top + rect.height * anchor
    progress.value = Math.min(1, Math.max(0, (viewport * start - point) / (viewport * span)))
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(measure)
  }

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    observer?.disconnect()
    if (frame) cancelAnimationFrame(frame)
  })

  return progress
}
