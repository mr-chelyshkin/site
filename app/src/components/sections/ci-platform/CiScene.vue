<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import IsoSolid from '@/components/sections/ci-platform/IsoSolid.vue'
import { useReducedMotion } from '@/composables/useReducedMotion'
import type { CiPlatformContent } from '@/contents'
import {
  X,
  boxFaces,
  onFront,
  onTop,
  planeTransform,
  projector,
  svgPoints,
  type Box,
  type Point,
  type Vec3,
} from '@/utils/isometric'
import { clamp01, lerp } from '@/utils/math'
import { phase, smooth } from '@/utils/stack-story'

type Picture = CiPlatformContent['picture']

const props = defineProps<{
  content: Picture['scene']
  parts: Picture['panel']['parts']
  selected: string | null
  clock: number
  zoom?: string
}>()
const emit = defineEmits<{ select: [id: string] }>()

const PZ = 10
const project = projector(0, 0)

const PLATES = {
  route: { x: -50, y: -92, z: 0, width: 102, depth: 196, height: PZ },
  run: { x: 77, y: -140, z: 0, width: 259, depth: 244, height: PZ },
  deliver: { x: 218, y: -340, z: 0, width: 128, depth: 180, height: PZ },
} satisfies Record<string, Box>

const LAPTOP: Box = { x: -31, y: -71, z: PZ, width: 62, depth: 42, height: 3.5 }
const LID_OPEN = (105 * Math.PI) / 180
const LID = 2.4
const LID_REACH: Box = { x: LAPTOP.x, y: -82, z: PZ, width: LAPTOP.width, depth: 11, height: 45 }
const RUNNER: Box = { x: -36, y: 26, z: PZ, width: 72, depth: 48, height: 20 }
const CARD: Box = { x: -30, y: 31, z: PZ + RUNNER.height, width: 56, depth: 40, height: 0.8 }
const HUB_X = 127
const SHEET: Box = { x: HUB_X - 38, y: -14, z: PZ, width: 76, depth: 74, height: 1 }
const CARDS: Box[] = [0, 1, 2].map((k) => ({
  x: 100 - 2 * k,
  y: -124 - 2 * k,
  z: PZ + 4 * k,
  width: 38,
  depth: 44,
  height: 1.2,
}))
const CRATES: Box[] = [160, 190, 220].map((x) => ({
  x,
  y: -126,
  z: PZ,
  width: 28,
  depth: 28,
  height: 24,
}))
const BOX: Box = { x: 206, y: -32, z: PZ, width: 64, depth: 64, height: 56 }
const CODE: Box = { x: 234, y: -2, z: PZ, width: 30, depth: 28, height: 6 }
const COPY = { width: 22, depth: 22, height: 18 }
const COPY_FROM: Vec3 = [223, -123, PZ + 27]
const COPY_TO: Vec3 = [214, -24, PZ]
const COPY_HIGH = BOX.z + BOX.height + 18
const ROAD_X = BOX.x + BOX.width + 12
const DIST: Box = { x: ROAD_X + 16, y: 10, z: PZ, width: 26, depth: 20, height: 7 }
const CACHE = { x: ROAD_X + 34, y: -18, r: 11, height: 20 }
const CACHE_BOX: Box = {
  x: CACHE.x - CACHE.r,
  y: CACHE.y - CACHE.r,
  z: PZ,
  width: CACHE.r * 2,
  depth: CACHE.r * 2,
  height: CACHE.height,
}
const POST: Box = { x: 330, y: -174, z: PZ, width: 8, depth: 8, height: 34 }
const PIVOT: Vec3 = [POST.x + 4, -170, PZ + 30]
const ARM = 74
const ARM_OPEN = (80 * Math.PI) / 180
const VAULT: Box = {
  x: PLATES.deliver.x + (PLATES.deliver.width - 72) / 2,
  y: PLATES.deliver.y + 20,
  z: PZ,
  width: 72,
  depth: 68,
  height: 64,
}

const at = (x: number, y: number): Vec3 => [x, y, PZ]
const HANDOFF = {
  laptop: [at(31, -50), at(44, -50), at(44, 0), at(HUB_X, 0)],
  runner: [at(36, 50), at(44, 50), at(44, 0), at(HUB_X, 0)],
} as const
type Caller = keyof typeof HANDOFF
type Tone = Caller | 'shared'
const PARK = at(HUB_X, 0)
const TO_BOX: readonly Vec3[] = [PARK, at(BOX.x, 0)]
const FROM_SHARED: readonly Vec3[] = [at(118, -80), at(118, 0), PARK]
const LANE = 52
const SPUR_X = SHEET.x + SHEET.width + 6
const DEPLOY_ROAD: readonly Vec3[] = [
  at(SPUR_X, 0),
  at(SPUR_X, LANE),
  at(ROAD_X, LANE),
  at(ROAD_X, -170),
]
const DEPLOY_RUN: readonly Vec3[] = [PARK, ...DEPLOY_ROAD]
const lengthOf = (points: readonly Vec3[]) =>
  points
    .slice(1)
    .reduce(
      (sum, to, i) =>
        sum + Math.hypot(to[0] - (points[i]?.[0] ?? 0), to[1] - (points[i]?.[1] ?? 0)),
      0,
    )
