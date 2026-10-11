<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { blinkStyle } from '@/utils/blink'
import {
  X,
  Y,
  boxFaces,
  onFront,
  onTop,
  planeTransform,
  svgPoints,
  type Point,
  type Projector,
  type Vec3,
} from '@/utils/isometric'
import {
  CONTROL_PLANE,
  DOWN,
  FAIL,
  FINISH,
  LANDINGS,
  LOOP,
  SPARE,
  downness,
  inFlight,
  nodeName,
  phase,
  smooth,
  storyClock,
} from '@/utils/stack-story'

const props = defineProps<{
  project: Projector
  origin: Vec3
  rise: number
  hatch: string
}>()

const CONTROL = CONTROL_PLANE
const NODE = { width: 46, depth: 50, height: 14 }
const COLUMNS = [104, 158, 212] as const
const ROWS = [26, 116] as const
const SPINE = 96
const POD = { size: 12, height: 9 }
const SLOTS = [
  [7, 8],
  [26, 8],
  [7, 29],
  [26, 29],
] as const
const PODS = [2, 1, 2, 1, 2, 1] as const

const [TO_SPARE, TO_DOWN] = LANDINGS

const center = (node: number) => COLUMNS[node % 3] + NODE.width / 2
const route = (node: number): Point[] => [
  [CONTROL.u + CONTROL.width, SPINE],
  [center(node), SPINE],
  [center(node), node < 3 ? ROWS[0] + NODE.depth : ROWS[1]],
]
const WIRES: Point[][] = [
  route(SPARE).slice(0, 2),
  ...Array.from({ length: 6 }, (_, node) => route(node).slice(1)),
]

const along = (points: Point[], t: number): Point => {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]))
  let left = t * lengths.reduce((sum, length) => sum + length, 0)
  for (const [i, length] of lengths.entries()) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    if (left <= length) return [x0 + ((x1 - x0) * left) / length, y0 + ((y1 - y0) * left) / length]
    left -= length
  }
  return points[points.length - 1]
}

const time = inject(storyClock, ref(0))
const t = computed(() => time.value % LOOP)

const standing = (u: number, v: number, width: number, depth: number, height: number, base = 0) => {
  const [x, y, z] = props.origin
  return { x: x + u, y: y + v, z: z + base, width, depth, height }
}
const surface = computed(() => planeTransform(props.project, props.origin, X, Y))

const sending = computed(() =>
  inFlight(t.value).map(({ node, at }) => ({
    node,
    path: route(node),
    at: along(route(node), smooth(at)),
  })),
)

const control = computed(() => {
  const box = standing(
    CONTROL.u,
    CONTROL.v,
    CONTROL.width,
    CONTROL.depth,
    CONTROL.height * props.rise,
  )
  return {
    faces: boxFaces(props.project, box),
    top: onTop(props.project, box),
    front: onFront(props.project, box),
  }
})

const podsOn = (node: number) => {
  const now = t.value
  const pods = Array.from({ length: PODS[node] }, (_, slot) => ({ slot, size: 1, fresh: false }))
  if (node === DOWN)
    pods[0] = {
      slot: 0,
      size: 1 - smooth(phase(now, FAIL, 0.4)) + smooth(phase(now, TO_DOWN.at, 0.3)),
      fresh: now >= TO_DOWN.at && now < TO_DOWN.at + 1.5,
    }
  if (node === SPARE)
    pods.push({
      slot: PODS[node],
      size: smooth(phase(now, TO_SPARE.at, 0.3)) - smooth(phase(now, FINISH, 0.4)),
      fresh: now >= TO_SPARE.at && now < TO_SPARE.at + 1.6,
    })
  return pods.filter(({ size }) => size > 0.02)
}

const nodes = computed(() => {
  const down = downness(t.value)
  return Array.from({ length: 6 }, (_, node) => {
    const u = COLUMNS[node % 3]
    const v = ROWS[node < 3 ? 0 : 1]
    const height = NODE.height * props.rise
    const box = standing(u, v, NODE.width, NODE.depth, height)
    const pods = podsOn(node).map(({ slot, size, fresh }) => {
      const [su, sv] = SLOTS[slot]
      const pod = standing(
        u + su,
        v + sv,
        POD.size,
        POD.size,
        POD.height * props.rise * size,
        height,
      )
      return { slot, fresh, faces: boxFaces(props.project, pod) }
    })
    return {
      node,
      depth: u + v,
      faces: boxFaces(props.project, box),
      top: onTop(props.project, box),
      front: onFront(props.project, box),
      down: node === DOWN ? down : 0,
      pods,
    }
  }).sort((a, b) => a.depth - b.depth)
})
</script>

