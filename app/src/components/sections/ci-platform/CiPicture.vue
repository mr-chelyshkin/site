<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import PastedSheet from '@/components/ui/PastedSheet.vue'
import CiReplay from '@/components/sections/ci-platform/CiReplay.vue'
import { usePlayback } from '@/composables/usePlayback'
import type { CiPlatformContent } from '@/contents'

const props = defineProps<{
  content: CiPlatformContent['picture']['scheme']
  steps: CiPlatformContent['picture']['steps']
  replayLabel: string
  tocLabel: string
}>()

type NodeId =
  'registry' | 'shared' | 'project' | 'laptop' | 'runner' | 'box' | 'result' | 'delivery'
type RouteId = 'laptop' | 'runner' | 'delivery'
type LayoutName = 'wide' | 'tall'

interface Box {
  x: number
  y: number
  w: number
  h: number
}

interface Layout {
  name: LayoutName
  viewBox: string
  pad: number
  tag: { step: number; h: number }
  boxes: Record<NodeId, Box>
  edges: { d: string; from: number; blocked?: boolean }[]
  gate: { x1: number; y1: number; x2: number; y2: number; tx: number; ty: number }
  stop: { x: number; y: number }
  badges: { n: string; x: number; y: number; from: number }[]
  routes: Record<RouteId, string>
}

const LAYOUTS: Layout[] = [
  {
    name: 'wide',
    viewBox: '0 0 1060 560',
    pad: 16,
    tag: { step: 34, h: 26 },
    boxes: {
      registry: { x: 840, y: 30, w: 200, h: 150 },
      shared: { x: 610, y: 262, w: 200, h: 82 },
      project: { x: 330, y: 262, w: 220, h: 82 },
      laptop: { x: 30, y: 196, w: 230, h: 80 },
      runner: { x: 30, y: 330, w: 230, h: 80 },
      box: { x: 860, y: 252, w: 180, h: 102 },
      result: { x: 875, y: 404, w: 150, h: 46 },
      delivery: { x: 600, y: 440, w: 230, h: 82 },
    },
    edges: [
      { d: 'M550 303 L 610 303', from: 3 },
      { d: 'M260 236 C 300 236, 290 290, 330 290', from: 4 },
      { d: 'M260 370 C 300 370, 290 318, 330 318', from: 4 },
      { d: 'M810 303 L 860 303', from: 5 },
      { d: 'M950 180 L 950 252', from: 5 },
      { d: 'M950 354 L 950 404', from: 6 },
      { d: 'M260 392 C 380 470, 480 481, 600 481', from: 7 },
      { d: 'M230 276 C 290 330, 300 430, 546 462', from: 7, blocked: true },
    ],
    gate: { x1: 560, y1: 420, x2: 560, y2: 540, tx: 568, ty: 536 },
    stop: { x: 536, y: 474 },
    badges: [
      { n: '01', x: 840, y: 30, from: 1 },
      { n: '02', x: 610, y: 262, from: 2 },
      { n: '03', x: 330, y: 262, from: 3 },
      { n: '04', x: 30, y: 196, from: 4 },
      { n: '05', x: 560, y: 420, from: 7 },
    ],
    routes: {
      laptop: 'M260 236 C 300 236, 290 290, 330 290 L 550 303 L 610 303 L 810 303 L 860 303',
      runner: 'M260 370 C 300 370, 290 318, 330 318 L 550 303 L 610 303 L 810 303 L 860 303',
      delivery: 'M260 392 C 380 470, 480 481, 600 481',
    },
  },
  {
    name: 'tall',
    viewBox: '0 0 380 690',
    pad: 12,
    tag: { step: 28, h: 22 },
    boxes: {
      laptop: { x: 20, y: 20, w: 160, h: 70 },
      runner: { x: 200, y: 20, w: 160, h: 70 },
      project: { x: 70, y: 140, w: 240, h: 64 },
      shared: { x: 70, y: 254, w: 240, h: 64 },
      registry: { x: 20, y: 368, w: 150, h: 124 },
      box: { x: 200, y: 368, w: 160, h: 80 },
      result: { x: 210, y: 478, w: 140, h: 40 },
      delivery: { x: 110, y: 600, w: 220, h: 70 },
    },
    edges: [
      { d: 'M190 204 L 190 254', from: 3 },
      { d: 'M100 90 C 100 115, 150 115, 150 140', from: 4 },
      { d: 'M280 90 C 280 115, 230 115, 230 140', from: 4 },
      { d: 'M250 318 C 250 345, 280 345, 280 368', from: 5 },
      { d: 'M170 410 L 200 410', from: 5 },
      { d: 'M280 448 L 280 478', from: 6 },
      { d: 'M360 60 C 372 60, 372 80, 372 110 L 372 610 C 372 628, 352 635, 330 635', from: 7 },
      { d: 'M20 60 C 8 60, 8 80, 8 110 L 8 556', from: 7, blocked: true },
    ],
    gate: { x1: 4, y1: 572, x2: 376, y2: 572, tx: 214, ty: 592 },
    stop: { x: 0, y: 568 },
    badges: [
      { n: '01', x: 20, y: 368, from: 1 },
      { n: '02', x: 70, y: 254, from: 2 },
      { n: '03', x: 70, y: 140, from: 3 },
      { n: '04', x: 20, y: 20, from: 4 },
      { n: '05', x: 190, y: 572, from: 7 },
    ],
    routes: {
      laptop:
        'M100 90 C 100 115, 150 115, 150 140 L 190 204 L 190 254 L 250 318 C 250 345, 280 345, 280 368',
      runner:
        'M280 90 C 280 115, 230 115, 230 140 L 190 204 L 190 254 L 250 318 C 250 345, 280 345, 280 368',
      delivery: 'M360 60 C 372 60, 372 80, 372 110 L 372 610 C 372 628, 352 635, 330 635',
    },
  },
]

