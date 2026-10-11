const TUNING = {
  swingHz: 1.1,
  swingDamping: 0.1,
  cordDamping: 0.35,
  wobble: 0.8,
  cardHz: 2.8,
  cardDamping: 0.16,
  twistHz: 0.85,
  twistDamping: 0.07,
  push: 0.3,
  poke: 0.5,
  cableDip: 10,
  neighbors: 2,
} as const

export const STEP = 1 / 480

const TAU = Math.PI * 2
const PENDULUM = 295
const LIFT = 8
const CLEARANCE = 8
const STRETCH_MAX = 260
const STIFFEST = 4
const GRIP = 1200
const GRIP_DAMPING = 2 * 0.7 * Math.sqrt(GRIP)
const GRIP_REACH = 220
const BRUSH_LENGTH = 200
const BRUSH_VERTICAL = 0.35
const SWIPE_GAIN = 1.4
const SWIPE_VERTICAL = 0.15
const KICK_MAX = 900
const SWING_LIMIT = 1.35
const CARD_LIMIT = 0.7
const TWIST_LIMIT = 1
const BOW = 0.0009
const CABLE_HZ = 4.5
const CABLE_DAMPING = 0.2
const CABLE_COUPLING = 0.35
const SHADOW = 16
const TEAR_REACH = 150
const TEAR_HOLD = 0.1
const FADE = { after: 60, over: 420 }
const STUB_HZ = 2.2
const STUB_DAMPING = 0.12
const AIR = 0.6
const FALL_AIR = 9
const SPIN_AIR = 1.2

const G = (TAU * TUNING.swingHz) ** 2 * PENDULUM
const CARD_OMEGA = TAU * TUNING.cardHz
const TWIST_OMEGA = TAU * TUNING.twistHz
const CABLE_OMEGA = TAU * CABLE_HZ

export interface PassCord {
  readonly hz: number
  readonly stretch: number
  readonly thins: boolean
  readonly stub: number
}

export interface PassFit {
  width: number
  height: number
  hookWidth: number
  gap: number
  ringX: number
  slotY: number
  slot: number
  tie: number
  hookY: number
  cord: PassCord
  tilt: number
}

export interface Grip {
  u: number
  v: number
  x: number
  y: number
}

export interface Pass extends PassFit {
  theta: number
  omega: number
  r: number
  vr: number
  phi: number
  vphi: number
  psi: number
  vpsi: number
  dip: number
  vdip: number
  tension: number
  swingAccel: number
  dipAccel: number
  slackSide: -1 | 0 | 1
  grip: Grip | null
  inHand: boolean
  left: Pass | null
  right: Pass | null
  torn: boolean
  gone: boolean
  strain: number
  cx: number
  cy: number
  vx: number
  vy: number
  angle: number
  spin: number
  dropY: number | null
  stub: number
  vstub: number
}

export interface PassDrawing {
  transform: string
  shadowX: number
  shadowY: number
  twist: string
  shade: number
  shadeSide: number
  cord: string
  cordScale: number
  glint: number
  holo: number
  dip: number
  cable: string
  opacity: number
  torn: boolean
  gone: boolean
}

interface Frame {
  st: number
  ct: number
  angle: number
  sa: number
  ca: number
  x: number
  y: number
}

export function createPass(fit: PassFit): Pass {
  return {
    ...fit,
    theta: fit.tilt,
    omega: 0,
    r: fit.slotY - fit.hookY,
    vr: 0,
    phi: 0,
    vphi: 0,
    psi: 0,
    vpsi: 0,
    dip: 0,
    vdip: 0,
    tension: G,
    swingAccel: 0,
    dipAccel: 0,
    slackSide: 0,
    grip: null,
    inHand: false,
    left: null,
    right: null,
    torn: false,
    gone: false,
    strain: 0,
    cx: 0,
    cy: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    spin: 0,
    dropY: null,
    stub: 0,
    vstub: 0,
  }
}

export function refit(pass: Pass, fit: PassFit) {
  pass.width = fit.width
  pass.height = fit.height
  pass.hookWidth = fit.hookWidth
  pass.gap = fit.gap
  pass.ringX = fit.ringX
  pass.slotY = fit.slotY
  pass.slot = fit.slot
  pass.tie = fit.tie
  pass.hookY = fit.hookY
  pass.cord = fit.cord
  pass.tilt = fit.tilt
}

function reachMin(p: Pass) {
  return p.tie + CLEARANCE
}