const PASS_AT =
  (lengthOf(DEPLOY_RUN.slice(0, -1)) + LANE - (DIST.y + DIST.depth / 2)) / lengthOf(DEPLOY_RUN)
const TO_VAULT: readonly Vec3[] = [at(ROAD_X, -170), at(ROAD_X, VAULT.y + VAULT.depth)]
const PATHS = [HANDOFF.laptop, HANDOFF.runner, TO_BOX, FROM_SHARED, DEPLOY_ROAD, TO_VAULT].map(
  (path) => svgPoints(path.map((point) => project(...point))),
)

const RUNS = { laptop: 7, runner: 15 } as const
const LOOP = RUNS.laptop + RUNS.runner
const STILL = RUNS.laptop + 12
const START = { laptop: 0.9, runner: 0.6 } as const
const HAND = { laptop: 1.2, runner: 1 } as const
const SHARE = 0.7
const TRAVEL = 0.5
const TASK = 0.7
const CI: Record<Caller, readonly number[]> = { laptop: [2], runner: [0, 1, 2] }
const DEPLOY = 3
const ROAD = 1.8
const PAUSE = 0.3
const ENTER = 0.8
const CACHE_AT = START.laptop + HAND.laptop + SHARE + TRAVEL

interface Move {
  from: number
  to: number
  path: readonly Vec3[]
  tone: Tone
  task: number | null
  hold?: boolean
}

const corners = ({ x, y, z, width, depth, height }: Box): Vec3[] =>
  [0, 1].flatMap((i) =>
    [0, 1].flatMap((j) => [0, 1].map((k): Vec3 => [x + i * width, y + j * depth, z + k * height])),
  )
const frame = (reach: readonly Box[], margin: number) => {
  const points = reach.flatMap(corners).map((point) => project(...point))
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const x = Math.min(...xs) - margin
  const y = Math.min(...ys) - margin
  return { x, y, width: Math.max(...xs) + margin - x, height: Math.max(...ys) + margin - y }
}
const SCENE = (() => {
  const reach: Box[] = [
    ...Object.values(PLATES),
    VAULT,
    RUNNER,
    LID_REACH,
    { ...POST, height: POST.height + ARM },
  ]
  const { x, y, width, height } = frame(reach, 6)
  return { x, y: y - 60, width, height: height + 70 }
})()
const ZOOM_ASPECT = 16 / 10
const EXTENTS: Record<string, readonly Box[]> = {
  laptop: [LAPTOP, LID_REACH],
  runner: [RUNNER, CARD],
  project: [SHEET],
  shared: CARDS,
  registry: CRATES,
  box: [BOX, DIST, CACHE_BOX],
  gate: [POST, { x: PIVOT[0] - ARM, y: POST.y, z: PZ, width: ARM, depth: 8, height: 34 + ARM }],
  delivery: [VAULT, { x: VAULT.x + 20, y: VAULT.y + 28, z: PZ, width: 36, depth: 8, height: 108 }],
}
const zoomed = (id: string) => {
  const box = frame(EXTENTS[id] ?? [], 14)
  const width = Math.max(box.width, box.height * ZOOM_ASPECT)
  const height = width / ZOOM_ASPECT
  return {
    x: box.x - (width - box.width) / 2,
    y: box.y - (height - box.height) / 2,
    width,
    height,
  }
}