<template>
  <g class="stack__runtime">
    <g :transform="surface">
      <polyline v-for="(wire, i) in WIRES" :key="i" class="stack__wire" :points="svgPoints(wire)" />
      <g v-for="send in sending" :key="send.node">
        <polyline class="stack__wire stack__wire--live" :points="svgPoints(send.path)" />
        <rect
          class="stack__token"
          x="-4"
          y="-4"
          width="8"
          height="8"
          :transform="`translate(${send.at[0].toFixed(1)} ${send.at[1].toFixed(1)}) rotate(45)`"
        />
      </g>
    </g>

    <g class="stack__box">
      <polygon
        class="stack__box-face stack__box-face--side"
        :points="svgPoints(control.faces.right)"
        :fill="`url(#${hatch})`"
      />
      <polygon
        class="stack__box-face stack__box-face--front"
        :points="svgPoints(control.faces.front)"
      />
      <polygon
        class="stack__box-face stack__box-face--top"
        :points="svgPoints(control.faces.top)"
      />
      <g :transform="control.top">
        <text class="stack__label" x="7" y="14">CONTROL</text>
        <text class="stack__label" x="7" y="23">PLANE</text>
        <circle
          v-for="k in 3"
          :key="k"
          class="stack__replica"
          :class="{ 'stack__replica--leader': k === 1 }"
          :cx="2 + k * 14"
          cy="44"
          r="4.5"
        />
      </g>
      <g v-if="rise > 0.6" :transform="control.front">
        <circle
          v-for="k in 3"
          :key="k"
          class="stack__light"
          :style="blinkStyle(k)"
          :cx="CONTROL.width - 7 * k"
          :cy="(CONTROL.height * rise) / 2"
          r="2"
        />
      </g>
    </g>

    <g v-for="n in nodes" :key="n.node" class="stack__box">
      <polygon
        class="stack__box-face stack__box-face--side"
        :points="svgPoints(n.faces.right)"
        :fill="`url(#${hatch})`"
      />
      <polygon class="stack__box-face stack__box-face--front" :points="svgPoints(n.faces.front)" />
      <polygon class="stack__box-face stack__box-face--top" :points="svgPoints(n.faces.top)" />
      <g v-if="n.down" :opacity="n.down">
        <polygon
          class="stack__box-face"
          :points="svgPoints(n.faces.top)"
          :fill="`url(#${hatch})`"
        />
        <path
          class="stack__fault"
          :transform="n.top"
          :d="`M9 9L${NODE.width - 9} ${NODE.depth - 9}M${NODE.width - 9} 9L9 ${NODE.depth - 9}`"
        />
      </g>
      <circle
        v-if="rise > 0.6"
        class="stack__light"
        :class="{ 'stack__light--off': n.down > 0.5 }"
        :transform="n.front"
        :style="blinkStyle(n.node + 3)"
        :cx="NODE.width - 7"
        :cy="(NODE.height * rise) / 2"
        r="2"
      />
      <text
        v-if="rise > 0.6"
        class="stack__label"
        :transform="n.front"
        x="5"
        :y="(NODE.height * rise) / 2 + 2.5"
      >
        {{ nodeName(n.node).toUpperCase() }}
      </text>
      <g
        v-for="pod in n.pods"
        :key="pod.slot"
        class="stack__pod"
        :class="{ 'stack__pod--fresh': pod.fresh }"
      >
        <polygon
          class="stack__box-face stack__box-face--shade"
          :points="svgPoints(pod.faces.right)"
        />
        <polygon
          class="stack__box-face stack__box-face--front"
          :points="svgPoints(pod.faces.front)"
        />
        <polygon class="stack__box-face stack__box-face--top" :points="svgPoints(pod.faces.top)" />
      </g>
    </g>
  </g>
</template>