function restOf(p: Pass) {
  const inHand = p.inHand && !p.grip
  const r = Math.max(reachMin(p), p.slotY - p.hookY - (inHand ? LIFT : 0))
  return { theta: inHand ? 0 : p.tilt, r, inHand }
}

function springOf(p: Pass) {
  const omega = TAU * p.cord.hz
  const k = omega * omega
  return { omega, k, prestretch: G / k }
}

function swingMass(p: Pass) {
  const arm = Math.max(40, p.r + p.height / 2 - p.slot)
  return { arm, inertia: arm * arm + (p.height ** 2 + p.width ** 2) / 12 }
}

function cardInertia(p: Pass) {
  return (p.height ** 2 + p.width ** 2) / 12 + (p.height / 2 - p.slot) ** 2
}

function frameOf(p: Pass): Frame {
  const st = Math.sin(p.theta)
  const ct = Math.cos(p.theta)
  const angle = p.theta + p.phi
  return {
    st,
    ct,
    angle,
    sa: Math.sin(angle),
    ca: Math.cos(angle),
    x: p.ringX - p.r * st,
    y: p.dip + p.hookY + p.r * ct,
  }
}

function pointAt(f: Frame, u: number, v: number) {
  return { x: f.x + u * f.ca - v * f.sa, y: f.y + u * f.sa + v * f.ca }
}

function jacobian(p: Pass, f: Frame, u: number, v: number) {
  const phi = [-u * f.sa - v * f.ca, u * f.ca - v * f.sa] as const
  return {
    theta: [-p.r * f.ct + phi[0], -p.r * f.st + phi[1]] as const,
    r: [-f.st, f.ct] as const,
    phi,
  }
}

type Jacobian = ReturnType<typeof jacobian>

function velocityAt(p: Pass, j: Jacobian) {
  return {
    x: j.theta[0] * p.omega + j.r[0] * p.vr + j.phi[0] * p.vphi,
    y: j.theta[1] * p.omega + j.r[1] * p.vr + j.phi[1] * p.vphi,
  }
}

function cordOf(p: Pass, f: Frame) {
  const x0 = p.ringX
  const y0 = p.dip + p.hookY + 1.5
  const x1 = f.x + p.tie * f.sa
  const y1 = f.y - p.tie * f.ca
  const rest = Math.max(reachMin(p), p.slotY - p.hookY) - p.tie - 1.5
  return {
    x0,
    y0,
    x1,
    y1,
    length: Math.hypot(x1 - x0, y1 - y0) || 1,
    rest,
    natural: rest - springOf(p).prestretch,
  }
}

function slopeAt(p: Pass) {
  const span = 2 * (p.hookWidth + p.gap)
  if (!span) return 0
  return ((p.right?.dip ?? 0) - (p.left?.dip ?? 0)) / span
}