const anchor = (point: Vec3, dx: number, dy: number) => {
  const [x, y] = project(...point)
  return { x: x + dx, y: y + dy }
}
const LAPTOP_TAG = anchor([0, -82, PZ + 44], 0, -9)
const LABELS = [
  { id: 'laptop', ...LAPTOP_TAG, end: false },
  { id: 'runner', ...anchor([0, 96, PZ], 0, 3), end: false },
  { id: 'shared', ...anchor([117, -104, PZ + 12], 0, -24), end: false },
  { id: 'registry', ...anchor([204, -126, PZ + 24], 0, -10), end: false },
  { id: 'gate', ...anchor([POST.x + POST.width, POST.y + POST.depth, PZ], 9, 6), end: true },
  {
    id: 'delivery',
    x: anchor([ROAD_X, VAULT.y, PZ + VAULT.height], 0, 0).x,
    y: LAPTOP_TAG.y,
    end: false,
  },
]
const LABEL_CHAR = 6.05
const DECAL = { char: 4.7, depth: 11, pad: 8 }
const DECALS = [
  { id: 'project', x: SHEET.x, y: SHEET.y + SHEET.depth + 4, align: 'start' },
  { id: 'box', x: BOX.x + BOX.width / 2, y: BOX.y + BOX.depth + 5, align: 'middle' },
] as const
const ZONES = [
  { key: 'route', x: SCENE.x + 6 },
  { key: 'run', x: project(PLATES.run.x, PLATES.run.y, PZ)[0] - 20 },
  { key: 'deliver', x: project(PLATES.deliver.x, PLATES.deliver.y, PZ)[0] - 34 },
] as const

const lid = (() => {
  const { x, y, z, width: w, depth: d, height } = LAPTOP
  const cos = Math.cos(LID_OPEN)
  const sin = Math.sin(LID_OPEN)
  const top = z + height
  const point = (u: number, along: number, out: number): Vec3 => [
    x + u,
    y + along * cos - out * sin,
    top + along * sin + out * cos,
  ]
  const p = (u: number, along: number, out: number): Point => project(...point(u, along, out))
  return {
    inner: svgPoints([p(0, 0, 0), p(w, 0, 0), p(w, d, 0), p(0, d, 0)]),
    edge: svgPoints([p(0, d, 0), p(w, d, 0), p(w, d, LID), p(0, d, LID)]),
    side: svgPoints([p(w, 0, 0), p(w, d, 0), p(w, d, LID), p(w, 0, LID)]),
    screen: planeTransform(project, point(0, d, 0), X, [0, -cos, -sin]),
  }
})()

const glass = (() => {
  const { x, y, z, width, depth, height } = BOX
  const p = (i: number, j: number, k: number) =>
    project(x + i * width, y + j * depth, z + k * height)
  const face = (...points: Point[]) => svgPoints(points)
  return {
    back: [
      face(p(0, 0, 0), p(1, 0, 0), p(1, 0, 1), p(0, 0, 1)),
      face(p(0, 0, 0), p(0, 1, 0), p(0, 1, 1), p(0, 0, 1)),
    ],
    front: [
      face(p(1, 0, 0), p(1, 1, 0), p(1, 1, 1), p(1, 0, 1)),
      face(p(0, 1, 0), p(1, 1, 0), p(1, 1, 1), p(0, 1, 1)),
    ],
    rim: face(p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1), p(0, 0, 1)),
  }
})()

const toolCrate = computed(() => props.content.images.indexOf(props.content.tool))

const hatch = `${useId()}-hatch`
const keys = `${useId()}-keys`
const reduced = useReducedMotion()

const story = computed(() => {
  const t = reduced.value ? STILL : props.clock % LOOP
  const caller: Caller = t < RUNS.laptop ? 'laptop' : 'runner'
  const r = caller === 'laptop' ? t : t - RUNS.laptop
  const start = START[caller]
  const hand = HAND[caller]
  const ships = caller === 'runner'
  const moves: Move[] = []
  const calls: number[] = []
  const arrivals: number[] = []
  const runs: { task: number; from: number; arrive: number; to: number }[] = []
  let clock = start
  for (const task of CI[caller]) {
    const arrive = clock + hand
    const depart = arrive + SHARE
    const label = ships ? task : null
    calls.push(clock)
    arrivals.push(arrive)
    moves.push(
      { from: clock, to: arrive, path: HANDOFF[caller], tone: caller, task: label },
      { from: arrive, to: depart, path: [PARK], tone: caller, task: label, hold: true },
      { from: arrive, to: depart, path: FROM_SHARED, tone: 'shared', task },
      { from: depart, to: depart + TRAVEL, path: TO_BOX, tone: caller, task },
    )
    runs.push({ task, from: clock, arrive: depart + TRAVEL, to: depart + TRAVEL + TASK })
    clock = depart + TRAVEL + TASK
  }
  const built = clock
  const steps: { task: number; from: number; to: number }[] = runs.map(({ task, from, to }) => ({
    task,
    from,
    to,
  }))
  const leave = built + hand
  const gate = leave + ROAD
  if (ships) {
    const inside = gate + PAUSE + ENTER
    calls.push(built)
    arrivals.push(leave)
    moves.push(
      { from: built, to: leave, path: HANDOFF.runner, tone: caller, task: DEPLOY },
      { from: leave, to: gate, path: DEPLOY_RUN, tone: caller, task: DEPLOY },
      { from: gate, to: gate + PAUSE, path: DEPLOY_ROAD.slice(-1), tone: caller, task: DEPLOY },
      { from: gate + PAUSE, to: inside, path: TO_VAULT, tone: caller, task: DEPLOY },
    )
    steps.push({ task: DEPLOY, from: built, to: inside })
  }
  return {
    t,
    r,
    caller,
    start,
    built,
    gate,
    ships,
    moves,
    calls,
    arrivals,
    first: runs[0] ?? { task: 0, from: start, arrive: start, to: start },
    current: steps.find(({ from, to }) => r >= from && r < to)?.task ?? null,
    running: runs.find(({ arrive, to }) => r >= arrive && r < to) ?? null,
    finished: steps.filter(({ to }) => r >= to).map(({ task }) => task),
  }
})

