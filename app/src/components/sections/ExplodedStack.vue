<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, useId, watch, watchEffect } from 'vue'
import StackLaptop from '@/components/sections/StackLaptop.vue'
import StackMetal from '@/components/sections/StackMetal.vue'
import StackRuntime from '@/components/sections/StackRuntime.vue'
import { useClock } from '@/composables/useClock'
import { useElementWidth } from '@/composables/useElementWidth'
import { useInView } from '@/composables/useInView'
import { useScrollProgress } from '@/composables/useScrollProgress'
import type { StackLayer } from '@/contents'
import {
  clamp01,
  easeOutCubic,
  plateFaces,
  projector,
  svgPoints,
  type Point,
  type Vec3,
} from '@/utils/isometric'
import { CONTROL_PLANE, storyClock } from '@/utils/stack-story'

const props = defineProps<{
  layers: readonly StackLayer[]
  /** Callouts sit beside the drawing, joined to the plates by leader lines. */
  wide: boolean
}>()
const active = defineModel<string | null>('active', { default: null })

// Drawing units. The wide drawing covers the sheet at its 1184-unit width, so
// leader lines can reach the callouts; a taller sheet leaves the drawing at
// that scale and adds room below it. Its height is the sheet's least, as
// `.practice__drawing--wide` sets it. The narrow drawing is cropped to the stack.
const VIEWS = {
  wide: { x: 0, y: 0, width: 1184, height: 980 },
  narrow: { x: 50, y: 90, width: 580, height: 790 },
} as const
// A leader runs from its plate's corner to a shelf level with the middle of
// its callout's title, and the shelf runs on to the callout's number. The
// shelves all start this far short of the numbers, so they line up.
const SHELF = 40

// From the top of the stack down: footprint, thickness and the height of the
// top face assembled and exploded. The top plate is a laptop's base, its lid
// opening above it (StackLaptop); the bottom plate is a chassis of three
// servers, as thick as its front photo is tall at the plate's width (StackMetal).
const PLATES = [
  { width: 212, depth: 146, thickness: 12, assembled: -66, exploded: 160 },
  { width: 276, depth: 192, thickness: 20, assembled: -86, exploded: 16 },
  { width: 340, depth: 240, thickness: 105, assembled: -110, exploded: -110 },
] as const
const [TOP, MIDDLE, BOTTOM] = PLATES
type Plate = (typeof PLATES)[number]

// One plate per layer; a layer beyond the drawn plates is left out.
const drawn = computed(() => props.layers.slice(0, PLATES.length))
if (import.meta.env.DEV) {
  watchEffect(() => {
    if (props.layers.length > PLATES.length)
      console.warn(
        `ExplodedStack draws ${PLATES.length} of the ${props.layers.length} layers it was given.`,
      )
  })
}

// Low enough on the sheet that the laptop's open lid keeps clear of its top,
// with more room still under the chassis.
const project = projector(330, 510)
const hatchId = `hatch-${useId()}`
const view = computed(() => (props.wide ? VIEWS.wide : VIEWS.narrow))
const viewBox = computed(() => {
  const { x, y, width, height } = view.value
  return `${x} ${y} ${width} ${height}`
})
const aspect = computed(() => `${view.value.width} / ${view.value.height}`)
// The plates sit around the middle of the drawing, so progress follows the
// middle of its frame, the drawing's own box, which stays put when the plates
// move or the sheet grows taller: they come apart while they are on screen,
// and the explode completes when that middle reaches 30% of the viewport, so
// the exploded drawing is seen whole. 0 assembled, 1 exploded.
const drawing = ref<HTMLElement | null>(null)
const frame = ref<HTMLElement | null>(null)
const progress = useScrollProgress(frame, { anchor: 0.5, span: 0.6 })
const eased = computed(() => easeOutCubic(progress.value))
// Leaders and callouts arrive over the second half of the travel.
const reveal = computed(() => Math.max(0, (eased.value - 0.55) / 0.45))
// What stands on a plate rises over the middle of the travel, flat while the
// plates lie close.
const rise = computed(() => clamp01((eased.value - 0.25) / 0.5))
// The runtime's loop plays while the stack is apart and on screen, and the
// plates that follow it read the same clock.
const inView = useInView(drawing)
const running = computed(() => inView.value && eased.value > 0.9)
provide(storyClock, useClock(running))

