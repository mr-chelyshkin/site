/**
 * An access pass on its cord, hung from a ring on a cable: the motion behind
 * the passes in "Access granted". Free of the DOM, so the page draws it and a
 * script can test it.
 *
 * Positions are in the hook's own pixels: the cable runs along y = 0 and y
 * points down. Time is in seconds, angles in radians, clockwise as in CSS. A
 * pass is a cord that swings from its hook and stretches, a card that turns
 * about its pivot at the cord's end and twists round the cord, and a ring that
 * dips as the cable gives. Each kind of pass brings its own pivot, cord, and
 * point where the cord leaves the hook (`pass-kinds.ts`): a reel's line leaves
 * from the reel's mouth, below the ring, and a metal card hangs by a hole on a
 * ball chain. At rest a pass hangs at its own tilt, as the stylesheet draws it.
 */

/**
 * The feel every kind of pass shares, tuned by hand in a live sketch; each
 * pass's cord brings its own spring and stretch. The constants below derive
 * from it once, at load.
 */
const TUNING = {
  /** A typical pass's swing, Hz, and its damping ratio. */
  swingHz: 1.1,
  swingDamping: 0.1,
  /** The cord's damping ratio; its spring and stretch come with each pass's PassCord. */
  cordDamping: 0.35,
  /** How much the card lags the cord's swing; its spring about its pivot, Hz; damping ratio. */
  wobble: 0.8,
  cardHz: 2.8,
  cardDamping: 0.16,
  /** The twist round the cord, Hz, and its damping ratio. */
  twistHz: 0.85,
  twistDamping: 0.07,
  /** How much of a pointer's speed goes into a push; how hard a poke twists. */
  push: 0.3,
  poke: 0.5,
  /** How far a hard pull bends the cable, px; how far neighbors turn with its slope. */
  cableDip: 10,
  neighbors: 2,
} as const

/** The fixed simulation step, s. */
export const STEP = 1 / 480

const TAU = Math.PI * 2
// A typical pass's pendulum length, px: `swingHz` is quoted for it.
const PENDULUM = 295
// How far a pass taken in hand rises, px.
const LIFT = 8
// How close the cord's tie point may ride up to where the cord leaves the hook, px.
const CLEARANCE = 8
// The cord stretches no further past rest, px.
const STRETCH_MAX = 260
// A cord stiffens as it stretches past rest, but only up to this many of its
// `stretch` scales; no hand gets a cord past 3. Uncapped, a ball chain stretched
// far enough outruns the fixed step: the pass shakes in place and never
// settles. 4 leaves the step a wide margin; it holds to about 16.
const STIFFEST = 4
// The hand: a stiff, damped spring from the point it holds to the pointer,
// pulling no harder once the pointer is `GRIP_REACH` px ahead.
const GRIP = 1200
const GRIP_DAMPING = 2 * 0.7 * Math.sqrt(GRIP)
const GRIP_REACH = 220
// A brush this long, px, hands over the full push. A vertical brush or swipe
// moves a pass less than a sideways one.
const BRUSH_LENGTH = 200
const BRUSH_VERTICAL = 0.35
const SWIPE_GAIN = 1.4
const SWIPE_VERTICAL = 0.15
// The largest push a brush or a swipe hands over, px/s per unit of mass. It caps
// the impulse, not the speed that results; see `kick`.
const KICK_MAX = 900
// How far the swing, the card about its pivot and the twist go before a soft stop, rad.
const SWING_LIMIT = 1.35
const CARD_LIMIT = 0.7
const TWIST_LIMIT = 1
// How far the cord's middle lags a swing's speed-up, s².
const BOW = 0.0009
// The cable: each ring's spring, Hz, its damping ratio, and how far a ring
// drags its neighbors.
const CABLE_HZ = 4.5
const CABLE_DAMPING = 0.2
const CABLE_COUPLING = 0.35
// How far a card's shadow falls, px: the `box-shadow` offset of each kind's body (`_pass-*.scss`).
const SHADOW = 16

// Gravity, px/s².
const G = (TAU * TUNING.swingHz) ** 2 * PENDULUM
const CARD_OMEGA = TAU * TUNING.cardHz
const TWIST_OMEGA = TAU * TUNING.twistHz
const CABLE_OMEGA = TAU * CABLE_HZ

/**
 * A cord's feel: its bounce, Hz; how far past rest it stretches before it
 * stiffens, px; and whether it narrows when stretched. Read-only, since passes
 * of one kind share their cord.
 */
export interface PassCord {
  readonly hz: number
  readonly stretch: number
  readonly thins: boolean
}

/**
 * Where a pass hangs and how: its sizes and place, measured from the page at
 * rest, and its kind's `slot`, `tie`, `hookY` and `cord` (`pass-kinds.ts`).
 */