function along(points: readonly Vec3[], t: number): Vec3 {
  const legs = points.slice(1).map((to, i) => {
    const from = points[i] ?? to
    return { from, to, length: Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]) }
  })
  let left = clamp01(t) * legs.reduce((sum, leg) => sum + leg.length, 0)
  for (const { from, to, length } of legs) {
    if (left <= length) {
      const k = length ? left / length : 0
      return [lerp(from[0], to[0], k), lerp(from[1], to[1], k), lerp(from[2], to[2], k)]
    }
    left -= length
  }
  return points[points.length - 1] ?? [0, 0, 0]
}

const labelFor = ({ tone, task }: Move) =>
  tone === 'shared' || task === null ? '' : (props.content.workflow[task] ?? '')
const tokens = computed(() => {
  const { r, moves } = story.value
  return moves
    .filter(({ from, to }) => r >= from && r <= to)
    .map((move) => ({
      point: project(...along(move.path, (r - move.from) / (move.to - move.from))),
      tone: move.tone,
      label: labelFor(move),
      waiting: move.hold === true,
    }))
})

const CAMERA = { width: 240, height: 240 / ZOOM_ASPECT }
const centerOf = ({ x, y, z, width, depth, height }: Box) =>
  project(x + width / 2, y + depth / 2, z + height / 2)
const focus = (): Point => {
  const { r, caller, start, built, ships } = story.value
  const lead = tokens.value.filter(({ waiting }) => !waiting).at(-1)
  if (lead) return lead.point
  if (r < start) return centerOf(caller === 'laptop' ? LAPTOP : RUNNER)
  if (r < built) return centerOf(BOX)
  return centerOf(ships ? VAULT : DIST)
}
const camera = ref<Point>(focus())
watch(
  () => story.value.t,
  () => {
    if (props.zoom !== 'dot') return
    const [x, y] = camera.value
    const [tx, ty] = focus()
    camera.value = reduced.value ? [tx, ty] : [lerp(x, tx, 0.1), lerp(y, ty, 0.1)]
  },
)
const view = computed(() => (props.zoom && props.zoom !== 'dot' ? zoomed(props.zoom) : SCENE))
const aspect = computed(() => (props.zoom ? `${ZOOM_ASPECT}` : `${SCENE.width} / ${SCENE.height}`))
const pan = computed(() => {
  if (props.zoom !== 'dot') return undefined
  const [x, y] = camera.value
  const left = (x - CAMERA.width / 2 - SCENE.x) / SCENE.width
  const top = (y - CAMERA.height / 2 - SCENE.y) / SCENE.height
  return {
    width: `${(100 * SCENE.width) / CAMERA.width}%`,
    transform: `translate3d(${(-100 * left).toFixed(3)}%, ${(-100 * top).toFixed(3)}%, 0)`,
  }
})

const live = computed(() => {
  const { r, caller, built, gate, ships, moves, first, calls, arrivals } = story.value
  const on = new Set<string>()
  const add = (id: string, from: number, to: number) => {
    if (r >= from && r < to) on.add(id)
  }
  for (const call of calls) add(caller, call - 0.3, call + 0.5)
  for (const arrival of arrivals) add('project', arrival - 0.4, arrival + 0.3)
  for (const move of moves) if (move.tone === 'shared') add('shared', move.from, move.from + 0.35)
  add('registry', first.arrive - TRAVEL, first.arrive)
  add('box', first.arrive - 0.1, built + 0.2)
  if (ships) {
    add('gate', gate - 0.6, gate + 0.5)
    add('delivery', gate + 0.3, gate + 1.8)
  }
  return on
})

