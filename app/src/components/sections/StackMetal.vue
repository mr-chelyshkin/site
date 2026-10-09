<script setup lang="ts">
import { computed, inject, ref, useId, watch } from 'vue'
import rackFront from '@/assets/images/stack-rack.webp'
import { blinkStyle } from '@/utils/blink'
import {
  boxFaces,
  planeTransform,
  svgPoints,
  type Box,
  type BoxFaces,
  type Projector,
  type Vec3,
} from '@/utils/isometric'
import { DOWN, LANDINGS, LOOP, downness, phase, storyClock } from '@/utils/stack-story'

/**
 * The bottom plate as what it stands for: three 1U servers racked one on
 * another, their front the photograph of a real rack, the rest drawn as a
 * technical illustration. The top server's lid lifts off and fades as the
 * stack comes apart, and shows what's inside: the board with
 * its processors and memory, the power supply, the fans and the drive cage.
 * As the story plays (stack-story.ts), the top server is the one whose node
 * goes down: its fans spin down and its fault light comes on, and they spin up
 * again as work lands on it. Every server's lights blink, and flash as work
 * lands on its node.
 */
const props = defineProps<{
  project: Projector
  /** The back corner of the chassis top, in world units. */
  origin: Vec3
  width: number
  depth: number
  /** Three servers tall, the front photo's height at the chassis width. */
  height: number
  /** 0 with the lid on, 1 with it lifted off: it follows the explode. */
  rise: number
}>()

const X: Vec3 = [1, 0, 0]
const Y: Vec3 = [0, 1, 0]
const DOWNWARD: Vec3 = [0, 0, -1]