// Each plate is drawn once, where the explode leaves it, on a layer of its own,
// and slid there: while the stack comes apart the compositor moves the layers
// and nothing is repainted. How far below that a plate still is, in units, and
// the slide in pixels.
const below = (plate: Plate) => (plate.exploded - plate.assembled) * (1 - eased.value)
const width = useElementWidth(drawing)
const slide = (index: number) => {
  const pixels = (below(PLATES[index]) * width.value) / view.value.width
  return { transform: `translateY(${pixels.toFixed(2)}px)` }
}

// Where the platform's deploys land, the top of the control plane's box, and
// how much further down the laptop's layer finds it while the two slide apart.
const controlPlane = computed<Vec3>(() => [
  -MIDDLE.width / 2 + CONTROL_PLANE.u + CONTROL_PLANE.width / 2,
  -MIDDLE.depth / 2 + CONTROL_PLANE.v + CONTROL_PLANE.depth / 2,
  MIDDLE.exploded + CONTROL_PLANE.height * rise.value,
])
const controlShift = computed(() => below(MIDDLE) - below(TOP))

// The plates as drawn, exploded.
const plates = computed(() =>
  drawn.value.map((layer, index) => {
    const shape = PLATES[index]
    const origin: Vec3 = [-shape.width / 2, -shape.depth / 2, shape.exploded]
    return {
      key: layer.key,
      index,
      faces: plateFaces(project, { ...shape, z: shape.exploded }),
      origin,
    }
  }),
)
// Painted from the bottom plate up.
const painted = computed(() => [...plates.value].reverse())

// Leaders end level with the middle of each callout title, wherever the
// sheet's flow puts it, at its number's left edge: measured in layout pixels
// and turned into drawing units.
const root = ref<HTMLElement | null>(null)
const list = ref<HTMLOListElement | null>(null)
const titleLevels = ref<number[]>([])
const numberEdge = ref(0)
const measureTitles = () => {
  const ol = list.value
  // Layout offsets ignore the sheet's tilt. The list's offset parent is also
  // the containing block of the drawing, which fills it from the top left.
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
// The list changes size as its copy or type does, the drawing as the sheet
// does, and the stack, which fills its grid row, as the statement above grows.
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
        const from: Point = [anchor[0], anchor[1] + below(PLATES[index])]
        const y = titleLevels.value[index]
        const end = numberEdge.value - 1
        const points: Point[] = [from, [end - SHELF, y], [end, y]]
        return { key, from, points }
      }),
)
const calloutStyle = computed(() => (props.wide ? { opacity: 0.25 + reveal.value * 0.75 } : {}))

// A mouse pairs a plate with its callout while it hovers either. Touch and pen
// are left out: a tap would leave the pair lit.
const enter = (event: PointerEvent, key: string) => {
  if (event.pointerType === 'mouse') active.value = key
}
const leave = (event: PointerEvent) => {
  if (event.pointerType === 'mouse') active.value = null
}
</script>

<template>
  <div ref="root" class="stack" :class="{ 'stack--wide': wide }">
    <!-- A layer for each plate, bottom up, and one for the leaders on top. -->
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
        :style="slide(plate.index)"
        :viewBox="viewBox"
        preserveAspectRatio="xMinYMin meet"
        focusable="false"
      >
        <defs v-if="plate.index === 1">
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
          <!-- The laptop and the chassis draw all of themselves. -->
          <template v-if="plate.index === 1">
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
            v-if="plate.index === 0"
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
            v-if="plate.index === 1"
            :project="project"
            :origin="plate.origin"
            :rise="rise"
            :hatch="hatchId"
          />
          <StackMetal
            v-if="plate.index === 2"
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

    <!-- The role, because Safari drops list semantics under `list-style: none`. -->
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