const typed = computed(() => {
  const { command } = props.content
  const { caller, r } = story.value
  if (caller !== 'laptop') return command
  return command.slice(0, Math.ceil(phase(r, 0.1, 0.7) * command.length))
})
const answered = computed(() => story.value.ships || story.value.r > story.value.built + 0.2)
const called = computed(() => {
  const { ships, r, calls } = story.value
  return ships && calls.some((call) => r >= call - 0.3 && r < call + 0.4)
})
const ending = computed(() => (story.value.ships ? story.value.gate + 2.2 : RUNS.laptop - 0.8))

const copy = computed(() => {
  const { r, first } = story.value
  const from = first.arrive - TRAVEL + 0.1
  if (r < from) return null
  const move = smooth(phase(r, from, 0.4))
  const drop = smooth(phase(r, from + 0.4, 0.2))
  const box: Box = {
    x: lerp(COPY_FROM[0], COPY_TO[0], move),
    y: lerp(COPY_FROM[1], COPY_TO[1], move),
    z: lerp(lerp(COPY_FROM[2], COPY_HIGH, move), COPY_TO[2], drop),
    ...COPY,
  }
  return { box, opacity: 1 - phase(r, ending.value, 0.4) }
})
const glow = computed(() => {
  const { r, running } = story.value
  return running ? 0.3 * Math.sin(Math.PI * phase(r, running.arrive, TASK)) : 0
})
const dist = computed(() => {
  const { r, built } = story.value
  const k = smooth(phase(r, built, 0.35))
  return {
    box: { ...DIST, z: PZ + 16 * (1 - k) },
    opacity: k * (1 - phase(r, ending.value, 0.4)),
  }
})
const pickup = computed(() => {
  const { r, gate, ships } = story.value
  if (!ships) return 0
  const pass = gate - ROAD * (1 - PASS_AT)
  return 0.6 * (smooth(phase(r, pass - 0.2, 0.2)) - smooth(phase(r, pass + 0.1, 0.7)))
})
const distTop = computed(() => svgPoints(boxFaces(project, dist.value.box).top))
const drum = computed(() => {
  const k = reduced.value ? 1 : smooth(phase(props.clock, CACHE_AT, 0.45))
  const [cx, bottom] = project(CACHE.x, CACHE.y, PZ + 16 * (1 - k))
  const top = bottom - CACHE.height
  const rx = CACHE.r * Math.SQRT2 * Math.cos(Math.PI / 6)
  const ry = CACHE.r * Math.SQRT1_2
  const band = (y: number) => `M${cx - rx} ${y} A${rx} ${ry} 0 0 0 ${cx + rx} ${y}`
  return {
    opacity: k,
    cx,
    top,
    rx,
    ry,
    side: `M${cx - rx} ${top} L${cx - rx} ${bottom} A${rx} ${ry} 0 0 0 ${cx + rx} ${bottom} L${cx + rx} ${top} A${rx} ${ry} 0 0 1 ${cx - rx} ${top} Z`,
    bands: [band(top + 6), band(top + 15)],
  }
})
const arm = computed(() => {
  const { r, gate, ships } = story.value
  const angle = ships
    ? ARM_OPEN * (smooth(phase(r, gate - 0.5, 0.5)) - smooth(phase(r, gate + 1.6, 0.6)))
    : 0
  const [x1, y1] = project(...PIVOT)
  const [x2, y2] = project(
    PIVOT[0] - ARM * Math.cos(angle),
    PIVOT[1],
    PIVOT[2] + ARM * Math.sin(angle),
  )
  return { x1, y1, x2, y2 }
})
const lock = computed(() => {
  const { r, gate, ships } = story.value
  const s = ships ? 1 + 0.18 * Math.sin(Math.PI * phase(r, gate + PAUSE + ENTER, 0.5)) : 1
  return `translate(62 31) scale(${s.toFixed(3)}) translate(-62 -31)`
})
const marks = computed(() => {
  const { current, finished } = story.value
  return { current, finished: new Set(finished) }
})