const nodes = computed(() => [
  {
    id: 'registry' as const,
    from: 1,
    title: props.content.registry.title,
    detail: '',
    small: false,
  },
  { id: 'shared' as const, from: 2, ...props.content.shared, small: false },
  { id: 'project' as const, from: 3, ...props.content.project, small: false },
  { id: 'laptop' as const, from: 4, ...props.content.laptop, small: false },
  { id: 'runner' as const, from: 4, ...props.content.runner, small: false },
  { id: 'box' as const, from: 5, ...props.content.box, small: true },
  { id: 'result' as const, from: 6, title: '', detail: props.content.result, small: false },
  { id: 'delivery' as const, from: 7, ...props.content.delivery, small: true },
])

const root = ref<HTMLElement | null>(null)
const { frame, replay, reduced } = usePlayback(root, 7, 1100)
const at = (n: number) => frame.value >= n

const routeEls: Record<LayoutName, Partial<Record<RouteId, SVGPathElement>>> = {
  wide: {},
  tall: {},
}
const packetEls: Partial<Record<LayoutName, SVGCircleElement>> = {}

const bindRoute = (layout: LayoutName, route: RouteId) => (el: unknown) => {
  if (el instanceof SVGPathElement) routeEls[layout][route] = el
}

const bindPacket = (layout: LayoutName) => (el: unknown) => {
  if (el instanceof SVGCircleElement) packetEls[layout] = el
}

let raf = 0

