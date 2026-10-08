import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
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
  settle,
  step,
  swipe,
  toCard,
  type Pass,
  type PassFit,
} from '@/utils/pass-physics'

/** The elements that draw one pass on the cable. */
interface Parts {
  hook: HTMLElement
  el: HTMLElement
  twist: HTMLElement
  body: HTMLElement
  line: SVGPolylineElement
  cord: SVGPathElement
  /** Drawn along the cord: a ribbon's stripe, a chain's highlights. */
  seam: SVGPathElement | null
}

interface Hung extends Parts {
  pass: Pass
  /** The cable's points and the cord's and seam's paths as last written. */
  cablePoints: string
  cordPath: string
  seamPath: string
}

/** Where a pointer was last, when, and how fast it went: px, ms, px/s. */
interface Track {
  x: number
  y: number
  time: number
  vx: number
  vy: number
  /** How far its last move went. */
  travel: number
}

/** A press on a pass: a mouse or pen holding it, or a finger that may poke or swipe. */
interface Press {
  item: Hung
  id: number
  hand: boolean
  /** The pressed point on the card. */
  u: number
  v: number
  x0: number
  y0: number
  t0: number
  /** The pointer now, in the window, and when it last moved. */
  x: number
  y: number
  time: number
  moved: boolean
}

// A press shorter than this that wanders less than its slop pokes the pass.
const POKE_MS = 350
const SLOP = { hand: 4, finger: 10 }

// One decimal place, never "-0.0": a value settling to zero from below would
// otherwise rewrite the inline style for no change, and read as not at rest.
const tenths = (n: number) => (Math.round(n * 10) / 10 || 0).toFixed(1)

/**
 * Lets the passes on a cable swing, stretch and twist under a pointer, a finger
 * or the keyboard, with `pass-physics` doing the motion. It collects the passes
 * from the markup of CommerceSection and AccessPass once, when it starts. Off
 * for a reader who asks for less motion, when the passes hang as the stylesheet
 * draws them; the returned `live` turns on the styles that hand the drawing over
 * to script. A pen pulls a pass as a mouse does, but on a touchscreen it pans
 * like a finger, so its pull ends when scrolling takes over.
 */
