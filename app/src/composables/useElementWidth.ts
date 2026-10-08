import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * The element's layout width in whole pixels — its border box, ignoring
 * transforms such as a tilted sheet — measured on mount and kept current. The
 * target must be rendered when the component mounts.
 */
export function useElementWidth(target: Ref<HTMLElement | null>) {
  const width = ref(0)
  let observer: ResizeObserver | undefined
  let frame = 0
  let next = 0

  const apply = () => {
    frame = 0
    width.value = next
  }

  onMounted(() => {
    if (!target.value) return
    // Measured before the first paint, so a wide layout never flashes narrow.
    width.value = target.value.offsetWidth
    observer = new ResizeObserver(() => {
      if (!target.value) return
      next = target.value.offsetWidth
      // Applied in the next frame: a layout class toggled at a width threshold then resizes
      // the element outside this delivery, which would otherwise raise "ResizeObserver loop
      // completed with undelivered notifications".
      if (!frame) frame = requestAnimationFrame(apply)
    })
    observer.observe(target.value, { box: 'border-box' })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    if (frame) cancelAnimationFrame(frame)
  })

  return width
}
