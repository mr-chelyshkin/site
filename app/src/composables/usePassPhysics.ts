import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { CORDS, SHAPES, kindOf } from '@/utils/pass-kinds'
import {
  STEP,
  brush,
  createPass,
  drawingOf,
  grab,
  isMoving,
  letGo,
  moveHand,
  poke,
  refit,
  rehang,
  settle,
  step,
  swipe,
  toCard,
  type Pass,
  type PassFit,
} from '@/utils/pass-physics'

interface Parts {
  hook: HTMLElement
  el: HTMLElement
  twist: HTMLElement
  body: HTMLElement
  line: SVGPolylineElement
  cord: SVGPathElement
  seam: SVGPathElement | null
}

interface Hung extends Parts {
  pass: Pass
  cablePoints: string
  cordPath: string
  seamPath: string
  torn: boolean
  gone: boolean
}

interface Track {
  x: number
  y: number
  time: number
  vx: number
  vy: number
  travel: number
}

interface Press {
  item: Hung
  id: number
  hand: boolean
  u: number
  v: number
  x0: number
  y0: number
  t0: number
  x: number
  y: number
  time: number
  moved: boolean
  holding: boolean
}

const POKE_MS = 350
const HOLD_MS = 380
const SLOP = { hand: 4, finger: 10 }

const tenths = (n: number) => (Math.round(n * 10) / 10 || 0).toFixed(1)