function advance(p: Pass) {
  const rest = restOf(p)
  const off = p.theta - rest.theta - TUNING.neighbors * slopeAt(p)
  const { arm, inertia } = swingMass(p)
  const stiffness = (G * arm) / inertia
  const damping = rest.inHand ? Math.max(TUNING.swingDamping, 0.6) : TUNING.swingDamping

  let swingAccel =
    -stiffness * Math.sin(off) -
    2 * damping * Math.sqrt(stiffness) * p.omega -
    (2 * p.vr * p.omega) / arm
  if (Math.abs(off) > SWING_LIMIT) {
    swingAccel -= 3000 * (off - Math.sign(off) * SWING_LIMIT) + 30 * p.omega
  }
  const freeSwingAccel = swingAccel

  const spring = springOf(p)
  const past = p.r - rest.r
  const extension = past + spring.prestretch
  let stretchAccel = G * Math.cos(off) + arm * p.omega ** 2
  p.tension = 0
  if (extension > 0) {
    const over = Math.min(STIFFEST, Math.max(0, past) / p.cord.stretch)
    p.tension = spring.k * (extension + Math.max(0, past) * over * over)
    stretchAccel -= p.tension + 2 * TUNING.cordDamping * spring.omega * p.vr
  } else {
    stretchAccel -= 0.8 * p.vr
  }

  let turnAccel =
    -(CARD_OMEGA ** 2) * Math.sin(p.phi) -
    2 * TUNING.cardDamping * CARD_OMEGA * p.vphi -
    TUNING.wobble * freeSwingAccel
  if (Math.abs(p.phi) > CARD_LIMIT) turnAccel -= 200 * (p.phi - Math.sign(p.phi) * CARD_LIMIT)

  let twistAccel =
    -(TWIST_OMEGA ** 2) * Math.sin(p.psi) - 2 * TUNING.twistDamping * TWIST_OMEGA * p.vpsi
  if (p.grip) twistAccel -= 10 * p.vpsi
  if (Math.abs(p.psi) > TWIST_LIMIT) {
    twistAccel -= 150 * (p.psi - Math.sign(p.psi) * TWIST_LIMIT)
  }

  if (p.grip) {
    const f = frameOf(p)
    const j = jacobian(p, f, p.grip.u, p.grip.v)
    const at = pointAt(f, p.grip.u, p.grip.v)
    const velocity = velocityAt(p, j)
    let dx = p.grip.x - at.x
    let dy = p.grip.y - at.y
    const distance = Math.hypot(dx, dy)
    if (distance > GRIP_REACH) {
      dx *= GRIP_REACH / distance
      dy *= GRIP_REACH / distance
    }
    const fx = GRIP * dx - GRIP_DAMPING * velocity.x
    const fy = GRIP * dy - GRIP_DAMPING * velocity.y
    swingAccel += (j.theta[0] * fx + j.theta[1] * fy) / inertia
    stretchAccel += j.r[0] * fx + j.r[1] * fy
    turnAccel += (j.phi[0] * fx + j.phi[1] * fy) / cardInertia(p)
    p.strain = distance > TEAR_REACH ? p.strain + STEP : Math.max(0, p.strain - 3 * STEP)
  } else {
    p.strain = 0
  }

  p.swingAccel = swingAccel
  p.omega += swingAccel * STEP
  p.theta += p.omega * STEP
  p.vr += stretchAccel * STEP
  p.r += p.vr * STEP
  if (p.r < reachMin(p)) {
    p.r = reachMin(p)
    if (p.vr < 0) p.vr *= -0.25
  }
  const longest = p.slotY - p.hookY + STRETCH_MAX
  if (p.r > longest) {
    p.r = longest
    if (p.vr > 0) p.vr = 0
  }
  p.vphi += turnAccel * STEP
  p.phi += p.vphi * STEP
  p.vpsi += twistAccel * STEP
  p.psi += p.vpsi * STEP

  const line = cordOf(p, frameOf(p))
  if (line.length >= line.natural) p.slackSide = 0
  else if (!p.slackSide) p.slackSide = p.omega < 0 ? -1 : 1

  if (p.strain > TEAR_HOLD) tear(p)
}

const middleOf = (p: Pass) => p.height / 2 - p.slot

function tear(p: Pass) {
  const f = frameOf(p)
  const d = middleOf(p)
  const at = pointAt(f, 0, d)
  const velocity = velocityAt(p, jacobian(p, f, 0, d))
  Object.assign(p, {
    torn: true,
    strain: 0,
    tension: 0,
    cx: at.x,
    cy: at.y,
    vx: velocity.x,
    vy: velocity.y,
    angle: f.angle,
    spin: p.omega + p.vphi,
    psi: 0,
    vpsi: 0,
    stub: 0,
    vstub: Math.max(-9, Math.min(9, velocity.x / 80)),
  })
  if (p.grip) {
    const { u, v } = toCard(p, p.grip.x, p.grip.y)
    p.grip.u = u
    p.grip.v = v
  }
}

function advanceFree(p: Pass) {
  const stubOmega = TAU * STUB_HZ
  p.vstub += (-(stubOmega ** 2) * Math.sin(p.stub) - 2 * STUB_DAMPING * stubOmega * p.vstub) * STEP
  p.stub += p.vstub * STEP
  if (p.gone) return

  const air = p.grip ? AIR : FALL_AIR
  let ax = -air * p.vx
  let ay = G - air * p.vy
  let spinAccel = -SPIN_AIR * p.spin
  if (p.grip) {
    const sa = Math.sin(p.angle)
    const ca = Math.cos(p.angle)
    const u = p.grip.u
    const v = p.grip.v - middleOf(p)
    const rx = u * ca - v * sa
    const ry = u * sa + v * ca
    let dx = p.grip.x - (p.cx + rx)
    let dy = p.grip.y - (p.cy + ry)
    const distance = Math.hypot(dx, dy)
    if (distance > GRIP_REACH) {
      dx *= GRIP_REACH / distance
      dy *= GRIP_REACH / distance
    }
    const fx = GRIP * dx - GRIP_DAMPING * (p.vx - p.spin * ry)
    const fy = GRIP * dy - GRIP_DAMPING * (p.vy + p.spin * rx)
    ax += fx
    ay += fy
    spinAccel += (rx * fy - ry * fx) / ((p.height ** 2 + p.width ** 2) / 12)
    p.dropY = null
  } else if (p.dropY === null) {
    p.dropY = p.cy
  }
  p.vx += ax * STEP
  p.vy += ay * STEP
  p.cx += p.vx * STEP
  p.cy += p.vy * STEP
  p.spin += spinAccel * STEP
  p.angle += p.spin * STEP
  if (p.dropY !== null && p.cy - p.dropY > FADE.after + FADE.over) p.gone = true
}