const labelOf = (id: string) => props.parts.find((part) => part.id === id)?.label ?? id
const labels = computed(() =>
  LABELS.map((label) => {
    const text = labelOf(label.id)
    const width = text.length * LABEL_CHAR + 12
    return { ...label, text, width, left: label.end ? label.x : label.x - width / 2 }
  }),
)
const decals = computed(() =>
  DECALS.map(({ id, x, y, align }) => {
    const text = labelOf(id)
    const width = text.length * DECAL.char + DECAL.pad
    const left = align === 'middle' ? x - width / 2 : x
    const plane = { x: left, y, z: PZ, width, depth: DECAL.depth, height: 0 }
    return { id, text, width, transform: onTop(project, plane) }
  }),
)
const state = (id: string) => ({
  'ci-scene__part--on': props.selected === id,
  'ci-scene__part--off': props.selected !== null && props.selected !== id,
  'ci-scene__part--live': live.value.has(id),
})
const piece = (id: string) => ({ class: ['ci-scene__piece', state(id)] })
const part = (id: string) =>
  props.zoom
    ? piece(id)
    : {
        'data-part': id,
        class: ['ci-scene__part', state(id)],
        role: 'button',
        tabindex: 0,
        'aria-label': labelOf(id),
        'aria-pressed': props.selected === id,
        onClick: () => emit('select', id),
        onKeydown: (event: KeyboardEvent) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          emit('select', id)
        },
      }
</script>