export interface PassFit {
  /** The pass's width and its card's height. */
  width: number
  height: number
  /** The hook's width and the gap to the next hook: the hook's stretch of cable. */
  hookWidth: number
  gap: number
  /** The ring's x. */
  ringX: number
  /**
   * The pivot's y at rest: the pass's drop plus `slot`. It needs room for the
   * hardware under the hook, lifted in hand too: at least
   * `hookY + tie + CLEARANCE + LIFT`, 16px past `hookY + tie`.
   */
  slotY: number
  /** From the card's top edge down to its pivot: the slot or hole its hardware goes through. */
  slot: number
  /** From the pivot up to where the cord ties on. */
  tie: number
  /** Where the cord swings from below the ring: 0 at the ring, a reel's mouth lower. */
  hookY: number
  /** The cord it hangs on: `hz` and `stretch` set how it moves, `thins` how it's drawn. */
  cord: PassCord
  /** The angle the pass rests at. */
  tilt: number
}

/**
 * A hand on a pass: the point it holds, `u` across and `v` down the card from
 * the slot, and where the hand is now.
 */
export interface Grip {
  u: number
  v: number
  x: number
  y: number
}

/**
 * A pass in motion: where it hangs, how it moves now, and its neighbors on the
 * cable. `step` and the hands change it in place.
 */
export interface Pass extends PassFit {
  /** The cord's angle and how fast it turns. */
  theta: number
  omega: number
  /** The length from the hook, at `hookY`, to the slot, and how fast it changes. */
  r: number
  vr: number
  /** The card's angle about its pivot, against the cord. */
  phi: number
  vphi: number
  /** The card's twist round the cord. */
  psi: number
  vpsi: number
  /** The ring's dip on the cable. */
  dip: number
  vdip: number
  /** The cord's pull, and the latest accelerations of the swing and the ring. */
  tension: number
  swingAccel: number
  dipAccel: number
  /** Which way a slack cord bows: 1 or -1, and 0 while it's taut. */
  slackSide: -1 | 0 | 1
  grip: Grip | null
  /** Taken in hand by the keyboard's focus: straight and lifted. */
  inHand: boolean
  /** The neighbors on the same cable. */
  left: Pass | null
  right: Pass | null
}

/** How to draw a pass: CSS for its element, SVG for its cord and its stretch of cable. */
export interface PassDrawing {
  /** The pass's transform, about the slot's rest position. */
  transform: string
  /**
   * The card's shadow offset. It turns back by the pass's angle away from rest,
   * so the shadow keeps falling as it does at rest, where it is the
   * stylesheet's own `0 16px`.
   */
  shadowX: number
  shadowY: number
  /** The twist's transform; empty while the card faces front. */
  twist: string
  /** How dark the edge turned from the light is, 0 to 1, and which edge: 1 left, -1 right. */
  shade: number
  shadeSide: number
  /** The cord as an SVG path, and how far a stretched cord has thinned: 1 for not at all. */
  cord: string
  cordScale: number
  /**
   * Where the light catches a glossy surface, in percent across it, and how far
   * a hologram's colors turn, in degrees.
   */
  glint: number
  holo: number
  /** The ring's dip, and the hook's stretch of cable as SVG polyline points. */
  dip: number
  cable: string
}

interface Frame {
  /** The sine and cosine of the cord's angle. */
  st: number
  ct: number
  /** The card's angle, and its sine and cosine. */
  angle: number
  sa: number
  ca: number
  /** The slot. */
  x: number
  y: number
}

/** A pass hanging still at its own tilt, alone on its cable until `left` and `right` are set. */
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
  }
}

/**
 * Takes a new measurement; any motion carries on from where it is. Only the
 * fit is copied, so a whole `Pass` passed in hands over none of its motion.
 */
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

// The shortest the hook-to-pivot length gets: the tie point stops just short
// of where the cord leaves the hook.
function reachMin(p: Pass) {
  return p.tie + CLEARANCE
}

function restOf(p: Pass) {
  const inHand = p.inHand && !p.grip
  // Never above the tie point's stop: a rest the pass can't reach would keep it moving.
  const r = Math.max(reachMin(p), p.slotY - p.hookY - (inHand ? LIFT : 0))
  return { theta: inHand ? 0 : p.tilt, r, inHand }
}

// The cord's spring: its angular frequency, stiffness, and how far the card's
// weight stretches it at rest.
function springOf(p: Pass) {
  const omega = TAU * p.cord.hz
  const k = omega * omega
  return { omega, k, prestretch: G / k }
}

