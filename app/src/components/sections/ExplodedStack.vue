<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch, watchEffect } from 'vue'
import { useScrollProgress } from '@/composables/useScrollProgress'
import type { StackLayer } from '@/contents'
import { easeOutCubic, lerp, plateFaces, projector, svgPoints, type Point } from '@/utils/isometric'

const props = defineProps<{
  layers: readonly StackLayer[]
  /** Callouts sit beside the drawing, joined to the plates by leader lines. */
  wide: boolean
}>()
const active = defineModel<string | null>('active', { default: null })

// Drawing units. The wide drawing covers the sheet at its 1184-unit width, so
// leader lines can reach the callouts; a taller sheet leaves the drawing at
// that scale and adds room below it. The narrow drawing is cropped to the stack.
const VIEWS = {
  wide: { x: 0, y: 0, width: 1184, height: 872 },
  narrow: { x: 50, y: 110, width: 580, height: 700 },
} as const
const LEADER_END = 690
// A leader's diagonal drops at most this far: enough for today's copy, and
// clear of the plate below whenever the leaders show. A callout pushed further
// down is reached by a lane right of every plate (none reaches past x 582);
// the higher the callout, the nearer its lane, so leaders never cross.
const DIAGONAL_DROP = 88
const LANES = [670, 645, 620] as const

// From the top of the stack down: footprint, thickness and the height of the
// top face assembled and exploded.
const PLATES = [
  { width: 212, depth: 146, thickness: 16, assembled: -106, exploded: 160 },
  { width: 276, depth: 192, thickness: 20, assembled: -126, exploded: 6 },
  { width: 340, depth: 240, thickness: 24, assembled: -150, exploded: -150 },
] as const
const [TOP, , BOTTOM] = PLATES

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

const project = projector(330, 470)
const hatchId = `hatch-${useId()}`
const view = computed(() => (props.wide ? VIEWS.wide : VIEWS.narrow))
const viewBox = computed(() => {
  const { x, y, width, height } = view.value
  return `${x} ${y} ${width} ${height}`
})
// The plates sit around the middle of the drawing, so progress follows the
// middle of its frame, which stays put when the plates move or the sheet grows
// taller: they come apart while they are on screen, and the explode completes
// when that middle reaches 30% of the viewport, so the exploded drawing is seen
// whole. 0 assembled, 1 exploded.
const drawing = ref<SVGSVGElement | null>(null)
const frame = ref<SVGRectElement | null>(null)
const progress = useScrollProgress(frame, { anchor: 0.5, span: 0.6 })
const eased = computed(() => easeOutCubic(progress.value))
// Guides, leaders and callouts arrive over the second half of the travel.
const reveal = computed(() => Math.max(0, (eased.value - 0.55) / 0.45))

interface Path {
  points: Point[]
  dashed?: boolean
}

const plates = computed(() =>
  drawn.value.map((layer, index) => {
    const shape = PLATES[index]
    const z = lerp(shape.assembled, shape.exploded, eased.value)
    const x0 = -shape.width / 2
    const y0 = -shape.depth / 2
    const onTop = (x: number, y: number): Point => project(x0 + x, y0 + y, z)
    const rect = (x: number, y: number, w: number, d: number) => [
      onTop(x, y),
      onTop(x + w, y),
      onTop(x + w, y + d),
      onTop(x, y + d),
      onTop(x, y),
    ]

    const paths: Path[] = []
    const nodes: Point[] = []
    if (index === 0) {
      // Platforms: panels of tools.
      paths.push(
        { points: rect(18, 16, 78, 46) },
        { points: rect(106, 16, 88, 46) },
        { points: rect(18, 76, 176, 52) },
      )
    } else if (index === 1) {
      // Runtime: a grid of tasks and one route across it.
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 3; j++) nodes.push(onTop(40 + i * 65, 38 + j * 58))
      paths.push({ points: [onTop(40, 38), onTop(235, 154)], dashed: true })
    } else {
      // Infrastructure: rows of rack units.
      for (let k = 1; k < 8; k++)
        paths.push({
          points: [
            onTop(14, (shape.depth / 8) * k),
            onTop(shape.width - 14, (shape.depth / 8) * k),
          ],
        })
    }

    return { key: layer.key, index, faces: plateFaces(project, { ...shape, z }), paths, nodes }
  }),
)
// Painted from the bottom plate up.
const painted = computed(() => [...plates.value].reverse())