export function usePassPhysics(cable: Ref<HTMLElement | null>) {
  const live = ref(false)
  const revoked = ref(false)
  let items: Hung[] = []
  let passes: Pass[] = []
  let frame = 0
  let last = 0
  let pending = 0
  let press: Press | null = null
  let holdTimer = 0
  const tracks = new Map<number, Track>()
  let listening: AbortController | undefined
  let resize: ResizeObserver | undefined
  let resizeFrame = 0
  const reduced = useReducedMotion()

  function fitOf(parts: Parts, gap: number, scale: number): PassFit {
    const deg = parseFloat(getComputedStyle(parts.el).getPropertyValue('--tilt'))
    const tilt = Number.isFinite(deg) ? deg : 0
    const hookWidth = parts.hook.getBoundingClientRect().width
    const shape = SHAPES[kindOf(parts.el.dataset.kind)]
    return {
      width: parts.el.offsetWidth,
      height: parts.body.offsetHeight,
      hookWidth,
      gap,
      ringX: hookWidth / 2,
      slotY: parts.el.offsetTop + shape.slot,
      tilt: (tilt * scale * Math.PI) / 180,
      slot: shape.slot,
      tie: shape.tie,
      hookY: shape.hookY,
      cord: CORDS[shape.cord],
    }
  }

  function layout(root: HTMLElement) {
    const scale = parseFloat(
      getComputedStyle(root.querySelector('.pass') ?? root).getPropertyValue('--tilt-scale'),
    )
    return {
      gap: parseFloat(getComputedStyle(root).columnGap) || 0,
      scale: Number.isFinite(scale) ? scale : 1,
    }
  }

  function link() {
    items.forEach((item, i) => {
      const beside = (other: Hung | undefined) =>
        other && other.hook.offsetTop === item.hook.offsetTop ? other.pass : null
      item.pass.left = beside(items[i - 1])
      item.pass.right = beside(items[i + 1])
    })
  }

  function measure() {
    const root = cable.value
    if (!root) return
    const { gap, scale } = layout(root)
    for (const item of items) refit(item.pass, fitOf(item, gap, scale))
    link()
    if (!frame) passes.forEach(settle)
    items.forEach(draw)
  }

  function draw(item: Hung) {
    const { pass, hook, el, twist, body, line, cord, seam } = item
    const d = drawingOf(pass)
    el.style.transform = d.transform
    el.style.setProperty('--shadow-x', `${d.shadowX.toFixed(2)}px`)
    el.style.setProperty('--shadow-y', `${d.shadowY.toFixed(2)}px`)
    el.style.setProperty('--glint', `${tenths(d.glint)}%`)
    el.style.setProperty('--holo', `${tenths(d.holo)}deg`)
    twist.style.transform = d.twist
    body.style.setProperty('--shade', d.shade.toFixed(3))
    body.style.setProperty('--shade-side', String(d.shadeSide))
    hook.style.setProperty('--dip', `${d.dip.toFixed(2)}px`)
    hook.style.setProperty('--cord-scale', d.cordScale.toFixed(3))

    if (item.cablePoints !== d.cable) {
      item.cablePoints = d.cable
      line.setAttribute('points', d.cable)
    }
    if (item.cordPath !== d.cord) {
      item.cordPath = d.cord
      cord.setAttribute('d', d.cord)
    }
    if (seam && item.seamPath !== d.cord) {
      item.seamPath = d.cord
      seam.setAttribute('d', d.cord)
    }
    if (d.torn) el.style.opacity = d.opacity.toFixed(3)
    if (item.torn !== d.torn) {
      item.torn = d.torn
      el.toggleAttribute('data-torn', d.torn)
      if (!d.torn) el.style.removeProperty('opacity')
    }
    if (item.gone !== d.gone) {
      item.gone = d.gone
      el.toggleAttribute('data-gone', d.gone)
      el.tabIndex = d.gone ? -1 : 0
    }
  }

  function clear({ hook, el, twist, body, line, cord, seam }: Hung) {
    for (const name of [
      'transform',
      '--shadow-x',
      '--shadow-y',
      '--glint',
      '--holo',
      'opacity',
      'animation-delay',
    ]) {
      el.style.removeProperty(name)
    }
    delete el.dataset.held
    delete el.dataset.torn
    delete el.dataset.gone
    delete el.dataset.rehang
    el.tabIndex = 0
    twist.style.removeProperty('transform')
    body.style.removeProperty('--shade')
    body.style.removeProperty('--shade-side')
    hook.style.removeProperty('--dip')
    hook.style.removeProperty('--cord-scale')
    line.removeAttribute('points')
    cord.removeAttribute('d')
    seam?.removeAttribute('d')
  }

  function wake() {
    if (frame || !live.value) return
    last = 0
    frame = requestAnimationFrame(tick)
  }

  function tick(now: number) {
    frame = 0
    const elapsed = last ? now - last : 1000 / 60
    pending += Math.min(0.05, Math.max(0, elapsed / 1000))
    last = now
    if (press?.hand) {
      const at = local(press.item, press.x, press.y)
      moveHand(press.item.pass, at.x, at.y)
    }
    while (pending >= STEP) {
      step(passes)
      pending -= STEP
    }
    const moving = passes.some(isMoving)
    if (!moving) passes.forEach(settle)
    items.forEach(draw)
    revoked.value = passes.length > 0 && passes.every((pass) => pass.gone)
    if (moving) frame = requestAnimationFrame(tick)
  }

  function restore() {
    items.forEach((item, i) => {
      rehang(item.pass)
      item.el.style.animationDelay = `${i * 90}ms`
      item.el.dataset.rehang = ''
      item.el.addEventListener('animationend', () => delete item.el.dataset.rehang, { once: true })
    })
    revoked.value = false
    items.forEach(draw)
  }

  function track(e: PointerEvent) {
    let t = tracks.get(e.pointerId)
    if (!t) {
      t = { x: e.clientX, y: e.clientY, time: e.timeStamp, vx: 0, vy: 0, travel: 0 }
      tracks.set(e.pointerId, t)
      return t
    }
    const gap = e.timeStamp - t.time
    const dt = Math.max(4, gap) / 1000
    const dx = e.clientX - t.x
    const dy = e.clientY - t.y

    const keep = gap > 100 ? 0 : 0.5
    t.vx = keep * t.vx + (1 - keep) * (dx / dt)
    t.vy = keep * t.vy + (1 - keep) * (dy / dt)
    t.travel = Math.hypot(dx, dy)
    t.x = e.clientX
    t.y = e.clientY
    t.time = e.timeStamp
    return t
  }

  function itemOf(target: EventTarget | null) {
    const el = target instanceof Element ? target.closest('.pass') : null
    return items.find((item) => item.el === el)
  }

  function local(item: Hung, x: number, y: number) {
    const box = item.hook.getBoundingClientRect()
    return { x: x - box.left, y: y - box.top }
  }

  function release(item: Hung) {
    letGo(item.pass)
    delete item.el.dataset.held
  }

  function endPress(e: PointerEvent, poking: boolean) {
    if (!press) return
    const { item, hand, u, v, x0, y0, t0, x, y, time, moved } = press
    press = null
    clearTimeout(holdTimer)
    if (hand) {
      release(item)
      if (item.el.hasPointerCapture(e.pointerId)) item.el.releasePointerCapture(e.pointerId)
    }
    if (poking && !moved && e.timeStamp - t0 < POKE_MS) {
      poke(item.pass, u)
    } else if (!hand && moved) {
      const dt = Math.max(16, time - t0) / 1000
      swipe(item.pass, u, v, (x - x0) / dt, (y - y0) / dt)
    }
    wake()
  }

  function onPointerMove(e: PointerEvent) {
    if (press && e.pointerId === press.id) {
      if (press.hand && !(e.buttons & 1)) {
        endPress(e, false)
        return
      }
      if (press.hand) track(e)
      press.x = e.clientX
      press.y = e.clientY
      press.time = e.timeStamp
      press.moved ||=
        Math.hypot(press.x - press.x0, press.y - press.y0) > SLOP[press.hand ? 'hand' : 'finger']
      if (press.moved && !press.hand) clearTimeout(holdTimer)
      return
    }

    if (e.pointerType === 'touch') return
    const t = track(e)
    if (e.buttons) return
    const item = itemOf(e.target)
    if (!item) return
    const at = local(item, e.clientX, e.clientY)
    brush(item.pass, at.x, at.y, t.vx, t.vy, t.travel)
    wake()
  }

  function onPointerDown(e: PointerEvent) {
    if (press) return
    const item = itemOf(e.target)
    const hand = e.pointerType !== 'touch'
    if (!item || (hand && e.button !== 0)) return
    if (hand) track(e)
    const at = local(item, e.clientX, e.clientY)
    const { u, v } = toCard(item.pass, at.x, at.y)
    press = {
      item,
      id: e.pointerId,
      hand,
      u,
      v,
      x0: e.clientX,
      y0: e.clientY,
      t0: e.timeStamp,
      x: e.clientX,
      y: e.clientY,
      time: e.timeStamp,
      moved: false,
      holding: false,
    }
    if (!hand) {
      holdTimer = window.setTimeout(takeHold, HOLD_MS)
      return
    }
    e.preventDefault()
    item.el.setPointerCapture(e.pointerId)
    const focused = itemOf(document.activeElement)
    if (focused && focused !== item) focused.el.blur()
    grab(item.pass, at.x, at.y)
    item.el.dataset.held = ''
    wake()
  }

  function takeHold() {
    holdTimer = 0
    if (!press || press.hand || press.moved) return
    press.hand = true
    press.holding = true
    const at = local(press.item, press.x, press.y)
    grab(press.item.pass, at.x, at.y)
    press.item.el.dataset.held = ''
    navigator.vibrate?.(8)
    wake()
  }

  function blockScroll(e: TouchEvent) {
    if (press?.holding) e.preventDefault()
  }

  function onPointerEnd(e: PointerEvent) {
    if (press?.id === e.pointerId) endPress(e, e.type === 'pointerup')
  }

  function onLostCapture(e: PointerEvent) {
    if (press?.hand && press.id === e.pointerId) endPress(e, false)
  }

  function takeFocusedInHand(e: Event) {
    const item = itemOf(e.target)
    if (!item || item.pass.inHand || !item.el.matches(':focus-visible')) return
    item.pass.inHand = true
    wake()
  }

  function onFocusOut(e: FocusEvent) {
    const item = itemOf(e.target)
    if (!item?.pass.inHand) return
    item.pass.inHand = false
    wake()
  }

  function start() {
    const root = cable.value
    if (!root || live.value) return
    const { gap, scale } = layout(root)
    items = []
    for (const hook of root.querySelectorAll<HTMLElement>('.commerce__hook')) {
      const el = hook.querySelector<HTMLElement>('.pass')
      const twist = hook.querySelector<HTMLElement>('.pass__twist')
      const body = hook.querySelector<HTMLElement>('.pass__body')
      const line = hook.querySelector<SVGPolylineElement>('.commerce__line')
      const cord = hook.querySelector<SVGPathElement>('.commerce__cord')
      const seam = hook.querySelector<SVGPathElement>('.commerce__seam')
      if (!el || !twist || !body || !line || !cord) {
        if (import.meta.env.DEV) console.warn('usePassPhysics skips a hook missing its parts', hook)
        continue
      }
      const parts = { hook, el, twist, body, line, cord, seam }
      items.push({
        ...parts,
        pass: createPass(fitOf(parts, gap, scale)),
        cablePoints: '',
        cordPath: '',
        seamPath: '',
        torn: false,
        gone: false,
      })
    }
    passes = items.map((item) => item.pass)
    link()
    items.forEach(draw)
    live.value = true
    const focused = itemOf(document.activeElement)
    if (focused?.el.matches(':focus-visible')) {
      focused.pass.inHand = true
      wake()
    }

    listening = new AbortController()
    const { signal } = listening
    root.addEventListener('pointermove', onPointerMove, { passive: true, signal })
    root.addEventListener('pointerdown', onPointerDown, { signal })
    root.addEventListener('pointerup', onPointerEnd, { signal })
    root.addEventListener('pointercancel', onPointerEnd, { signal })
    root.addEventListener('lostpointercapture', onLostCapture, { signal })
    root.addEventListener('touchmove', blockScroll, { passive: false, signal })
    root.addEventListener('focusin', takeFocusedInHand, { signal })
    root.addEventListener('keydown', takeFocusedInHand, { signal })
    root.addEventListener('focusout', onFocusOut, { signal })
    resize = new ResizeObserver(() => {
      if (resizeFrame) return
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0
        measure()
      })
    })
    resize.observe(root)
  }

  function stop() {
    listening?.abort()
    listening = undefined
    resize?.disconnect()
    resize = undefined
    cancelAnimationFrame(frame)
    cancelAnimationFrame(resizeFrame)
    frame = 0
    resizeFrame = 0
    clearTimeout(holdTimer)
    press = null
    tracks.clear()
    items.forEach(clear)
    items = []
    passes = []
    live.value = false
    revoked.value = false
  }

  watch(reduced, (still) => (still ? stop() : start()))

  onMounted(() => {
    if (!reduced.value) start()
  })

  onBeforeUnmount(stop)

  return { live, revoked, restore }
}
