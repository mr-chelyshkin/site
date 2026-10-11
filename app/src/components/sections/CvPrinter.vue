<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import BarCode from '@/components/ui/BarCode.vue'
import WallLabel from '@/components/ui/WallLabel.vue'
import { useInView } from '@/composables/useInView'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useTurnstile } from '@/composables/useTurnstile'
import type { Company, HomeContent } from '@/contents'
import { validity } from '@/utils/format'

const props = defineProps<{
  printer: HomeContent['contact']['printer']
  name: string
  email: string
  companies: readonly Company[]
}>()

const SIDE =
  'M221.36 2.64L231.36-7.36A9 9 0 0 1 234-1V243A9 9 0 0 1 231.36 249.36L221.36 259.36 215 253V9Z'
const id = useId()
const fills = { top: `${id}-top`, side: `${id}-side`, fall: `${id}-fall` }

const FEED_MS = 2200
const FALL_MS = 700
const PATIENCE_MS = 15_000
interface Order {
  template: string
  role: string
}

const template = ref(props.printer.templates[0]?.id ?? '')
const role = ref(props.printer.roles[0]?.id ?? '')
const state = ref<'ready' | 'printing' | 'printed' | 'torn'>('ready')
const order = ref<Order & { stamp: string }>()
const outcome = ref<'waiting' | 'cv' | 'jam'>('waiting')
const ordered = computed(() => ({
  template: props.printer.templates.find((t) => t.id === order.value?.template),
  role: props.printer.roles.find((r) => r.id === order.value?.role),
}))
const note = ref(false)
const status = computed(() => {
  if (state.value === 'printing') return 'Printing…'
  if (outcome.value === 'jam') {
    return state.value === 'printed' ? `${props.printer.jam.title}. ${props.printer.jam.line}` : ''
  }
  if (state.value === 'printed') return 'Printed. Take the receipt to save the CV.'
  if (state.value === 'torn') return `Taken: ${props.printer.note}.`
  return ''
})

const lines = computed(() =>
  [...props.companies]
    .sort((a, b) => (b.to ?? '9999-12').localeCompare(a.to ?? '9999-12'))
    .map((company) => ({
      name: company.name,
      role: company.role,
      when: validity(company.from, company.to, ''),
      lead: ordered.value.role?.leads.includes(company.id) ?? false,
    })),
)

let timer = 0
const later = (ms: number, then: () => void) => {
  clearTimeout(timer)
  timer = window.setTimeout(then, ms)
}
const reduced = useReducedMotion()
const two = (n: number) => String(n).padStart(2, '0')

const root = ref<HTMLElement | null>(null)
const check = ref<HTMLElement | null>(null)
const turnstile = useTurnstile(check, import.meta.env.VITE_TURNSTILE_SITE_KEY, 'cv')
const inView = useInView(root)
watch(inView, (seen) => {
  if (seen) turnstile.prepare().catch(() => undefined)
})

let pdf: Blob | undefined
let job = 0
let request: AbortController | undefined

async function fetchCv(of: Order) {
  const token = await turnstile.token()
  request = new AbortController()
  const giveUp = window.setTimeout(() => request?.abort(), PATIENCE_MS)
  try {
    const response = await fetch(`/api/cv?${new URLSearchParams({ ...of })}`, {
      headers: { 'x-turnstile-token': token },
      signal: request.signal,
    })
    if (!response.ok) throw new Error(`/api/cv answered ${response.status}`)
    return await response.blob()
  } finally {
    clearTimeout(giveUp)
  }
}

async function print() {
  if (state.value === 'printing') return
  const mine = ++job
  const now = new Date()
  const stamp = `${two(now.getDate())}.${two(now.getMonth() + 1)}.${String(now.getFullYear()).slice(2)} ${two(now.getHours())}:${two(now.getMinutes())}`
  order.value = { template: template.value, role: role.value, stamp }
  outcome.value = 'waiting'
  pdf = undefined
  note.value = false
  state.value = 'printing'
  try {
    pdf = await fetchCv({ template: template.value, role: role.value })
    if (mine !== job) return
    outcome.value = 'cv'
  } catch {
    if (mine !== job) return
    outcome.value = 'jam'
  }
  later(reduced.value ? 0 : FEED_MS, () => (state.value = 'printed'))
}

