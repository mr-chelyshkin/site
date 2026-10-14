import type { Directive } from 'vue'
import { useReducedMotion } from '@/composables/useReducedMotion'

const REACH = 80
const SPRING = 2 * Math.PI * 1.3

interface Magnet {
  x: number
  y: number
  vx: number
  vy: number
  tx: number
  ty: number
}

const magnets = new Map<HTMLElement, Magnet>()
let pointer: { x: number; y: number } | null = null
let listeners: AbortController | undefined
let frame = 0
let last = 0

const aim = (magnet: Magnet, el: HTMLElement) => {
  magnet.tx = 0
  magnet.ty = 0
  if (!pointer || useReducedMotion().value) return
  const box = el.getBoundingClientRect()
  const left = box.left - magnet.x
  const top = box.top - magnet.y
  const gap = Math.hypot(
    Math.max(left - pointer.x, 0, pointer.x - left - box.width),
    Math.max(top - pointer.y, 0, pointer.y - top - box.height),
  )
  if (gap >= REACH) return
  const pull = (1 - gap / REACH) ** 2
  magnet.tx = (pointer.x - left - box.width / 2) * pull
  magnet.ty = (pointer.y - top - box.height / 2) * pull
}

const step = (now: number) => {
  const dt = Math.min(now - (last || now - 16), 32) / 1000
  last = now
  let moving = false
  magnets.forEach((magnet, el) => {
    magnet.vx += (SPRING ** 2 * (magnet.tx - magnet.x) - 2 * SPRING * magnet.vx) * dt
    magnet.vy += (SPRING ** 2 * (magnet.ty - magnet.y) - 2 * SPRING * magnet.vy) * dt
    magnet.x += magnet.vx * dt
    magnet.y += magnet.vy * dt
    const near = Math.hypot(magnet.tx - magnet.x, magnet.ty - magnet.y) < 0.05
    if (near && Math.hypot(magnet.vx, magnet.vy) < 0.5) {
      Object.assign(magnet, { x: magnet.tx, y: magnet.ty, vx: 0, vy: 0 })
    } else {
      moving = true
    }
    el.style.translate =
      magnet.x || magnet.y ? `${magnet.x.toFixed(2)}px ${magnet.y.toFixed(2)}px` : ''
  })
  frame = moving ? requestAnimationFrame(step) : 0
  if (!frame) last = 0
}

const update = () => {
  magnets.forEach(aim)
  if (!frame) frame = requestAnimationFrame(step)
}

const follow = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse') return
  pointer = { x: event.clientX, y: event.clientY }
  update()
}

const release = () => {
  pointer = null
  update()
}

/** Pulls the element toward a nearby mouse cursor and lets it settle back once the cursor leaves. */
export const vMagnet: Directive<HTMLElement> = {
  mounted(el) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    magnets.set(el, { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 })
    if (listeners) return
    listeners = new AbortController()
    const { signal } = listeners
    window.addEventListener('pointermove', follow, { passive: true, signal })
    window.addEventListener('scroll', update, { passive: true, signal })
    window.addEventListener('blur', release, { signal })
    document.documentElement.addEventListener('pointerleave', release, { signal })
  },
  beforeUnmount(el) {
    if (!magnets.delete(el)) return
    el.style.removeProperty('translate')
    if (magnets.size) return
    listeners?.abort()
    listeners = undefined
    cancelAnimationFrame(frame)
    frame = 0
    last = 0
    pointer = null
  },
}