// The pass about its hook: the arm to the card's middle and the moment of
// inertia, per unit of mass. The arm is at least 40px, so a card too small to
// measure can't swing too fast.
function swingMass(p: Pass) {
  const arm = Math.max(40, p.r + p.height / 2 - p.slot)
  return { arm, inertia: arm * arm + (p.height ** 2 + p.width ** 2) / 12 }
}

// The card about its slot, per unit of mass.
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

// How the card point (u, v) moves per unit of swing, stretch and card angle.
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

// The cord, from just under where it leaves the hook to the tie point; its
// length now, hanging straight at rest, and unstretched. Like `restOf`, it never
// puts the slot above the tie point's stop, so a pass hung too high can't make
// the rest length negative.
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

// The cable's slope at the ring: the hook turns with it. A cable measured
// before layout has no length, so no slope to turn a hook with.
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

  // Swing: gravity across the cord, the air, and the pull of a cord changing
  // length, which slows a swing as it lengthens and speeds it up as it shortens.
  let swingAccel =
    -stiffness * Math.sin(off) -
    2 * damping * Math.sqrt(stiffness) * p.omega -
    (2 * p.vr * p.omega) / arm
  if (Math.abs(off) > SWING_LIMIT) {
    swingAccel -= 3000 * (off - Math.sign(off) * SWING_LIMIT) + 30 * p.omega
  }
  const freeSwingAccel = swingAccel

  // Stretch: the cord holds the card's weight with some stretch already in it,
  // stiffens once pulled past rest, and goes slack above its natural length.
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
    // A slack cord holds nothing: the card flies free, and the air slows it only a little.
    stretchAccel -= 0.8 * p.vr
  }

  // The card springs back in line with the cord and lags its swing.
  let turnAccel =
    -(CARD_OMEGA ** 2) * Math.sin(p.phi) -
    2 * TUNING.cardDamping * CARD_OMEGA * p.vphi -
    TUNING.wobble * freeSwingAccel
  if (Math.abs(p.phi) > CARD_LIMIT) turnAccel -= 200 * (p.phi - Math.sign(p.phi) * CARD_LIMIT)

  // The twist dies out on its own, and at once in a hand.
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

  // A slack cord bows out to one side until it's taut again.
  const line = cordOf(p, frameOf(p))
  if (line.length >= line.natural) p.slackSide = 0
  else if (!p.slackSide) p.slackSide = p.omega < 0 ? -1 : 1
}