export function usePassPhysics(cable: Ref<HTMLElement | null>) {
  const live = ref(false)
  let items: Hung[] = []
  let passes: Pass[] = []
  let frame = 0
  let last = 0
  let pending = 0
  let press: Press | null = null
  const tracks = new Map<number, Track>()
  let listening: AbortController | undefined
  let resize: ResizeObserver | undefined
  let resizeFrame = 0
  let motion: MediaQueryList | undefined

  // Each pass at rest: `offset*` ignore transforms.
  function fitOf(parts: Parts, gap: number, scale: number): PassFit {
    const deg = parseFloat(getComputedStyle(parts.el).getPropertyValue('--tilt'))
    const tilt = Number.isFinite(deg) ? deg : 0
    // In fractions of a pixel, as the stylesheet places the ring and the cable.
    // Neither the hooks nor their ancestors are transformed, so the rect is the
    // hook's layout box.
    const hookWidth = parts.hook.getBoundingClientRect().width
    // The kind's hardware and cord, from the same table the stylesheet's
    // custom properties come from.
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
    // Phones keep less of each tilt. Read from a pass, through the same cascade
    // as its `rotate`, and kept even at 0.
    const scale = parseFloat(
      getComputedStyle(root.querySelector('.pass') ?? root).getPropertyValue('--tilt-scale'),
    )
    return {
      gap: parseFloat(getComputedStyle(root).columnGap) || 0,
      scale: Number.isFinite(scale) ? scale : 1,
    }
  }

  // Passes in one row of the grid share a stretch of cable.
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
    // Only when idle: a moving pass carries its motion over into the new fit.
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
    // Rewriting an attribute with its own value still costs a style recalc and
    // a layout, unlike an inline style, and a still pass is redrawn whenever
    // another one moves.
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
  }

  function clear({ hook, el, twist, body, line, cord, seam }: Hung) {
    for (const name of ['transform', '--shadow-x', '--shadow-y', '--glint', '--holo']) {
      el.style.removeProperty(name)
    }
    delete el.dataset.held
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
    // The next frame is the first after a wake; see `tick`.
    last = 0
    frame = requestAnimationFrame(tick)
  }

  function tick(now: number) {
    frame = 0
    // A frame's time is when it began, often before the wake that asked for it,
    // so the first frame after a wake counts as one at 60Hz. A stalled tab
    // catches up at most 50ms of motion in a frame.
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
    if (moving) frame = requestAnimationFrame(tick)
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
    // Smoothed over two moves; a pointer that paused starts afresh.
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

  // Ends the press: a hand lets go, a short press that ends in a pointerup
  // without wandering pokes the pass, and a finger that moved pushes it.
  function endPress(e: PointerEvent, poking: boolean) {
    if (!press) return
    const { item, hand, u, v, x0, y0, t0, x, y, time, moved } = press
    press = null
    if (hand) {
      release(item)
      // Chrome drops the capture once it sees the button up; a browser that
      // doesn't would keep sending this pointer's moves to the pass.
      if (item.el.hasPointerCapture(e.pointerId)) item.el.releasePointerCapture(e.pointerId)
    }
    if (poking && !moved && e.timeStamp - t0 < POKE_MS) {
      poke(item.pass, u)
    } else if (!hand && moved) {
      // A swipe, or the start of a scroll: the finger's speed where it landed.
      const dt = Math.max(16, time - t0) / 1000
      swipe(item.pass, u, v, (x - x0) / dt, (y - y0) / dt)
    }
    wake()
  }

  function onPointerMove(e: PointerEvent) {
    if (press && e.pointerId === press.id) {
      // A hand whose button is up has let go, even if its pointerup went
      // elsewhere, as to a context menu.
      if (press.hand && !(e.buttons & 1)) {
        endPress(e, false)
        return
      }
      // A hand stays tracked while it holds a pass, so its first brush after it
      // lets go measures one move, not the whole pull.
      if (press.hand) track(e)
      press.x = e.clientX
      press.y = e.clientY
      press.time = e.timeStamp
      press.moved ||=
        Math.hypot(press.x - press.x0, press.y - press.y0) > SLOP[press.hand ? 'hand' : 'finger']
      return
    }
    // A finger never hovers: only a mouse or a pen brushes, so only they are tracked.
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
    // One press at a time: a second pointer would strand the first one's pass.
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
    }
    // A finger keeps scrolling the page and the cable: no capture, nothing prevented.
    if (!hand) return
    // A hand takes hold: no text selection or image drag, and the pass follows
    // the pointer off its edge.
    e.preventDefault()
    item.el.setPointerCapture(e.pointerId)
    // The press moves no focus, so a pass the keyboard holds would stay lifted
    // while the hand pulls another: it lets go. Focusing the pressed pass
    // instead would center it on a phone's cable, under the hand.
    const focused = itemOf(document.activeElement)
    if (focused && focused !== item) focused.el.blur()
    grab(item.pass, at.x, at.y)
    item.el.dataset.held = ''
    wake()
  }

  function onPointerEnd(e: PointerEvent) {
    if (press?.id === e.pointerId) endPress(e, e.type === 'pointerup')
  }

  function onLostCapture(e: PointerEvent) {
    if (press?.hand && press.id === e.pointerId) endPress(e, false)
  }

  // The keyboard takes a pass in hand, as the stylesheet does without physics.
  // A pass focused by a tap turns focus-visible at the next key
  // press, with no new focusin, so a key press checks again.
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
      if (!el || !twist || !body || !line || !cord) continue
      const parts = { hook, el, twist, body, line, cord, seam }
      items.push({
        ...parts,
        pass: createPass(fitOf(parts, gap, scale)),
        cablePoints: '',
        cordPath: '',
        seamPath: '',
      })
    }
    passes = items.map((item) => item.pass)
    link()
    // Drawn at rest before the stylesheet hands over, so nothing moves.
    items.forEach(draw)
    live.value = true
    // A pass the keyboard already holds, as when the reader allows motion again,
    // rises from rest.
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
    root.addEventListener('focusin', takeFocusedInHand, { signal })
    root.addEventListener('keydown', takeFocusedInHand, { signal })
    root.addEventListener('focusout', onFocusOut, { signal })
    resize = new ResizeObserver(() => {
      // Next frame: measuring inside the delivery can raise a ResizeObserver
      // loop warning.
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
    press = null
    tracks.clear()
    items.forEach(clear)
    items = []
    passes = []
    live.value = false
  }

  const onMotionChange = () => (motion?.matches ? stop() : start())

  onMounted(() => {
    motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    motion.addEventListener('change', onMotionChange)
    if (!motion.matches) start()
  })

  onBeforeUnmount(() => {
    motion?.removeEventListener('change', onMotionChange)
    stop()
  })

  return live
}