function save(file: Blob, of: Order) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.name.replace(/\s+/g, '-')}-CV-${of.role}-${of.template}.pdf`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

const printKey = ref<HTMLButtonElement | null>(null)
const paper = ref<HTMLButtonElement | null>(null)

function tear() {
  if (state.value !== 'printed') return
  const saved = outcome.value === 'cv' ? pdf : undefined
  if (paper.value === document.activeElement) printKey.value?.focus()
  state.value = 'torn'
  if (saved && order.value) save(saved, order.value)
  later(reduced.value ? 0 : FALL_MS, () => {
    state.value = 'ready'
    if (!saved) return
    note.value = true
    later(3200, () => (note.value = false))
  })
}

let pullFrom: number | null = null
const onPointerDown = (e: PointerEvent) => (pullFrom = e.clientY)
const onPointerMove = (e: PointerEvent) => {
  if (pullFrom !== null && e.clientY - pullFrom > 36) {
    pullFrom = null
    tear()
  }
}
const onPointerUp = () => (pullFrom = null)

onBeforeUnmount(() => {
  clearTimeout(timer)
  job += 1
  request?.abort()
})
</script>

<template>
  <div
    ref="root"
    class="printer"
    :class="[`printer--${state}`, { 'printer--jammed': outcome === 'jam' && state !== 'ready' }]"
  >
    <svg class="printer__cable" viewBox="0 0 60 520" aria-hidden="true" focusable="false">
      <path class="printer__cable-shadow" d="M4 176C32 182 42 222 36 286S22 420 26 470" />
      <path class="printer__cable-wire" d="M0 170C28 176 38 214 32 280S18 416 22 466" />
      <path class="printer__cable-shine" d="M3 170.5C27 176.5 35 210 30 268" />
      <rect class="printer__socket" x="7" y="462" width="30" height="40" rx="4" />
      <rect class="printer__plug" x="13" y="466" width="18" height="20" rx="3" />
      <rect class="printer__plug-grip" x="15" y="470" width="14" height="2" rx="1" />
      <rect class="printer__plug-grip" x="15" y="474" width="14" height="2" rx="1" />
    </svg>
    <span class="printer__mount" aria-hidden="true" />
    <div class="printer__box">
      <svg class="printer__depth" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient
            :id="fills.top"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="112"
            y2="112"
          >
            <stop offset="0.024" stop-color="#6c767b" />
            <stop offset="0.045" stop-color="#545c60" />
            <stop offset="0.96" stop-color="#474f53" />
            <stop offset="1" stop-color="#343b3e" />
          </linearGradient>
          <linearGradient
            :id="fills.side"
            gradientUnits="userSpaceOnUse"
            x1="112"
            y1="112"
            x2="116.5"
            y2="116.5"
          >
            <stop offset="0" stop-color="#343b3e" />
            <stop offset="1" stop-color="#272d30" />
          </linearGradient>
          <linearGradient :id="fills.fall" x2="0" y2="1">
            <stop offset="0" stop-opacity="0" />
            <stop offset="1" stop-opacity="0.3" />
          </linearGradient>
        </defs>
        <path
          :fill="`url(#${fills.top})`"
          d="M2.64 2.64L12.64-7.36A9 9 0 0 1 19-10H225A9 9 0 0 1 231.36-7.36L221.36 2.64 215 9H9Z"
        />
        <path :fill="`url(#${fills.side})`" :d="SIDE" />
        <path :fill="`url(#${fills.fall})`" :d="SIDE" />
      </svg>
      <div class="printer__body">
        <span class="printer__seam" aria-hidden="true" />
        <WallLabel class="printer__label" text="CV printer" :tilt="-2" />
        <span class="printer__led" aria-hidden="true"
          ><span class="printer__led-legend">Ready</span></span
        >
        <div class="printer__panel">
          <div
            class="printer__keys"
            role="group"
            aria-label="Template"
            :style="{ '--keys': printer.templates.length }"
          >
            <span class="printer__legend" aria-hidden="true">Template</span>
            <button
              v-for="t in printer.templates"
              :key="t.id"
              type="button"
              class="printer__key"
              :aria-pressed="template === t.id"
              :disabled="state === 'printing'"
              @click="template = t.id"
            >
              {{ t.label }}
            </button>
          </div>
          <div
            class="printer__keys"
            role="group"
            aria-label="Role"
            :style="{ '--keys': printer.roles.length }"
          >
            <span class="printer__legend" aria-hidden="true">Role</span>
            <button
              v-for="r in printer.roles"
              :key="r.id"
              type="button"
              class="printer__key"
              :aria-pressed="role === r.id"
              :disabled="state === 'printing'"
              @click="role = r.id"
            >
              {{ r.label }}
            </button>
          </div>
          <button
            ref="printKey"
            type="button"
            class="printer__print"
            :aria-disabled="state === 'printing'"
            @click="print"
          >
            Print
          </button>
        </div>
        <span class="printer__sticker" aria-hidden="true">
          <b>Thermal receipt printer</b>
          <span>Made for walls</span>
          <BarCode class="printer__sticker-code" seed="cv-printer" />
        </span>
        <span class="printer__vents" aria-hidden="true" />
        <span class="printer__slot" aria-hidden="true" />
      </div>
    </div>

    <button
      v-if="order && state !== 'ready' && outcome !== 'waiting'"
      ref="paper"
      type="button"
      class="printer__paper"
      :aria-label="outcome === 'jam' ? 'Clear the jammed receipt' : 'Take the printed CV'"
      :disabled="state !== 'printed'"
      @click="tear"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <span class="printer__receipt" aria-hidden="true">
        <span class="printer__shop">CV printer</span>
        <span class="printer__stamp">{{ order.stamp }}</span>
        <span class="printer__rule" />
        <span class="printer__heading">Your order</span>
        <span class="printer__item"><b>1 × CV</b><span>free</span></span>
        <span class="printer__option">template · {{ ordered.template?.label }}</span>
        <span class="printer__option">role · {{ ordered.role?.label }}</span>
        <span class="printer__rule" />
        <template v-if="outcome === 'jam'">
          <span class="printer__jam">{{ printer.jam.title }}</span>
          <span class="printer__jam-line">{{ printer.jam.line }}</span>
        </template>
        <template v-else>
          <span class="printer__name">{{ name }}</span>
          <span class="printer__focus">{{ ordered.role?.line }}</span>
          <span v-for="line in lines" :key="line.name" class="printer__line">
            <span class="printer__item"
              ><b>{{ line.lead ? '▸ ' : '' }}{{ line.name }}</b
              ><span>{{ line.when }}</span></span
            >
            <span class="printer__role">{{ line.role }}</span>
          </span>
          <span class="printer__contact">{{ email }}</span>
        </template>
        <span class="printer__rule" />
        <span class="printer__item printer__item--total"><b>Total</b><span>0.00</span></span>
        <span class="printer__item"><b>Paid with</b><span>curiosity</span></span>
        <BarCode class="printer__barcode" :seed="`${order.template}:${order.role}`" />
        <span class="printer__thanks">Thank you. Hiring? Write back.</span>
      </span>
    </button>

    <p v-if="state === 'printed'" class="printer__hint" aria-hidden="true">{{ printer.hint }}</p>
    <p v-if="note" class="printer__hint printer__hint--note" aria-hidden="true">
      {{ printer.note }}
    </p>
    <span class="u-visually-hidden" aria-live="polite">{{ status }}</span>
    <Teleport to="body">
      <div ref="check" class="printer__check" />
    </Teleport>
  </div>
</template>