/** Moves every pass on the wall on by one `STEP`. */
export function step(passes: readonly Pass[]) {
  for (const p of passes) advance(p)
  // The cable gives under a pull beyond a card's weight and rises a little
  // when the weight comes off; each ring drags its neighbors along.
  for (const p of passes) {
    const load = (p.tension - G) * Math.cos(p.theta)
    // It takes a pull of about 2.5 cards' weight past the card's own to bend
    // the cable most of the way to `cableDip`.
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

/** Whether the pass still moves, or a hand holds it; a still pass can `settle`. */
export function isMoving(p: Pass) {
  if (p.grip) return true
  const rest = restOf(p)
  // The twist dies out slowest and shows least: snapping from 5e-3 rad moves the
  // card's edge by about 0.06px.
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

/** Puts the pass exactly at rest. */
export function settle(p: Pass) {
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

/** The point (x, y) in the card's frame: `u` across and `v` down from the slot. */
export function toCard(p: Pass, x: number, y: number) {
  const f = frameOf(p)
  const dx = x - f.x
  const dy = y - f.y
  const u = dx * f.ca + dy * f.sa
  // A twisted card looks narrower than it is.
  const facing = Math.cos(p.psi)
  return { u: Math.abs(facing) > 0.3 ? u / facing : u, v: -dx * f.sa + dy * f.ca }
}

/** A hand takes hold of the pass at (x, y). */
export function grab(p: Pass, x: number, y: number) {
  p.grip = { ...toCard(p, x, y), x, y }
}

/** The hand holding the pass moves to (x, y). */
export function moveHand(p: Pass, x: number, y: number) {
  if (!p.grip) return
  p.grip.x = x
  p.grip.y = y
}

/** The hand lets go, and the pass keeps whatever motion it has. */
export function letGo(p: Pass) {
  p.grip = null
}

// Pushes the card at the point `j` is for, with an impulse of (dx, dy) px/s per
// unit of mass shared out over the swing, the stretch and the card's angle. The
// point's own speed changes by more or less than that, by where it is on the
// card; `KICK_MAX` caps the impulse, not that change.
function kick(p: Pass, j: Jacobian, dx: number, dy: number) {
  const size = Math.hypot(dx, dy)
  const scale = size > KICK_MAX ? KICK_MAX / size : 1
  p.omega += ((j.theta[0] * dx + j.theta[1] * dy) * scale) / swingMass(p).inertia
  p.vr += (j.r[0] * dx + j.r[1] * dy) * scale
  p.vphi += ((j.phi[0] * dx + j.phi[1] * dy) * scale) / cardInertia(p)
}

/**
 * A pointer brushing the pass at (x, y), moving at (vx, vy) px/s and `travel`
 * px since its last move: it pushes the point it brushes with part of the
 * difference between their velocities, as a `kick`.
 */
export function brush(p: Pass, x: number, y: number, vx: number, vy: number, travel: number) {
  const { u, v } = toCard(p, x, y)
  const j = jacobian(p, frameOf(p), u, v)
  const velocity = velocityAt(p, j)
  const share = TUNING.push * Math.min(1, travel / BRUSH_LENGTH)
  kick(p, j, (vx - velocity.x) * share, (vy - velocity.y) * share * BRUSH_VERTICAL)
}

/** A finger swiping off the card point (u, v) at (vx, vy) px/s. */
export function swipe(p: Pass, u: number, v: number, vx: number, vy: number) {
  const gain = TUNING.push * SWIPE_GAIN
  kick(p, jacobian(p, frameOf(p), u, v), vx * gain, vy * gain * SWIPE_VERTICAL)
}

/** A poke `u` px off the card's middle turns the pass round its cord. */
export function poke(p: Pass, u: number) {
  // A pass measured before layout has no width, so no middle to poke off.
  if (!p.width) return
  // `poke` was a 0-to-1 knob in the sketch; the 5 makes it rad/s, so a poke at
  // the edge adds 2.5 rad/s to the twist.
  p.vpsi += TUNING.poke * 5 * Math.max(-1, Math.min(1, u / (p.width / 2)))
}

const px = (n: number) => n.toFixed(2)

/** The pass as it is now, in CSS and SVG values. A pass at rest draws as the stylesheet does. */
export function drawingOf(p: Pass): PassDrawing {
  const f = frameOf(p)
  const line = cordOf(p, f)
  // The cord's middle lags a swing's speed-up, and a slack cord bows out as far
  // as its spare length lets it.
  let bow = Math.max(-5, Math.min(5, -p.swingAccel * p.r * BOW))
  if (p.slackSide) {
    const spare = Math.max(0, line.natural - line.length)
    bow += p.slackSide * 2 * Math.sqrt((3 * line.length * spare) / 8)
  }
  const mx = (line.x0 + line.x1) / 2 - ((line.y1 - line.y0) / line.length) * bow
  const my = (line.y0 + line.y1) / 2 + ((line.x1 - line.x0) / line.length) * bow
  const twisted = Math.abs(p.psi) > 1e-4
  // Straight to the midpoints between rings, so neighbors' stretches meet.
  const overhang = p.gap / 2 + 0.5
  const leftY = p.left ? (p.left.dip + p.dip) / 2 : 0
  const rightY = p.right ? (p.right.dip + p.dip) / 2 : 0
  // The shadow turns back by the angle away from rest, so it falls as it does at rest.
  const fromRest = f.angle - p.tilt
  return {
    transform: `translate(${px(f.x - p.ringX)}px, ${px(f.y - p.slotY)}px) rotate(${f.angle.toFixed(5)}rad)`,
    shadowX: SHADOW * Math.sin(fromRest),
    shadowY: SHADOW * Math.cos(fromRest),
    // Seen from 900px, a twisted card foreshortens gently: at the twist's soft
    // stop its near edge grows by about a tenth.
    twist: twisted ? `perspective(900px) rotateY(${p.psi.toFixed(4)}rad)` : '',
    // The edge turned from the light is fully dark by about 50°, just short of
    // the twist's soft stop.
    shade: twisted ? Math.min(1, Math.abs(Math.sin(p.psi)) * 1.3) : 0,
    shadeSide: p.psi > 0 ? -1 : 1,
    cord: `M${px(line.x0)} ${px(line.y0)}Q${px(mx)} ${px(my)} ${px(line.x1)} ${px(line.y1)}`,
    // A cord that thins narrows as it stretches, to no less than 1.6px of a 3px cord.
    cordScale:
      p.cord.thins && line.length > line.rest
        ? Math.max(1.6 / 3, Math.sqrt(line.rest / line.length))
        : 1,
    // 30% across at rest; a twist slides the glint, and so does the swing away from rest.
    // The gains, 95 and 150 here and 420 and 300 for the hologram, were tuned in the sketch.
    glint: 30 + 95 * Math.sin(p.psi) + 150 * fromRest,
    holo: fromRest * 420 + p.psi * 300,
    dip: p.dip,
    cable: `${px(-overhang)},${px(1 + leftY)} ${px(p.ringX)},${px(1 + p.dip)} ${px(p.hookWidth + overhang)},${px(1 + rightY)}`,
  }
}