<template>
  <div
    class="ci-scene"
    :class="{
      'ci-scene--zoom': zoom,
      'ci-scene--pan': zoom === 'dot',
      'ci-scene--picked': selected !== null,
    }"
    :style="{ aspectRatio: aspect }"
  >
    <svg
      class="ci-scene__svg"
      :style="pan"
      :viewBox="`${view.x} ${view.y} ${view.width} ${view.height}`"
      :role="zoom ? undefined : 'group'"
      :aria-label="zoom ? undefined : content.label"
      :aria-hidden="zoom ? 'true' : undefined"
    >
      <defs>
        <pattern
          :id="hatch"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect class="ci-scene__hatch-ground" width="5" height="5" />
          <line class="ci-scene__hatch" x1="0" y1="0" x2="0" y2="5" />
        </pattern>
        <pattern :id="keys" width="4.6" height="4.4" patternUnits="userSpaceOnUse">
          <rect class="ci-scene__key" x="0.4" y="0.4" width="3.8" height="3.6" rx="0.6" />
        </pattern>
      </defs>

      <g
        v-for="zone in zoom ? [] : ZONES"
        :key="zone.key"
        :class="`ci-scene__zone ci-scene__zone--${zone.key}`"
      >
        <text class="ci-scene__zone-title" :x="zone.x" :y="SCENE.y + 24">
          {{ content.zones[zone.key].title }}
        </text>
        <text class="ci-scene__zone-note" :x="zone.x" :y="SCENE.y + 40">
          {{ content.zones[zone.key].note }}
        </text>
      </g>

      <IsoSolid class="ci-scene__plate ci-solid--cd" :box="PLATES.deliver" :project="project" />
      <IsoSolid
        class="ci-scene__plate ci-solid--plate"
        :box="PLATES.run"
        :project="project"
        :side="`url(#${hatch})`"
      />
      <IsoSolid
        class="ci-scene__plate ci-solid--plate"
        :box="PLATES.route"
        :project="project"
        :side="`url(#${hatch})`"
      />
      <polyline v-for="(points, i) in PATHS" :key="i" class="ci-scene__path" :points="points" />

      <g v-bind="part('laptop')">
        <IsoSolid class="ci-solid--alu" :box="LAPTOP" :project="project" />
        <g :transform="onTop(project, LAPTOP)">
          <rect class="ci-scene__keyboard" x="5" y="4" width="52" height="20" rx="1" />
          <rect x="5.4" y="4.4" width="51.2" height="19.2" :style="{ fill: `url(#${keys})` }" />
          <rect class="ci-scene__trackpad" x="21" y="27" width="20" height="12" rx="1.5" />
        </g>
        <polygon class="ci-scene__bezel" :points="lid.inner" />
        <g :transform="lid.screen">
          <rect class="ci-scene__display" x="2.4" y="2.4" width="57.2" height="37.2" rx="1" />
          <text class="ci-scene__term" x="6" y="12">
            <tspan class="ci-scene__term--prompt">~ $</tspan>
            {{ typed }}
          </text>
          <text v-if="answered" class="ci-scene__term ci-scene__term--ok" x="6" y="20">
            ✓ {{ content.result }}
          </text>
        </g>
        <polygon class="ci-scene__lid" :points="lid.edge" />
        <polygon class="ci-scene__lid ci-scene__lid--side" :points="lid.side" />
      </g>

      <g v-bind="part('delivery')">
        <IsoSolid class="ci-solid--vault" :box="VAULT" :project="project" />
        <g :transform="onFront(project, VAULT)">
          <text class="ci-scene__stencil" x="7" y="14">{{ content.vault[0] }}</text>
          <circle class="ci-scene__dial" cx="25" cy="36" r="11" />
          <circle class="ci-scene__dial-core" cx="25" cy="36" r="4" />
          <path class="ci-scene__dial-ticks" d="M25 25.5v3M35.5 36h-3M25 46.5v-3M14.5 36h3" />
          <path class="ci-scene__handle" d="M42 36h11M53 31v10" />
          <text class="ci-scene__engraving" x="7" y="58">{{ content.vault[1] }}</text>
          <g class="ci-scene__lock" :transform="lock">
            <path class="ci-scene__shackle" d="M58 26V21a4 4 0 0 1 8 0v5" />
            <rect class="ci-scene__lock-body" x="56" y="26" width="12" height="10" rx="1.5" />
            <circle class="ci-scene__keyhole" cx="62" cy="31" r="1.3" />
          </g>
        </g>
      </g>

      <g v-bind="part('runner')">
        <IsoSolid class="ci-solid--shell" :box="RUNNER" :project="project" />
        <g :transform="onFront(project, RUNNER)">
          <g v-for="bay in 6" :key="bay">
            <rect
              class="ci-scene__bay"
              :x="4 + (bay - 1) * 9.4"
              y="3.5"
              width="8"
              height="13"
              rx="0.8"
            />
            <line
              class="ci-scene__bay-grip"
              :x1="5.6 + (bay - 1) * 9.4"
              y1="13.6"
              :x2="10.4 + (bay - 1) * 9.4"
              y2="13.6"
            />
            <circle class="ci-scene__led" :cx="10.2 + (bay - 1) * 9.4" cy="5.6" r="0.8" />
          </g>
          <circle class="ci-scene__power" cx="66" cy="10" r="2.2" />
          <circle class="ci-scene__led ci-scene__led--amber" cx="61.6" cy="15" r="0.8" />
        </g>
        <IsoSolid :class="{ 'ci-solid--lit': called }" :box="CARD" :project="project" />
        <g :transform="onTop(project, CARD)">
          <text class="ci-scene__print ci-scene__print--strong" x="4" y="8">
            on {{ content.event }}
          </text>
          <g v-for="(task, i) in content.workflow" :key="task">
            <rect
              v-if="story.ships && marks.current === i"
              class="ci-scene__marker"
              x="2.5"
              :y="9.3 + i * 7"
              width="36"
              height="6.4"
            />
            <text class="ci-scene__print" x="4" :y="14 + i * 7">→ {{ task }}</text>
            <text
              v-if="story.ships && marks.finished.has(i)"
              class="ci-scene__check"
              x="42"
              :y="14 + i * 7"
            >
              ✓
            </text>
          </g>
        </g>
      </g>

      <g v-bind="part('registry')">
        <g v-for="(crate, i) in CRATES" :key="i">
          <IsoSolid
            class="ci-solid--kraft"
            :class="{ 'ci-solid--lit': i === toolCrate && live.has('registry') }"
            :box="crate"
            :project="project"
          />
          <rect
            class="ci-scene__crate-tape"
            :transform="onTop(project, crate)"
            x="0"
            y="11"
            :width="crate.width"
            height="6"
          />
          <g :transform="onFront(project, crate)">
            <rect class="ci-scene__crate-label" x="2" y="7" width="24" height="9" />
            <text class="ci-scene__crate-text" x="14" y="13.2">{{ content.images[i] }}</text>
          </g>
        </g>
      </g>

      <g v-bind="part('project')">
        <IsoSolid :box="SHEET" :project="project" />
        <g :transform="onTop(project, SHEET)">
          <g v-for="(task, i) in content.tasks" :key="task">
            <rect
              v-if="marks.current === i"
              class="ci-scene__marker"
              x="3"
              :y="7.5 + i * 14"
              :width="SHEET.width - 6"
              height="11"
            />
            <text
              class="ci-scene__print ci-scene__print--task"
              :class="{ 'ci-scene__print--strong': marks.current === i }"
              x="5"
              :y="15 + i * 14"
            >
              {{ task }}
            </text>
            <text
              v-if="marks.finished.has(i)"
              class="ci-scene__check ci-scene__check--task"
              :x="SHEET.width - 9"
              :y="15 + i * 14"
            >
              ✓
            </text>
          </g>
        </g>
      </g>

      <g v-bind="part('shared')">
        <IsoSolid
          v-for="(card, i) in CARDS"
          :key="i"
          :class="{ 'ci-solid--lit': i === CARDS.length - 1 && live.has('shared') }"
          :box="card"
          :project="project"
        />
        <g :transform="onTop(project, CARDS[CARDS.length - 1] ?? SHEET)">
          <text class="ci-scene__print ci-scene__print--tool" x="6" y="17">{{ content.tool }}</text>
          <rect class="ci-scene__lines" x="6" y="25" width="30" height="2" />
          <rect class="ci-scene__lines" x="6" y="31" width="24" height="2" />
          <rect class="ci-scene__lines" x="6" y="37" width="28" height="2" />
        </g>
      </g>

      <g v-bind="part('box')">
        <polygon
          v-for="(points, i) in glass.back"
          :key="i"
          class="ci-scene__glass-back"
          :points="points"
        />
        <IsoSolid class="ci-solid--src" :box="CODE" :project="project" />
        <text
          class="ci-scene__print ci-scene__print--src"
          :transform="onTop(project, CODE)"
          x="7"
          y="17"
        >
          {{ content.code }}
        </text>
        <g v-if="copy" :opacity="copy.opacity">
          <IsoSolid class="ci-solid--kraft" :box="copy.box" :project="project" />
        </g>
        <polygon
          v-for="(points, i) in glass.front"
          :key="i"
          class="ci-scene__glass"
          :points="points"
        />
        <polygon
          v-for="(points, i) in glass.front"
          :key="`glow-${i}`"
          class="ci-scene__glow"
          :opacity="glow"
          :points="points"
        />
        <polyline class="ci-scene__rim" :points="glass.rim" />
        <text class="ci-scene__glass-tag" :transform="onFront(project, BOX)" x="5" y="10">
          {{ content.tool }}
        </text>
      </g>

      <g v-bind="piece('box')">
        <g class="ci-scene__drum" :opacity="drum.opacity">
          <path class="ci-scene__drum-side" :d="drum.side" />
          <path v-for="(d, i) in drum.bands" :key="i" class="ci-scene__drum-band" :d="d" />
          <ellipse
            class="ci-scene__drum-top"
            :cx="drum.cx"
            :cy="drum.top"
            :rx="drum.rx"
            :ry="drum.ry"
          />
          <ellipse
            class="ci-scene__drum-glow"
            :cx="drum.cx"
            :cy="drum.top"
            :rx="drum.rx"
            :ry="drum.ry"
            :opacity="glow * 2.2"
          />
          <text class="ci-scene__drum-text" :x="drum.cx" :y="drum.top + 13.4">
            {{ content.cache }}
          </text>
        </g>
        <g :opacity="dist.opacity">
          <IsoSolid class="ci-solid--kraft" :box="dist.box" :project="project" />
          <polygon class="ci-scene__glow" :points="distTop" :opacity="pickup" />
          <text
            class="ci-scene__print ci-scene__print--small"
            :transform="onTop(project, dist.box)"
            x="2.5"
            y="12"
          >
            {{ content.result }}
          </text>
        </g>
      </g>

      <g
        v-for="(dot, i) in tokens"
        :key="i"
        :class="`ci-scene__dot ci-scene__dot--${dot.tone}`"
        :transform="`translate(${dot.point[0].toFixed(1)} ${dot.point[1].toFixed(1)})`"
      >
        <circle class="ci-scene__token" r="5" />
        <text v-if="dot.label" class="ci-scene__token-label" x="8" y="-5">
          {{ dot.label }}
        </text>
      </g>

      <g v-bind="part('gate')">
        <IsoSolid class="ci-solid--steel" :box="POST" :project="project" />
        <line class="ci-scene__arm ci-scene__arm--edge" v-bind="arm" />
        <line class="ci-scene__arm" v-bind="arm" />
        <line class="ci-scene__arm ci-scene__arm--stripes" v-bind="arm" />
      </g>

      <g
        v-for="label in zoom ? [] : labels"
        :key="label.id"
        class="ci-scene__part ci-scene__label-hit"
        :class="state(label.id)"
        aria-hidden="true"
        @click="emit('select', label.id)"
      >
        <rect
          class="ci-scene__label-tag"
          :x="label.left"
          :y="label.y - 10"
          :width="label.width"
          height="14"
          rx="2"
        />
        <text class="ci-scene__label" :x="label.left + label.width / 2" :y="label.y">
          {{ label.text }}
        </text>
      </g>
      <g
        v-for="decal in zoom ? [] : decals"
        :key="decal.id"
        class="ci-scene__part ci-scene__label-hit"
        :class="state(decal.id)"
        :transform="decal.transform"
        aria-hidden="true"
        @click="emit('select', decal.id)"
      >
        <rect class="ci-scene__label-tag" :width="decal.width" :height="DECAL.depth" rx="1.5" />
        <text
          class="ci-scene__label ci-scene__label--decal"
          :x="decal.width / 2"
          :y="DECAL.depth / 2 + 2.3"
        >
          {{ decal.text }}
        </text>
      </g>
    </svg>
  </div>
</template>