// In chassis units: u from the left side, v from the back, z up from the
// rack's bottom. Sheet steel is WALL thick.
const WALL = 2
// How far the lid lifts off.
const LIFT = 30
const FAN = { u: 18, pitch: 46, v: 152, size: 28, depth: 24, count: 7 }
// A fan blade from the hub out, pointing right; five turn round the fan's middle.
const BLADE = 'M4 0C7-4 10-5 12-3L12 1C9 0 7 1 4 2Z'
const REVS = 1.2
// Grain like the photo's, for the drawn steel to wear: fractal noise in gray,
// a fifth opaque, tiled.
const GRAIN = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 .2'/></filter><rect width='96' height='96' filter='url(#n)'/></svg>",
)}`
const id = useId()
const ids = { grain: `${id}-grain`, side: `${id}-side`, lid: `${id}-lid` }

// Where the photo has each server's lights, in units of the front: its row,
// the two lit ones at the right, and the fault light beside them.
const ROWS = [13.7, 47.8, 83] as const
const LIT = [306.6, 314.8] as const
const FAULT = 298.3
// Where the photo's hostname stickers are, blurred, in units of the front:
// the middle of each, which takes its server's name.
const STICKERS = [
  [120.7, 10.2],
  [119.2, 45.6],
  [88.1, 80.8],
] as const
// srv1 to srv3, the nodes at the front of the runtime plate, run on the
// servers shown, top to bottom; the others on the rest of the rack, out of the
// picture. srv1, the node that goes down, is the open top server.
const SERVER_OF: Partial<Record<number, number>> = { 3: 0, 4: 1, 5: 2 }
const serverOf = (node: number) => SERVER_OF[node] ?? -1
const OPEN = serverOf(DOWN)

type MarkTag = 'line' | 'rect' | 'circle' | 'path' | 'polyline'
interface Mark {
  tag: MarkTag
  attrs: Record<string, string | number>
}
/** Marks drawn flat on a face, in that face's own units. */
interface Marks {
  transform: string
  marks: Mark[]
}
interface Solid {
  key: string
  material: string
  faces: BoxFaces
  marks: Marks[]
}

const mark = (tag: MarkTag, kind: string, attrs: Record<string, string | number>): Mark => ({
  tag,
  attrs: { class: `stack__mark stack__mark--${kind}`, ...attrs },
})
const range = (count: number, from: number, step: number) =>
  Array.from({ length: count }, (_, i) => from + i * step)

// Everything that holds still, built once: it paints in two passes, the open
// server's insides first, then what stands in front of them.
const chassis = computed(() => {
  const [x0, y0, top] = props.origin
  const { width: w, depth: d, height: h } = props
  const base = top - h
  const unit = h / 3
  const floor = h - unit + WALL
  const board = floor + 1.5

  const box = (u: number, v: number, z: number, du: number, dv: number, dz: number): Box => ({
    x: x0 + u,
    y: y0 + v,
    z: base + z,
    width: du,
    depth: dv,
    height: dz,
  })
  const at = (u: number, v: number, z: number, a: Vec3, b: Vec3) =>
    planeTransform(props.project, [x0 + u, y0 + v, base + z], a, b)
  const onTop = (b: Box) => planeTransform(props.project, [b.x, b.y, b.z + b.height], X, Y)
  const onFront = (b: Box) =>
    planeTransform(props.project, [b.x, b.y + b.depth, b.z + b.height], X, DOWNWARD)
  const onRight = (b: Box) =>
    planeTransform(props.project, [b.x + b.width, b.y, b.z + b.height], Y, DOWNWARD)
  const solid = (key: string, material: string, b: Box, marks: Marks[] = []): Solid => ({
    key,
    material,
    faces: boxFaces(props.project, b),
    marks,
  })

  const mother = box(10, 20, floor, 246, 130, 1.5)
  const heatsink = (u: number) => {
    const b = box(u, 96, board, 48, 48, 22)
    const fins = range(11, 4, 4)
    return solid(`cpu-${u}`, 'alu', b, [
      {
        transform: onTop(b),
        marks: fins.map((x) => mark('line', 'fin', { x1: x, y1: 2, x2: x, y2: 46 })),
      },
      {
        transform: onFront(b),
        marks: fins.map((x) => mark('line', 'fin', { x1: x, y1: 1, x2: x, y2: 21 })),
      },
    ])
  }
  const dimm = (u: number) => {
    const b = box(u, 88, board, 2.6, 60, 22)
    return solid(`dimm-${u}`, 'dimm', b, [
      {
        transform: onRight(b),
        marks: range(4, 6, 14).map((x) => mark('rect', 'chip', { x, y: 5, width: 9, height: 9 })),
      },
    ])
  }
  const chipset = box(190, 60, board, 16, 16, 5)
  const connector = box(226, 138, board, 18, 8, 6)
  const psu = box(262, 8, floor, 72, 122, 30)
  const fan = (k: number) => box(FAN.u + k * FAN.pitch, FAN.v, floor, FAN.size, FAN.depth, FAN.size)
  const cage = box(8, 200, floor, w - 16, 36, 24)

  // Back to front, left to right, so nearer parts paint over further ones.
  const parts: Solid[] = [
    solid('board', 'pcb', mother, [
      {
        transform: onTop(mother),
        marks: [
          ...[30, 34, 38].map((y, i) =>
            mark('polyline', 'trace', { points: `${110 + i * 4},${y} ${110 + i * 4},80 150,80` }),
          ),
          ...[124, 127].map((y) => mark('line', 'trace', { x1: 60, y1: y, x2: 176, y2: y })),
          ...[78, 84, 90, 156, 162, 168].map((y, i) =>
            mark('circle', 'cap', { cx: i < 3 ? 44 : 166, cy: y - 0 + (i < 3 ? 0 : -78), r: 1.8 }),
          ),
          ...range(4, 14, 8).map((x) => mark('rect', 'port', { x, y: 112, width: 6, height: 4 })),
        ],
      },
    ]),
    ...[34, 41, 48].map(dimm),
    heatsink(60),
    ...[116, 123, 130, 156, 163, 170].map(dimm),
    solid('chipset', 'alu', chipset, [
      {
        transform: onTop(chipset),
        marks: range(4, 3, 3.4).map((x) => mark('line', 'fin', { x1: x, y1: 2, x2: x, y2: 14 })),
      },
    ]),
    heatsink(180),
    ...[236, 243].map(dimm),
    solid('connector', 'plastic', connector),
    solid('psu', 'psu', psu, [
      {
        transform: onTop(psu),
        marks: [
          ...range(9, 8, 7).flatMap((y, r) =>
            range(9, 6 + (r % 2) * 3.7, 7.5).map((x) =>
              mark('circle', 'vent', { cx: x, cy: y, r: 1.6 }),
            ),
          ),
          mark('rect', 'warning', { x: 14, y: 82, width: 44, height: 28 }),
          mark('path', 'sign', { d: 'M22 104L28 92L34 104Z' }),
          ...range(3, 88, 6).map((y) => mark('line', 'bar', { x1: 40, y1: y, x2: 54, y2: y })),
        ],
      },
      {
        transform: onFront(psu),
        marks: [mark('rect', 'port', { x: 6, y: 15, width: 14, height: 9 })],
      },
    ]),
  ]
  // On the floor between the power supply and the fans: the power leads and
  // the drives' data cables.
  const cables = {
    transform: at(0, 0, floor + 0.6, X, Y),
    leads: [
      { color: 'yellow', d: 'M270 131C266 140 250 138 236 140' },
      { color: 'black', d: 'M274 131C270 143 252 142 238 142.5' },
      { color: 'red', d: 'M278 131C275 146 254 146 240 145' },
      { color: 'red', d: 'M14 200C14 176 16 150 17 133' },
      { color: 'red', d: 'M22 200C22 178 23 152 25 133' },
    ],
  }
  const fans = range(FAN.count, 0, 1).map((k) => {
    const b = fan(k)
    const corners = [3, 25].flatMap((x) => [3, 25].map((y) => [x, y] as const))
    return solid(`fan-${k}`, 'plastic', b, [
      {
        transform: onFront(b),
        marks: [
          mark('circle', 'opening', { cx: 14, cy: 14, r: 12.5 }),
          ...corners.map(([x, y]) => mark('circle', 'screw', { cx: x, cy: y, r: 1.1 })),
        ],
      },
    ])
  })
  const drives = solid('cage', 'steel', cage, [
    {
      transform: onTop(cage),
      marks: [
        ...[81, 162, 243].map((x) => mark('line', 'divider', { x1: x, y1: 0, x2: x, y2: 36 })),
        ...range(4, 0, 81).flatMap((bay) =>
          [8, 22].flatMap((y) =>
            range(8, bay + 10, 8).map((x) => mark('rect', 'vent', { x, y, width: 4, height: 3 })),
          ),
        ),
      ],
    },
  ])

  return {
    unit,
    inner: { width: w - 2 * WALL, depth: d - 2 * WALL, height: h - floor },
    // The open server's floor, and the inner faces of its back and left walls.
    floor: at(WALL, WALL, floor, X, Y),
    back: at(WALL, WALL, h, X, DOWNWARD),
    left: at(WALL, WALL, h, Y, DOWNWARD),
    parts,
    cables,
    fans,
    blades: range(FAN.count, 0, 1).map((k) => onFront(fan(k))),
    drives,
    // A side panel for each server, top first, the front, and the top rim of
    // the open server's walls.
    sides: [0, 1, 2].map((k) => at(w, 0, h - k * unit, Y, DOWNWARD)),
    front: at(0, d, h, X, DOWNWARD),
    rim: at(0, 0, h, X, Y),
  }
})

const lid = computed(() => {
  const [x0, y0, top] = props.origin
  const lift = LIFT * props.rise
  const b: Box = {
    x: x0,
    y: y0,
    z: top + lift,
    width: props.width,
    depth: props.depth,
    height: WALL,
  }
  return {
    faces: boxFaces(props.project, b),
    top: planeTransform(props.project, [x0, y0, top + lift + WALL], X, Y),
    // The lid on is solid; lifting, it fades away.
    solid: 1 - props.rise,
  }
})

const time = inject(storyClock, ref(0))
const t = computed(() => time.value % LOOP)

// A flash that fades over a second from the moment work lands on the server.
const landing = (server: number, now: number) =>
  Math.max(
    0,
    ...LANDINGS.filter(({ node }) => serverOf(node) === server).map(({ at }) => {
      const p = phase(now, at, 0.9)
      return p > 0 && p < 1 ? 1 - p : 0
    }),
  )

const servers = computed(() =>
  ROWS.map((row, server) => ({
    row,
    down: server === OPEN && downness(t.value) > 0.5,
    landing: landing(server, t.value),
  })),
)

// The open server's fans turn as fast as it's up, and faster as work lands.
const angle = ref(0)
watch(time, (now, before) => {
  const step = now - before
  if (step <= 0 || step > 0.25) return
  const at = now % LOOP
  const speed = REVS * (1 - downness(at)) * (1 + landing(OPEN, at))
  angle.value = (angle.value + step * speed * 360) % 360
})
</script>

<template>
  <g class="stack__metal">
    <defs>
      <pattern :id="ids.grain" patternUnits="userSpaceOnUse" width="96" height="96">
        <image :href="GRAIN" width="96" height="96" />
      </pattern>
      <!-- The steel lit from the front: darker toward the back, and the lid
           toward its far corner. -->
      <linearGradient :id="ids.side">
        <stop class="stack__stop stack__stop--far" offset="0" />
        <stop class="stack__stop stack__stop--near" offset="1" />
      </linearGradient>
      <linearGradient :id="ids.lid" x2="1" y2="1">
        <stop class="stack__stop stack__stop--far" offset="0" />
        <stop class="stack__stop stack__stop--lit" offset="1" />
      </linearGradient>
    </defs>
    <!-- Inside the open server: floor, walls, parts, cables, fans. -->
    <g v-memo="[chassis]">
      <rect
        class="stack__mat stack__mat--floor"
        :transform="chassis.floor"
        :width="chassis.inner.width"
        :height="chassis.inner.depth"
      />
      <g :transform="chassis.back">
        <rect
          class="stack__mat stack__mat--wall"
          :width="chassis.inner.width"
          :height="chassis.inner.height"
        />
        <rect class="stack__mark stack__mark--port" x="206" y="12" width="14" height="7" />
        <rect class="stack__mark stack__mark--port" x="224" y="12" width="6" height="7" />
        <rect class="stack__mark stack__mark--port" x="234" y="12" width="6" height="7" />
        <rect class="stack__mark stack__mark--port" x="244" y="10" width="10" height="10" />
      </g>
      <rect
        class="stack__mat stack__mat--wall-side"
        :transform="chassis.left"
        :width="chassis.inner.depth"
        :height="chassis.inner.height"
      />
      <template
        v-for="part in [...chassis.parts, null, ...chassis.fans]"
        :key="part?.key ?? 'cables'"
      >
        <g v-if="part" class="stack__solid" :class="`stack__solid--${part.material}`">
          <polygon class="stack__solid-right" :points="svgPoints(part.faces.right)" />
          <polygon class="stack__solid-front" :points="svgPoints(part.faces.front)" />
          <polygon class="stack__solid-top" :points="svgPoints(part.faces.top)" />
          <g v-for="(face, i) in part.marks" :key="i" :transform="face.transform">
            <component :is="m.tag" v-for="(m, j) in face.marks" :key="j" v-bind="m.attrs" />
          </g>
        </g>
        <g v-else :transform="chassis.cables.transform">
          <path
            v-for="(lead, i) in chassis.cables.leads"
            :key="i"
            class="stack__cable"
            :class="`stack__cable--${lead.color}`"
            :d="lead.d"
          />
        </g>
      </template>
    </g>

    <!-- The fan blades turning, each fan's five as one, so a frame moves
         seven groups rather than thirty-five blades. -->
    <g v-for="(transform, k) in chassis.blades" :key="k" :transform="transform">
      <g :transform="`translate(14 14) rotate(${angle.toFixed(1)})`">
        <path
          v-for="j in 5"
          :key="j"
          class="stack__blade"
          :d="BLADE"
          :transform="`rotate(${j * 72})`"
        />
      </g>
      <circle class="stack__hub" cx="14" cy="14" r="4" />
    </g>

    <!-- In front of the insides: the drive cage, the side panels, the front
         photo with its rack ears, and the rim of the open server's walls. -->
    <g v-memo="[chassis]">
      <g class="stack__solid stack__solid--steel">
        <polygon class="stack__solid-right" :points="svgPoints(chassis.drives.faces.right)" />
        <polygon class="stack__solid-front" :points="svgPoints(chassis.drives.faces.front)" />
        <polygon class="stack__solid-top" :points="svgPoints(chassis.drives.faces.top)" />
        <g v-for="(face, i) in chassis.drives.marks" :key="i" :transform="face.transform">
          <component :is="m.tag" v-for="(m, j) in face.marks" :key="j" v-bind="m.attrs" />
        </g>
      </g>

      <g v-for="(transform, k) in chassis.sides" :key="k" :transform="transform">
        <rect
          class="stack__mat stack__mat--side"
          :fill="`url(#${ids.side})`"
          :width="depth"
          :height="chassis.unit"
        />
        <rect
          class="stack__grain"
          :fill="`url(#${ids.grain})`"
          :width="depth"
          :height="chassis.unit"
        />
        <rect
          v-if="k < 2"
          class="stack__mat stack__mat--gap"
          :y="chassis.unit - 1"
          :width="depth"
          height="1"
        />
        <rect
          class="stack__mat stack__mat--rail"
          x="10"
          y="13"
          :width="depth - 20"
          height="9"
          rx="1.5"
        />
        <rect
          v-for="i in 9"
          :key="i"
          class="stack__mat stack__mat--hole"
          :x="i * 24 - 6"
          y="15.5"
          width="12"
          height="4"
          rx="2"
        />
      </g>

      <g :transform="chassis.front">
        <image :href="rackFront" :width="width" :height="height" preserveAspectRatio="none" />
        <line
          v-for="k in 2"
          :key="k"
          class="stack__seam"
          x1="0"
          :y1="chassis.unit * k"
          :x2="width"
          :y2="chassis.unit * k"
        />
        <text v-for="([x, y], k) in STICKERS" :key="k" class="stack__sticker" :x="x" :y="y">
          srv{{ k + 1 }}
        </text>
        <rect class="stack__metal-edge" :width="width" :height="height" />
        <g v-for="k in 3" :key="k">
          <template v-for="side in [-12, width]" :key="side">
            <rect
              class="stack__mat stack__mat--ear"
              :x="side"
              :y="(k - 1) * chassis.unit + 1"
              width="12"
              :height="chassis.unit - 2"
            />
            <circle
              v-for="y in [7, chassis.unit - 7]"
              :key="y"
              class="stack__mat stack__mat--hole"
              :cx="side + 6"
              :cy="(k - 1) * chassis.unit + y"
              r="1.7"
            />
          </template>
        </g>
      </g>

      <path
        class="stack__mat stack__mat--rim"
        :transform="chassis.rim"
        :d="`M0 0H${width}V${depth}H0Z M2 2V${depth - 2}H${width - 2}V2Z`"
      />
    </g>

    <!-- Lights over the photo's own. -->
    <g :transform="chassis.front">
      <g v-for="(server, i) in servers" :key="i">
        <template v-if="!server.down">
          <g
            v-for="(x, j) in LIT"
            :key="j"
            class="stack__led stack__led--activity"
            :style="blinkStyle(i * 2 + j)"
          >
            <circle class="stack__led-glow" :cx="x" :cy="server.row" r="4.5" />
            <circle class="stack__led-core" :cx="x" :cy="server.row" r="1.6" />
          </g>
        </template>
        <g v-else class="stack__led stack__led--fault">
          <circle class="stack__led-glow" :cx="FAULT" :cy="server.row" r="4.5" />
          <circle class="stack__led-core" :cx="FAULT" :cy="server.row" r="1.6" />
        </g>
        <g v-if="server.landing" class="stack__led stack__led--landing" :opacity="server.landing">
          <circle class="stack__led-glow" :cx="LIT[1]" :cy="server.row" r="9" />
          <circle class="stack__led-core" :cx="LIT[1]" :cy="server.row" r="2.2" />
        </g>
      </g>
    </g>

    <!-- The lid: sheet steel with its screws and label, fading as it lifts. -->
    <g v-if="lid.solid > 0.01" class="stack__solid stack__solid--shell" :opacity="lid.solid">
      <polygon class="stack__solid-right" :points="svgPoints(lid.faces.right)" />
      <polygon class="stack__solid-front" :points="svgPoints(lid.faces.front)" />
      <polygon
        class="stack__painted"
        :fill="`url(#${ids.lid})`"
        :points="svgPoints(lid.faces.top)"
      />
      <polygon
        class="stack__grain"
        :fill="`url(#${ids.grain})`"
        :points="svgPoints(lid.faces.top)"
      />
      <g :transform="lid.top">
        <circle
          v-for="([cx, cy], i) in [
            [8, 8],
            [width - 8, 8],
            [8, depth - 8],
            [width - 8, depth - 8],
          ]"
          :key="i"
          class="stack__mark stack__mark--screw"
          :cx="cx"
          :cy="cy"
          r="2"
        />
        <rect
          class="stack__mark stack__mark--label"
          x="24"
          :y="depth - 70"
          width="96"
          height="40"
        />
        <line
          v-for="i in 19"
          :key="i"
          class="stack__mark stack__mark--bar"
          :x1="28 + i * 2.4"
          :y1="depth - 62"
          :x2="28 + i * 2.4"
          :y2="depth - 44"
        />
      </g>
    </g>
  </g>
</template>
