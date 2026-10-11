import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useReducedMotion } from '@/composables/useReducedMotion'

export function useClock(running: Readonly<Ref<boolean>>) {
  const time = ref(0)
  const reduced = useReducedMotion()
  let frame = 0
  let last: number | undefined

  const tick = (now: number) => {
    if (last !== undefined) time.value += Math.min(now - last, 50) / 1000
    last = now
    frame = requestAnimationFrame(tick)
  }
  const stop = () => {
    cancelAnimationFrame(frame)
    frame = 0
    last = undefined
  }
  const sync = () => {
    if (running.value && !reduced.value) {
      if (!frame) frame = requestAnimationFrame(tick)
    } else if (frame) {
      stop()
    }
  }

  watch([running, reduced], sync)
  onMounted(sync)
  onBeforeUnmount(stop)

  return time
}
