<script setup lang="ts">
import { computed, inject, ref, useId } from 'vue'
import deckPhoto from '@/assets/images/stack-deck.webp'
import wallpaper from '@/assets/images/stack-wallpaper.webp'
import {
  DOWNWARD,
  X,
  Y,
  boxFaces,
  planeTransform,
  svgPoints,
  type Point,
  type Projector,
  type Vec3,
} from '@/utils/isometric'
import { lerp } from '@/utils/math'
import {
  DEPLOY,
  DOWN,
  FAIL,
  FINISH,
  LANDINGS,
  LOOP,
  RECOVER,
  SEND,
  SPARE,
  nodeName,
  phase,
  storyClock,
} from '@/utils/stack-story'

const props = defineProps<{
  project: Projector
  origin: Vec3
  width: number
  depth: number
  thickness: number
  rise: number
  target: Vec3
  targetShift: number
}>()

const LID = 5
const OPEN = (105 * Math.PI) / 180
const DISPLAY = { x: 6, y: 6, width: 200, height: 128 }
const MENU = 6.5
const NOTCH = { x: 96, width: 20 }
const WINDOW = { x: 22, y: 20, width: 168, height: 104, bar: 9 }
const COLUMNS = { time: 27, mark: 56, subject: 62, text: 100 }
const LINE = { top: 38, pitch: 9, prompt: 117 }
const CHAR = 3.36

const DECK_CORNER = 6

const [TO_SPARE, TO_DOWN] = LANDINGS
const SENT = TO_DOWN.at - SEND
const down = nodeName(DOWN)
const spare = nodeName(SPARE)
const events = (loop: number) => {
  const job = `ingest-${42 + loop}`
  const web = `web@${(0x2a1d + loop * 7).toString(16)}`
  return [
    { at: 0.2, mark: '✓', tone: 'ok', subject: job, text: `running on ${down}` },
    { at: FAIL, mark: '!', tone: 'fault', subject: down, text: 'not ready' },
    {
      at: TO_SPARE.at - SEND,
      mark: '→',
      tone: 'move',
      subject: job,
      text: `rescheduled to ${spare}`,
    },
    { at: TO_SPARE.at, mark: '✓', tone: 'ok', subject: job, text: `running on ${spare}` },
    { at: RECOVER, mark: '✓', tone: 'ok', subject: down, text: 'ready' },
    { at: FINISH, mark: '✓', tone: 'ok', subject: job, text: 'completed' },
    { at: DEPLOY, mark: '$', tone: 'prompt', subject: 'platform', text: 'deploy web' },
    { at: SENT, mark: '→', tone: 'move', subject: web, text: `deploying to ${down}` },
    { at: TO_DOWN.at, mark: '✓', tone: 'ok', subject: web, text: `running on ${down}` },
  ]
}
const COMMAND = 'platform deploy web'
const LINES = 8
const TYPING = 0.8

const time = inject(storyClock, ref(0))

const id = useId()
const ids = {
  deck: `${id}-deck`,
  back: `${id}-back`,
  corners: `${id}-corners`,
}

const x0 = computed(() => props.origin[0])
const y0 = computed(() => props.origin[1])

const base = computed(() => {
  const [x, y] = [x0.value, y0.value]
  const { width: w, depth: d, thickness: t } = props
  return {
    faces: boxFaces(props.project, { x, y, z: -t, width: w, depth: d, height: t }),
    chamfer: [
      props.project(x, y + d, 0),
      props.project(x + w, y + d, 0),
      props.project(x + w, y, 0),
    ],
    deck: planeTransform(props.project, [x, y, 0], X, Y),
    front: planeTransform(props.project, [x, y + d, 0], X, DOWNWARD),
    side: planeTransform(props.project, [x + w, y, 0], Y, DOWNWARD),
  }
})
const lift = computed(() => `translate(0 ${(-props.origin[2]).toFixed(2)})`)

const lid = computed(() => {
  const [x, y] = [x0.value, y0.value]
  const { width: w, depth: d } = props
  const angle = OPEN * props.rise
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const at = (u: number, along: number, out: number): Vec3 => [
    x + u,
    y + along * cos - out * sin,
    along * sin + out * cos,
  ]
  const p = (u: number, along: number, out: number): Point => props.project(...at(u, along, out))
  return {
    open: angle > Math.PI / 4,
    inner: [p(0, 0, 0), p(w, 0, 0), p(w, d, 0), p(0, d, 0)],
    outer: [p(0, 0, LID), p(w, 0, LID), p(w, d, LID), p(0, d, LID)],
    edge: [p(0, d, 0), p(w, d, 0), p(w, d, LID), p(0, d, LID)],
    side: [p(w, 0, 0), p(w, d, 0), p(w, d, LID), p(w, 0, LID)],
    screen: planeTransform(props.project, at(0, d, 0), X, [0, -cos, -sin]),
  }
})

