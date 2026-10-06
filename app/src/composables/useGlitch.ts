import { onScopeDispose, ref } from 'vue'

/** Animation classes from `styles/components/_glitch.scss`. */
export type GlitchAnimation = 'c-glitch-digital' | 'c-glitch-matrix'

interface UseGlitchOptions {
  animation?: GlitchAnimation
  duration?: number
}

export function useGlitch(options: UseGlitchOptions = {}) {
  const { animation = 'c-glitch-digital', duration = 400 } = options

  const isGlitching = ref(false)
  let timeout: ReturnType<typeof setTimeout> | undefined

  const trigger = () => {
    if (timeout !== undefined) {
      return
    }

    isGlitching.value = true
    timeout = setTimeout(() => {
      isGlitching.value = false
      timeout = undefined
    }, duration)
  }

  onScopeDispose(() => {
    if (timeout !== undefined) {
      clearTimeout(timeout)
      timeout = undefined
    }
    isGlitching.value = false
  })

  return {
    isGlitching,
    trigger,
    glitchClass: animation,
  }
}
