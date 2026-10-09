import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** Whether any of an element is on screen; true where IntersectionObserver is missing. */
export function useInView(target: Ref<Element | null>) {
  const inView = ref(false)
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined' || !target.value) {
      inView.value = true
      return
    }
    observer = new IntersectionObserver(([entry]) => {
      inView.value = entry?.isIntersecting ?? false
    })
    observer.observe(target.value)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return inView
}