const travel = (route: RouteId | null, ms: number) => {
  cancelAnimationFrame(raf)
  Object.values(packetEls).forEach((dot) => dot?.classList.remove('ci-picture__packet--on'))
  if (!route || reduced.value) return
  const layout = LAYOUTS.find(({ name }) => packetEls[name]?.getClientRects().length)?.name
  if (!layout) return
  const path = routeEls[layout][route]
  const dot = packetEls[layout]
  if (!path || !dot) return
  const length = path.getTotalLength()
  let start = 0
  const step = (now: number) => {
    if (!start) start = now
    const k = Math.min(1, (now - start) / ms)
    const point = path.getPointAtLength(length * k)
    dot.setAttribute('cx', String(point.x))
    dot.setAttribute('cy', String(point.y))
    dot.classList.toggle('ci-picture__packet--on', k < 1)
    if (k < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}

watch(frame, (now) => {
  if (now === 5) travel('laptop', 1000)
  else if (now === 6) travel('runner', 1000)
  else if (now === 7) travel('delivery', 800)
  else travel(null, 0)
})

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div ref="root" class="ci-picture">
    <PastedSheet
      class="ci-picture__sheet"
      seed="ci-picture"
      stock="grid"
      :tape="['top-left', 'top-right']"
      :tilt="-0.4"
    >
      <div class="ci-picture__scroll">
        <div
          v-for="layout in LAYOUTS"
          :key="layout.name"
          class="ci-picture__layout"
          :class="`ci-picture__layout--${layout.name}`"
        >
          <svg
            class="ci-picture__svg"
            :viewBox="layout.viewBox"
            aria-hidden="true"
            focusable="false"
          >
            <path
              v-for="(edge, i) in layout.edges"
              :key="i"
              class="ci-picture__edge"
              :class="{
                'ci-picture__edge--on': at(edge.from),
                'ci-picture__edge--blocked': edge.blocked,
              }"
              pathLength="1"
              :d="edge.d"
            />

            <g
              v-for="node in nodes"
              :key="node.id"
              class="ci-picture__node"
              :class="{ 'ci-picture__node--on': at(node.from) }"
            >
              <rect
                class="ci-picture__frame"
                :x="layout.boxes[node.id].x"
                :y="layout.boxes[node.id].y"
                :width="layout.boxes[node.id].w"
                :height="layout.boxes[node.id].h"
                rx="3"
              />
              <text
                v-if="node.title"
                class="ci-picture__title"
                :x="layout.boxes[node.id].x + layout.pad"
                :y="layout.boxes[node.id].y + layout.pad + 10"
              >
                {{ node.title }}
              </text>
              <template v-if="node.id === 'registry'">
                <template v-for="(tag, i) in content.registry.tags" :key="i">
                  <rect
                    class="ci-picture__tag"
                    :class="{ 'ci-picture__tag--hot': i === 0 }"
                    :x="layout.boxes.registry.x + layout.pad"
                    :y="layout.boxes.registry.y + layout.pad + 22 + i * layout.tag.step"
                    :width="layout.boxes.registry.w - layout.pad * 2"
                    :height="layout.tag.h"
                    rx="2"
                  />
                  <text
                    class="ci-picture__tag-text"
                    :x="layout.boxes.registry.x + layout.pad + 10"
                    :y="
                      layout.boxes.registry.y +
                      layout.pad +
                      22 +
                      i * layout.tag.step +
                      layout.tag.h * 0.68
                    "
                  >
                    {{ tag }}
                  </text>
                </template>
              </template>
              <text
                v-else
                class="ci-picture__detail"
                :class="{ 'ci-picture__detail--small': node.small }"
                :x="layout.boxes[node.id].x + layout.pad"
                :y="
                  node.title
                    ? layout.boxes[node.id].y + layout.boxes[node.id].h - layout.pad
                    : layout.boxes[node.id].y + layout.boxes[node.id].h / 2 + 5
                "
              >
                {{ node.detail }}
              </text>
            </g>

            <g class="ci-picture__node" :class="{ 'ci-picture__node--on': at(7) }">
              <line
                class="ci-picture__gate"
                :x1="layout.gate.x1"
                :y1="layout.gate.y1"
                :x2="layout.gate.x2"
                :y2="layout.gate.y2"
              />
              <text class="ci-picture__gate-text" :x="layout.gate.tx" :y="layout.gate.ty">
                {{ content.gate }}
              </text>
            </g>

            <text
              class="ci-picture__stop"
              :class="{ 'ci-picture__stop--on': at(7) }"
              :x="layout.stop.x"
              :y="layout.stop.y"
            >
              ✕
            </text>

            <g
              v-for="badge in layout.badges"
              :key="badge.n"
              class="ci-picture__badge"
              :class="{ 'ci-picture__badge--on': at(badge.from) }"
            >
              <circle class="ci-picture__badge-dot" :cx="badge.x" :cy="badge.y" r="16" />
              <text
                class="ci-picture__badge-text"
                :x="badge.x"
                :y="badge.y + 4"
                text-anchor="middle"
              >
                {{ badge.n }}
              </text>
            </g>

            <path
              v-for="(d, route) in layout.routes"
              :key="route"
              :ref="bindRoute(layout.name, route)"
              class="ci-picture__route"
              :d="d"
            />
            <circle
              :ref="bindPacket(layout.name)"
              class="ci-picture__packet"
              r="8"
              cx="-20"
              cy="-20"
            />
          </svg>
        </div>
      </div>
      <nav class="ci-picture__toc" :aria-label="tocLabel">
        <ol class="ci-picture__toc-list" role="list">
          <li v-for="step in steps" :key="step.href">
            <a class="ci-picture__toc-link" :href="step.href">
              <span class="ci-picture__toc-number">{{ step.number }}</span> {{ step.label }}
            </a>
          </li>
        </ol>
      </nav>
    </PastedSheet>
    <CiReplay :label="replayLabel" @replay="replay" />
  </div>
</template>