const link = computed(() => {
  const [, y, z] = props.target
  const x = props.origin[0]
  const from = props.project(x, y, props.origin[2] - props.thickness)
  const [toX, toY] = props.project(x, y, z)
  const to = [toX, toY + props.targetShift] as const
  const p = phase(time.value % LOOP, DEPLOY, SENT - DEPLOY)
  const live = p > 0 && p < 1
  return {
    from,
    to,
    live,
    marker: live ? ([lerp(from[0], to[0], p), lerp(from[1], to[1], p)] as const) : null,
  }
})

const clock = (seconds: number) => {
  const s = Math.floor(seconds + 7322)
  return [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}

const terminal = computed(() => {
  const now = time.value
  const loop = Math.floor(now / LOOP)
  const lines = [loop - 1, loop]
    .flatMap((n) => events(n).map((e) => ({ ...e, at: n * LOOP + e.at })))
    .filter(({ at }) => at <= now)
    .slice(-LINES)
    .map((e) => ({ ...e, time: clock(e.at) }))
  const into = now - loop * LOOP
  const typed =
    into < DEPLOY && into > DEPLOY - TYPING
      ? COMMAND.slice(0, Math.ceil(phase(into, DEPLOY - TYPING, TYPING) * COMMAND.length))
      : ''
  const minute = lines.length ? lines[lines.length - 1].time.slice(0, 5) : ''
  return { lines, typed, minute }
})
</script>

<template>
  <g class="stack__laptop">
    <defs>
      <linearGradient :id="ids.deck" x1="0" y1="1" x2="0" y2="0">
        <stop class="stack__stop stack__stop--alu-lit" offset="0" />
        <stop class="stack__stop stack__stop--alu" offset="1" />
      </linearGradient>
      <linearGradient :id="ids.back" x1="0" y1="0" x2="1" y2="1">
        <stop class="stack__stop stack__stop--alu" offset="0" />
        <stop class="stack__stop stack__stop--alu-lit" offset="1" />
      </linearGradient>
      <clipPath :id="ids.corners">
        <rect :width="width" :height="depth" :rx="DECK_CORNER" />
      </clipPath>
    </defs>

    <line
      class="stack__link"
      :class="{ 'stack__link--live': link.live }"
      :x1="link.from[0]"
      :y1="link.from[1]"
      :x2="link.to[0]"
      :y2="link.to[1]"
    />
    <rect
      v-if="link.marker"
      class="stack__token"
      x="-4"
      y="-4"
      width="8"
      height="8"
      :transform="`translate(${link.marker[0].toFixed(1)} ${link.marker[1].toFixed(1)}) rotate(45)`"
    />

    <g :transform="lift">
      <g v-memo="[base]" class="stack__solid stack__solid--aluminum">
        <polygon class="stack__solid-right" :points="svgPoints(base.faces.right)" />
        <polygon class="stack__solid-front" :points="svgPoints(base.faces.front)" />
        <polygon
          class="stack__painted"
          :fill="`url(#${ids.deck})`"
          :points="svgPoints(base.faces.top)"
        />
        <g :transform="base.side">
          <rect class="stack__port" x="34" y="4" width="11" height="4" rx="2" />
          <rect class="stack__port" x="50" y="4" width="11" height="4" rx="2" />
          <circle class="stack__port" cx="120" cy="6" r="1.8" />
        </g>
        <path class="stack__port" :transform="base.front" d="M94 0Q106 3.4 118 0Z" />
        <image
          :transform="base.deck"
          :href="deckPhoto"
          :width="width"
          :height="depth"
          :clip-path="`url(#${ids.corners})`"
          preserveAspectRatio="none"
        />
        <polyline class="stack__chamfer" :points="svgPoints(base.chamfer)" />
      </g>

      <g class="stack__solid stack__solid--aluminum">
        <polygon
          v-if="!lid.open"
          class="stack__painted"
          :fill="`url(#${ids.back})`"
          :points="svgPoints(lid.outer)"
        />
        <template v-else>
          <polygon class="stack__bezel" :points="svgPoints(lid.inner)" />
          <g :transform="lid.screen">
            <image :href="wallpaper" v-bind="DISPLAY" preserveAspectRatio="xMidYMid slice" />
            <rect
              class="stack__menubar"
              :x="DISPLAY.x"
              :y="DISPLAY.y"
              :width="DISPLAY.width"
              :height="MENU"
            />
            <circle
              class="stack__menu-text"
              :cx="DISPLAY.x + 4"
              :cy="DISPLAY.y + MENU / 2"
              r="1.3"
            />
            <text
              class="stack__menu-text stack__menu-text--app"
              :x="DISPLAY.x + 8"
              :y="DISPLAY.y + 4.6"
            >
              platform
            </text>
            <text
              class="stack__menu-text stack__menu-text--clock"
              :x="DISPLAY.x + DISPLAY.width - 4"
              :y="DISPLAY.y + 4.6"
            >
              {{ terminal.minute }}
            </text>
            <rect
              class="stack__notch"
              :x="NOTCH.x"
              :y="DISPLAY.y"
              :width="NOTCH.width"
              :height="MENU"
              rx="1.6"
            />
            <circle
              class="stack__camera"
              :cx="NOTCH.x + NOTCH.width / 2"
              :cy="DISPLAY.y + 2.6"
              r="0.8"
            />

            <rect
              v-for="k in 3"
              :key="k"
              class="stack__window-shadow"
              :x="WINDOW.x - k + 1.5"
              :y="WINDOW.y + k"
              :width="WINDOW.width + 2 * k - 3"
              :height="WINDOW.height + k"
              :rx="2.4 + k"
            />
            <rect class="stack__window" v-bind="WINDOW" rx="2.4" />
            <path
              class="stack__titlebar"
              :d="`M${WINDOW.x} ${WINDOW.y + WINDOW.bar}V${WINDOW.y + 2.4}Q${WINDOW.x} ${WINDOW.y} ${WINDOW.x + 2.4} ${WINDOW.y}H${WINDOW.x + WINDOW.width - 2.4}Q${WINDOW.x + WINDOW.width} ${WINDOW.y} ${WINDOW.x + WINDOW.width} ${WINDOW.y + 2.4}V${WINDOW.y + WINDOW.bar}Z`"
            />
            <circle
              v-for="(dot, i) in ['close', 'minimise', 'zoom']"
              :key="dot"
              class="stack__window-dot"
              :class="`stack__window-dot--${dot}`"
              :cx="WINDOW.x + 5 + i * 5.5"
              :cy="WINDOW.y + WINDOW.bar / 2"
              r="1.6"
            />
            <text
              class="stack__term stack__term--dim stack__term--title"
              :x="WINDOW.x + WINDOW.width / 2"
              :y="WINDOW.y + 6.2"
            >
              platform — zsh
            </text>
            <text
              v-for="(line, i) in terminal.lines"
              :key="line.at"
              class="stack__term"
              :y="LINE.top + i * LINE.pitch"
            >
              <tspan class="stack__term--dim" :x="COLUMNS.time">{{ line.time }}</tspan>
              <tspan :class="`stack__term--${line.tone}`" :x="COLUMNS.mark">{{ line.mark }}</tspan>
              <tspan :x="COLUMNS.subject">{{ line.subject }}</tspan>
              <tspan :class="{ 'stack__term--dim': line.tone !== 'prompt' }" :x="COLUMNS.text">
                {{ line.text }}
              </tspan>
            </text>
            <text class="stack__term" :y="LINE.prompt">
              <tspan class="stack__term--prompt" :x="COLUMNS.time">~ $</tspan>
              <tspan :x="COLUMNS.time + 4 * CHAR">{{ terminal.typed }}</tspan>
            </text>
            <rect
              class="stack__cursor"
              :x="COLUMNS.time + (4 + terminal.typed.length) * CHAR + 0.4"
              :y="LINE.prompt - 4.8"
              width="3"
              height="6"
            />
            <path class="stack__glare" d="M124 6H162L96 134H58Z" />
          </g>
        </template>
        <polygon class="stack__solid-front" :points="svgPoints(lid.edge)" />
        <polygon class="stack__solid-right" :points="svgPoints(lid.side)" />
        <polyline class="stack__chamfer" :points="svgPoints([lid.edge[3], lid.edge[2]])" />
      </g>
    </g>
  </g>
</template>
