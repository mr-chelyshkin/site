import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

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

    width.value = target.value.offsetWidth
    observer = new ResizeObserver(() => {
      if (!target.value) return
      next = target.value.offsetWidth
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
