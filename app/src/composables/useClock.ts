import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

/**
 * Seconds of animation time, ticking once a frame while `running` holds and
 * standing still while it doesn't, so an animation picks up where it paused.
 * A long gap between frames, as after a hidden tab, counts as one short frame.
 * Readers who prefer reduced motion get a clock that never starts.
 */
export function useClock(running: Ref<boolean>) {
  const time = ref(0)
  let still = true
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
    if (running.value && !still) {
      if (!frame) frame = requestAnimationFrame(tick)
    } else if (frame) {
      stop()
    }
  }

  watch(running, sync)
  onMounted(() => {
    still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    sync()
  })
  onBeforeUnmount(stop)

  return time
}