export function rehang(p: Pass) {
  Object.assign(p, {
    torn: false,
    gone: false,
    strain: 0,
    dropY: null,
    stub: 0,
    vstub: 0,
    grip: null,
  })
  settle(p)
}

export function step(passes: readonly Pass[]) {
  for (const p of passes) {
    if (p.torn) advanceFree(p)
    else advance(p)
  }

  for (const p of passes) {
    const load = p.torn ? 0 : (p.tension - G) * Math.cos(p.theta)
    const target = TUNING.cableDip * Math.tanh(load / (2.5 * G))
    const sag = (p.left?.dip ?? 0) + (p.right?.dip ?? 0) - 2 * p.dip
    p.dipAccel =
      CABLE_OMEGA ** 2 * (target - p.dip + CABLE_COUPLING * sag) -
      2 * CABLE_DAMPING * CABLE_OMEGA * p.vdip
  }
  for (const p of passes) {
    p.vdip += p.dipAccel * STEP
    p.dip += p.vdip * STEP
  }
}

export function isMoving(p: Pass) {
  if (p.grip) return true
  if (p.torn) {
    return (
      !p.gone ||
      Math.abs(p.stub) > 1e-3 ||
      Math.abs(p.vstub) > 1e-2 ||
      Math.abs(p.dip) > 0.03 ||
      Math.abs(p.vdip) > 0.1
    )
  }
  const rest = restOf(p)
  return (
    Math.abs(p.theta - rest.theta) > 2e-4 ||
    Math.abs(p.omega) > 2e-3 ||
    Math.abs(p.r - rest.r) > 0.05 ||
    Math.abs(p.vr) > 0.1 ||
    Math.abs(p.phi) > 2e-4 ||
    Math.abs(p.vphi) > 2e-3 ||
    Math.abs(p.psi) > 5e-3 ||
    Math.abs(p.vpsi) > 5e-3 ||
    Math.abs(p.dip) > 0.03 ||
    Math.abs(p.vdip) > 0.1
  )
}

export function settle(p: Pass) {
  if (p.torn) {
    Object.assign(p, { stub: 0, vstub: 0, dip: 0, vdip: 0, dipAccel: 0 })
    return
  }
  const rest = restOf(p)
  Object.assign(p, {
    theta: rest.theta,
    omega: 0,
    r: rest.r,
    vr: 0,
    phi: 0,
    vphi: 0,
    psi: 0,
    vpsi: 0,
    dip: 0,
    vdip: 0,
    tension: G,
    swingAccel: 0,
    dipAccel: 0,
    slackSide: 0,
  })
}

function freeFrame(p: Pass) {
  const sa = Math.sin(p.angle)
  const ca = Math.cos(p.angle)
  const d = middleOf(p)
  return { x: p.cx + d * sa, y: p.cy - d * ca, angle: p.angle, sa, ca }
}

export function toCard(p: Pass, x: number, y: number) {
  const f = p.torn ? freeFrame(p) : frameOf(p)
  const dx = x - f.x
  const dy = y - f.y
  const u = dx * f.ca + dy * f.sa
  const facing = Math.cos(p.psi)
  return { u: Math.abs(facing) > 0.3 ? u / facing : u, v: -dx * f.sa + dy * f.ca }
}

export function grab(p: Pass, x: number, y: number) {
  p.grip = { ...toCard(p, x, y), x, y }
}

export function moveHand(p: Pass, x: number, y: number) {
  if (!p.grip) return
  p.grip.x = x
  p.grip.y = y
}

export function letGo(p: Pass) {
  p.grip = null
}

function kick(p: Pass, j: Jacobian, dx: number, dy: number) {
  const size = Math.hypot(dx, dy)
  const scale = size > KICK_MAX ? KICK_MAX / size : 1
  p.omega += ((j.theta[0] * dx + j.theta[1] * dy) * scale) / swingMass(p).inertia
  p.vr += (j.r[0] * dx + j.r[1] * dy) * scale
  p.vphi += ((j.phi[0] * dx + j.phi[1] * dy) * scale) / cardInertia(p)
}