const axis = svgPoints([project(0, 0, 330), project(0, 0, -210)])
// From the top plate's two front corners down to the bottom plate's top face.
const guides = computed(() => {
  const z = lerp(TOP.assembled, TOP.exploded, eased.value)
  return [-TOP.width / 2, TOP.width / 2].map((x) => [
    project(x, TOP.depth / 2, z),
    project(x, TOP.depth / 2, BOTTOM.exploded),
  ])
})

// Leaders end level with the middle of each callout title, wherever the
// sheet's flow puts it: measured in layout pixels and turned into drawing units.
const root = ref<HTMLElement | null>(null)
const list = ref<HTMLOListElement | null>(null)
const titleLevels = ref<number[]>([])
const measureTitles = () => {
  const ol = list.value
  // Layout offsets ignore the sheet's tilt. The list's offset parent is also
  // the containing block of the drawing, which fills it from the top left.
  const box = ol?.offsetParent
  if (!props.wide || !ol || !(box instanceof HTMLElement) || !box.clientWidth) return
  const scale = VIEWS.wide.width / box.clientWidth
  titleLevels.value = [...ol.querySelectorAll<HTMLElement>('.stack__callout-title')].map(
    (title) => {
      let y = title.offsetHeight / 2
      let el: Element | null = title
      while (el instanceof HTMLElement && el !== box) {
        y += el.offsetTop
        el = el.offsetParent
      }
      return y * scale
    },
  )
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
  titleLevels.value.length < plates.value.length
    ? []
    : plates.value.map(({ key, index, faces: { anchor } }) => {
        const [x, top] = anchor
        const y = titleLevels.value[index]
        const elbow = Math.min(y, top + DIAGONAL_DROP)
        const lane = LANES[index]
        const points: Point[] =
          y > elbow
            ? [anchor, [x + 34, elbow], [lane, elbow], [lane, y], [LEADER_END, y]]
            : [anchor, [x + 34, y], [LEADER_END, y]]
        return { key, points }
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
    <svg
      ref="drawing"
      class="stack__drawing"
      :viewBox="viewBox"
      preserveAspectRatio="xMinYMin meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
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

      <rect ref="frame" class="stack__frame" v-bind="view" />
      <polyline class="stack__axis" :points="axis" />

      <g
        v-for="plate in painted"
        :key="plate.key"
        class="stack__plate"
        :class="{ 'stack__plate--active': active === plate.key }"
        @pointerenter="enter($event, plate.key)"
        @pointerleave="leave"
      >
        <polygon
          class="stack__face stack__face--side"
          :points="svgPoints(plate.faces.right)"
          :fill="`url(#${hatchId})`"
        />
        <polygon class="stack__face stack__face--front" :points="svgPoints(plate.faces.front)" />
        <polygon class="stack__face stack__face--top" :points="svgPoints(plate.faces.top)" />
        <polyline
          v-for="(path, i) in plate.paths"
          :key="`p${i}`"
          class="stack__detail"
          :class="{ 'stack__detail--dashed': path.dashed }"
          :points="svgPoints(path.points)"
        />
        <ellipse
          v-for="(node, i) in plate.nodes"
          :key="`n${i}`"
          class="stack__detail"
          :cx="node[0]"
          :cy="node[1]"
          rx="11"
          ry="6.5"
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

      <g v-if="wide" :style="{ opacity: reveal }">
        <polyline
          v-for="(guide, i) in guides"
          :key="`g${i}`"
          class="stack__guide"
          :points="svgPoints(guide)"
        />
        <polyline
          v-for="leader in leaders"
          :key="`l-${leader.key}`"
          class="stack__leader"
          :class="{ 'stack__leader--active': active === leader.key }"
          :points="svgPoints(leader.points)"
        />
        <circle
          v-for="plate in plates"
          :key="`d-${plate.key}`"
          class="stack__dot"
          :cx="plate.faces.anchor[0]"
          :cy="plate.faces.anchor[1]"
          r="2.6"
        />
      </g>
    </svg>

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
