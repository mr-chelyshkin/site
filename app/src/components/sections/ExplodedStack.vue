<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, useId, watch, watchEffect } from 'vue'
import StackLaptop from '@/components/sections/stack/StackLaptop.vue'
import StackMetal from '@/components/sections/stack/StackMetal.vue'
import StackRuntime from '@/components/sections/stack/StackRuntime.vue'
import { useClock } from '@/composables/useClock'
import { useElementWidth } from '@/composables/useElementWidth'
import { useInView } from '@/composables/useInView'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useReveal } from '@/composables/useReveal'
import type { StackLayer } from '@/contents'
import { plateFaces, projector, svgPoints, type Point, type Vec3 } from '@/utils/isometric'
import { clamp01, easeOutCubic } from '@/utils/math'
import { CONTROL_PLANE, storyClock } from '@/utils/stack-story'

const props = defineProps<{
  layers: readonly StackLayer[]
  wide: boolean
}>()
const active = ref<string | null>(null)

const VIEWS = {
  wide: { x: 0, y: 0, width: 1184, height: 980 },
  narrow: { x: 50, y: 90, width: 580, height: 790 },
} as const
const SHELF = 40

const UNFOLD_SECONDS = 1.6

const PLATES = {
  platforms: { width: 212, depth: 146, thickness: 12, assembled: -66, exploded: 160, delay: 0 },
  runtime: { width: 276, depth: 192, thickness: 20, assembled: -86, exploded: 16, delay: 0.2 },
  infrastructure: {
    width: 340,
    depth: 240,
    thickness: 105,
    assembled: -110,
    exploded: -110,
    delay: 0,
  },
} as const
type PlateKey = keyof typeof PLATES
type Plate = (typeof PLATES)[PlateKey]
const ORDER = Object.keys(PLATES) as PlateKey[]
const { platforms: TOP, runtime: MIDDLE, infrastructure: BOTTOM } = PLATES

const isPlateKey = (key: string): key is PlateKey => key in PLATES
const drawn = computed(() =>
  props.layers
    .filter((layer): layer is StackLayer & { key: PlateKey } => isPlateKey(layer.key))
    .sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key)),
)
if (import.meta.env.DEV) {
  watchEffect(() => {
    const left = props.layers.filter((layer) => !isPlateKey(layer.key))
    if (left.length)
      console.warn(`ExplodedStack has no plate for ${left.map((layer) => layer.key).join(', ')}.`)
  })
}

const project = projector(330, 510)
const hatchId = `hatch-${useId()}`
const view = computed(() => (props.wide ? VIEWS.wide : VIEWS.narrow))
const viewBox = computed(() => {
  const { x, y, width, height } = view.value
  return `${x} ${y} ${width} ${height}`
})
const aspect = computed(() => `${view.value.width} / ${view.value.height}`)
const drawing = ref<HTMLElement | null>(null)
const frame = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()
const started = useReveal(frame, 0.4)
const unfolded = ref(false)
const elapsed = useClock(computed(() => started.value && !unfolded.value))
watch(elapsed, (seconds) => {
  if (seconds >= UNFOLD_SECONDS) unfolded.value = true
})
const progress = computed(() =>
  reduced.value || unfolded.value ? 1 : clamp01(elapsed.value / UNFOLD_SECONDS),
)
const eased = computed(() => easeOutCubic(progress.value))
const reveal = computed(() => Math.max(0, (eased.value - 0.55) / 0.45))
const rise = computed(() => clamp01((eased.value - 0.25) / 0.5))
const inView = useInView(drawing)
const running = computed(() => inView.value && eased.value > 0.9)
provide(storyClock, useClock(running))

const lift = (plate: Plate) =>
  easeOutCubic(clamp01((progress.value - plate.delay) / (1 - plate.delay)))
const below = (plate: Plate) => (plate.exploded - plate.assembled) * (1 - lift(plate))
const width = useElementWidth(drawing)
const slide = (key: PlateKey) => {
  const pixels = (below(PLATES[key]) * width.value) / view.value.width
  return { transform: `translateY(${pixels.toFixed(2)}px)` }
}

const controlPlane = computed<Vec3>(() => [
  -MIDDLE.width / 2 + CONTROL_PLANE.u + CONTROL_PLANE.width / 2,
  -MIDDLE.depth / 2 + CONTROL_PLANE.v + CONTROL_PLANE.depth / 2,
  MIDDLE.exploded + CONTROL_PLANE.height * rise.value,
])
const controlShift = computed(() => below(MIDDLE) - below(TOP))

const plates = computed(() =>
  drawn.value.map((layer, index) => {
    const shape = PLATES[layer.key]
    const origin: Vec3 = [-shape.width / 2, -shape.depth / 2, shape.exploded]
    return {
      key: layer.key,
      index,
      faces: plateFaces(project, { ...shape, z: shape.exploded }),
      origin,
    }
  }),
)
const painted = computed(() => [...plates.value].reverse())