export function brush(p: Pass, x: number, y: number, vx: number, vy: number, travel: number) {
  if (p.torn) return
  const { u, v } = toCard(p, x, y)
  const j = jacobian(p, frameOf(p), u, v)
  const velocity = velocityAt(p, j)
  const share = TUNING.push * Math.min(1, travel / BRUSH_LENGTH)
  kick(p, j, (vx - velocity.x) * share, (vy - velocity.y) * share * BRUSH_VERTICAL)
}

export function swipe(p: Pass, u: number, v: number, vx: number, vy: number) {
  if (p.torn) return
  const gain = TUNING.push * SWIPE_GAIN
  kick(p, jacobian(p, frameOf(p), u, v), vx * gain, vy * gain * SWIPE_VERTICAL)
}

export function poke(p: Pass, u: number) {
  if (!p.width || p.torn) return
  p.vpsi += TUNING.poke * 5 * Math.max(-1, Math.min(1, u / (p.width / 2)))
}

const px = (n: number) => n.toFixed(2)

export function drawingOf(p: Pass): PassDrawing {
  if (p.torn) return tornDrawingOf(p)
  const f = frameOf(p)
  const line = cordOf(p, f)
  let bow = Math.max(-5, Math.min(5, -p.swingAccel * p.r * BOW))
  if (p.slackSide) {
    const spare = Math.max(0, line.natural - line.length)
    bow += p.slackSide * 2 * Math.sqrt((3 * line.length * spare) / 8)
  }
  const mx = (line.x0 + line.x1) / 2 - ((line.y1 - line.y0) / line.length) * bow
  const my = (line.y0 + line.y1) / 2 + ((line.x1 - line.x0) / line.length) * bow
  const twisted = Math.abs(p.psi) > 1e-4
  const fromRest = f.angle - p.tilt
  return {
    transform: `translate(${px(f.x - p.ringX)}px, ${px(f.y - p.slotY)}px) rotate(${f.angle.toFixed(5)}rad)`,
    shadowX: SHADOW * Math.sin(fromRest),
    shadowY: SHADOW * Math.cos(fromRest),
    twist: twisted ? `perspective(900px) rotateY(${p.psi.toFixed(4)}rad)` : '',
    shade: twisted ? Math.min(1, Math.abs(Math.sin(p.psi)) * 1.3) : 0,
    shadeSide: p.psi > 0 ? -1 : 1,
    cord: `M${px(line.x0)} ${px(line.y0)}Q${px(mx)} ${px(my)} ${px(line.x1)} ${px(line.y1)}`,
    cordScale:
      p.cord.thins && line.length > line.rest
        ? Math.max(1.6 / 3, Math.sqrt(line.rest / line.length))
        : 1,
    glint: 30 + 95 * Math.sin(p.psi) + 150 * fromRest,
    holo: fromRest * 420 + p.psi * 300,
    dip: p.dip,
    cable: cableOf(p),
    opacity: 1,
    torn: false,
    gone: false,
  }
}

function cableOf(p: Pass) {
  const overhang = p.gap / 2 + 0.5
  const leftY = p.left ? (p.left.dip + p.dip) / 2 : 0
  const rightY = p.right ? (p.right.dip + p.dip) / 2 : 0
  return `${px(-overhang)},${px(1 + leftY)} ${px(p.ringX)},${px(1 + p.dip)} ${px(p.hookWidth + overhang)},${px(1 + rightY)}`
}

function tornDrawingOf(p: Pass): PassDrawing {
  const f = freeFrame(p)
  const fromRest = f.angle - p.tilt
  const x0 = p.ringX
  const y0 = p.dip + p.hookY + 1.5
  const stub = p.cord.stub
  const fade =
    p.dropY === null ? 0 : Math.min(1, Math.max(0, (p.cy - p.dropY - FADE.after) / FADE.over))
  return {
    transform: `translate(${px(f.x - p.ringX)}px, ${px(f.y - p.slotY)}px) rotate(${f.angle.toFixed(5)}rad)`,
    shadowX: SHADOW * Math.sin(fromRest),
    shadowY: SHADOW * Math.cos(fromRest),
    twist: '',
    shade: 0,
    shadeSide: 1,
    cord: stub
      ? `M${px(x0)} ${px(y0)}L${px(x0 - stub * Math.sin(p.stub))} ${px(y0 + stub * Math.cos(p.stub))}`
      : '',
    cordScale: 1,
    glint: 30 + 150 * fromRest,
    holo: fromRest * 420,
    dip: p.dip,
    cable: cableOf(p),
    opacity: p.gone ? 0 : 1 - fade,
    torn: true,
    gone: p.gone,
  }
}