const root = ref<HTMLElement | null>(null)
const list = ref<HTMLOListElement | null>(null)
const titleLevels = ref<number[]>([])
const numberEdge = ref(0)
const measureTitles = () => {
  const ol = list.value
  const box = ol?.offsetParent
  if (!props.wide || !ol || !(box instanceof HTMLElement) || !box.clientWidth) return
  const scale = VIEWS.wide.width / box.clientWidth
  const offset = (el: HTMLElement) => {
    let x = 0
    let y = 0
    let node: Element | null = el
    while (node instanceof HTMLElement && node !== box) {
      x += node.offsetLeft
      y += node.offsetTop
      node = node.offsetParent
    }
    return [x * scale, y * scale] as const
  }
  titleLevels.value = [...ol.querySelectorAll<HTMLElement>('.stack__callout-title')].map(
    (title) => offset(title)[1] + (title.offsetHeight / 2) * scale,
  )
  const number = ol.querySelector<HTMLElement>('.stack__number')
  numberEdge.value = number ? offset(number)[0] : 0
}
let titleObserver: ResizeObserver | undefined
onMounted(() => {
  titleObserver = new ResizeObserver(measureTitles)
  for (const el of [root.value, list.value, drawing.value]) if (el) titleObserver.observe(el)
})
onBeforeUnmount(() => titleObserver?.disconnect())
watch(() => props.wide, measureTitles, { flush: 'post' })

const leaders = computed(() =>
  titleLevels.value.length < plates.value.length || !numberEdge.value
    ? []
    : plates.value.map(({ key, index, faces: { anchor } }) => {
        const from: Point = [anchor[0], anchor[1] + below(PLATES[key])]
        const y = titleLevels.value[index]
        const end = numberEdge.value - 1
        const points: Point[] = [from, [end - SHELF, y], [end, y]]
        return { key, from, points }
      }),
)
const calloutStyle = computed(() => (props.wide ? { opacity: 0.25 + reveal.value * 0.75 } : {}))

const enter = (event: PointerEvent, key: string) => {
  if (event.pointerType === 'mouse') active.value = key
}
const leave = (event: PointerEvent) => {
  if (event.pointerType === 'mouse') active.value = null
}
</script>

<template>
  <div ref="root" class="stack" :class="{ 'stack--wide': wide }">
    <div
      ref="drawing"
      class="stack__drawing"
      :style="wide ? undefined : { aspectRatio: aspect }"
      aria-hidden="true"
    >
      <div ref="frame" class="stack__frame" :style="{ aspectRatio: aspect }" />
      <svg
        v-for="plate in painted"
        :key="plate.key"
        class="stack__layer stack__layer--plate"
        :style="slide(plate.key)"
        :viewBox="viewBox"
        preserveAspectRatio="xMinYMin meet"
        focusable="false"
      >
        <defs v-if="plate.key === 'runtime'">
          <pattern
            :id="hatchId"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect class="stack__hatch-ground" width="6" height="6" />
            <line class="stack__hatch" x1="0" y1="0" x2="0" y2="6" />
          </pattern>
        </defs>
        <g
          class="stack__plate"
          :class="{ 'stack__plate--active': active === plate.key }"
          @pointerenter="enter($event, plate.key)"
          @pointerleave="leave"
        >
          <template v-if="plate.key === 'runtime'">
            <polygon
              class="stack__face stack__face--side"
              :points="svgPoints(plate.faces.right)"
              :fill="`url(#${hatchId})`"
            />
            <polygon
              class="stack__face stack__face--front"
              :points="svgPoints(plate.faces.front)"
            />
            <polygon class="stack__face stack__face--top" :points="svgPoints(plate.faces.top)" />
          </template>
          <StackLaptop
            v-if="plate.key === 'platforms'"
            :project="project"
            :origin="plate.origin"
            :width="TOP.width"
            :depth="TOP.depth"
            :thickness="TOP.thickness"
            :rise="rise"
            :target="controlPlane"
            :target-shift="controlShift"
          />
          <StackRuntime
            v-if="plate.key === 'runtime'"
            :project="project"
            :origin="plate.origin"
            :rise="rise"
            :hatch="hatchId"
          />
          <StackMetal
            v-if="plate.key === 'infrastructure'"
            :project="project"
            :origin="plate.origin"
            :width="BOTTOM.width"
            :depth="BOTTOM.depth"
            :height="BOTTOM.thickness"
            :rise="rise"
          />
          <g
            v-if="!wide"
            class="stack__balloon"
            :transform="`translate(${plate.faces.anchor[0] + 22} ${plate.faces.anchor[1] - 10})`"
          >
            <circle class="stack__balloon-ring" r="22" />
            <text class="stack__balloon-number">{{ plate.index + 1 }}</text>
          </g>
        </g>
      </svg>
      <svg
        v-if="wide"
        class="stack__layer"
        :style="{ opacity: reveal }"
        :viewBox="viewBox"
        preserveAspectRatio="xMinYMin meet"
        focusable="false"
      >
        <polyline
          v-for="leader in leaders"
          :key="`l-${leader.key}`"
          class="stack__leader"
          :class="{ 'stack__leader--active': active === leader.key }"
          :points="svgPoints(leader.points)"
        />
        <circle
          v-for="leader in leaders"
          :key="`d-${leader.key}`"
          class="stack__dot"
          :cx="leader.from[0]"
          :cy="leader.from[1]"
          r="2.6"
        />
      </svg>
    </div>

    <ol ref="list" class="stack__callouts" role="list">
      <li
        v-for="(layer, i) in drawn"
        :key="layer.key"
        class="stack__callout"
        :class="{ 'stack__callout--active': active === layer.key }"
        :style="calloutStyle"
        @pointerenter="enter($event, layer.key)"
        @pointerleave="leave"
      >
        <h3 class="stack__callout-title">
          <span class="stack__number" aria-hidden="true">{{ i + 1 }}</span
          >{{ layer.title }}
        </h3>
        <p class="stack__callout-text">{{ layer.description }}</p>
      </li>
    </ol>
  </div>
</template>
