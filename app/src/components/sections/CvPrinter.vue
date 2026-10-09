<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import BarCode from '@/components/ui/BarCode.vue'
import WallLabel from '@/components/ui/WallLabel.vue'
import type { Company } from '@/contents'
import { validity } from '@/utils/format'

/**
 * A receipt printer bolted to the wall that prints a CV: pick a template and a
 * role on its panel, press print, and a receipt feeds out, the order on top and
 * the CV under it; tear it off to take it. The receipt is the same whatever
 * the template: the order names it, and the PDF is what it shapes. A demo for now: the receipt is a
 * preview, built from the passes' companies, and tearing it off downloads
 * nothing yet.
 */
const props = defineProps<{ name: string; email: string; companies: readonly Company[] }>()

const TEMPLATES = ['One page', 'Classic'] as const
const ROLES = ['Platform', 'SRE', 'DevOps'] as const
type Template = (typeof TEMPLATES)[number]
type Role = (typeof ROLES)[number]

// What each role puts first: a line under the name, and the companies whose
// work it leans on.
const FOCUS: Record<Role, { line: string; leads: readonly string[] }> = {
  Platform: { line: 'Platforms teams ship on', leads: ['Banank', 'VK', 'Ozon Tech'] },
  SRE: { line: 'Keeps the work running', leads: ['Aqua Security', 'VK', 'Banank'] },
  DevOps: { line: 'Releases nobody babysits', leads: ['Ozon Tech', 'VK', 'ForkJoin'] },
}

// The feed, and how long a torn receipt takes to fall; mirrored in _printer.scss.
const FEED_MS = 2200
const FALL_MS = 700

const template = ref<Template>('One page')
const role = ref<Role>('Platform')
const state = ref<'ready' | 'printing' | 'printed' | 'torn'>('ready')
const note = ref(false)
// When the receipt was printed, as a till prints it.
const stamp = ref('')
const status = computed(
  () =>
    ({
      ready: '',
      printing: 'Printing…',
      printed: 'Printed. Take the receipt to keep it.',
      torn: 'Taken.',
    })[state.value],
)

// The latest first, as a CV lists them.
const lines = computed(() =>
  [...props.companies].reverse().map((company) => ({
    name: company.name,
    role: company.role,
    when: validity(company.from, company.to).replace('since ', ''),
    lead: FOCUS[role.value].leads.includes(company.name),
  })),
)

let timer = 0
const later = (ms: number, then: () => void) => {
  clearTimeout(timer)
  timer = window.setTimeout(then, ms)
}
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const two = (n: number) => String(n).padStart(2, '0')

function print() {
  if (state.value === 'printing') return
  const now = new Date()
  stamp.value = `${two(now.getDate())}.${two(now.getMonth() + 1)}.${String(now.getFullYear()).slice(2)} ${two(now.getHours())}:${two(now.getMinutes())}`
  note.value = false
  state.value = 'printing'
  later(still() ? 0 : FEED_MS, () => (state.value = 'printed'))
}

function tear() {
  if (state.value !== 'printed') return
  state.value = 'torn'
  later(still() ? 0 : FALL_MS, () => {
    state.value = 'ready'
    note.value = true
    later(3200, () => (note.value = false))
  })
}

// A pull down the receipt tears it as a click does.
let pullFrom: number | null = null
const onPointerDown = (e: PointerEvent) => (pullFrom = e.clientY)
const onPointerMove = (e: PointerEvent) => {
  if (pullFrom !== null && e.clientY - pullFrom > 36) {
    pullFrom = null
    tear()
  }
}
const onPointerUp = () => (pullFrom = null)

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="printer" :class="`printer--${state}`">
    <!-- The cable out of the side and down the wall into a socket, behind
         everything. -->
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
      <!-- Its top and its right side, seen a little from above and the left. -->
      <svg class="printer__depth" aria-hidden="true" focusable="false">
        <path class="printer__top" d="M9 0H215Q224 0 229 -5L234 -10H19Q13 -10 9 0Z" />
        <path
          class="printer__side"
          d="M224 9Q224 0 229 -5L234 -10V246Q234 251 230 254L224 257V9Z"
        />
      </svg>
      <div class="printer__body">
        <span class="printer__seam" aria-hidden="true" />
        <WallLabel class="printer__label" text="CV printer" :tilt="-2" />
        <span class="printer__led" aria-hidden="true"><i>Ready</i></span>
        <!-- A membrane panel set into the case, its legends printed on. -->
        <div class="printer__panel">
          <div
            class="printer__keys"
            role="group"
            aria-label="Template"
            :style="{ '--keys': TEMPLATES.length }"
          >
            <span class="printer__legend" aria-hidden="true">Template</span>
            <button
              v-for="t in TEMPLATES"
              :key="t"
              type="button"
              class="printer__key"
              :aria-pressed="template === t"
              :disabled="state === 'printing'"
              @click="template = t"
            >
              {{ t }}
            </button>
          </div>
          <div
            class="printer__keys"
            role="group"
            aria-label="Role"
            :style="{ '--keys': ROLES.length }"
          >
            <span class="printer__legend" aria-hidden="true">Role</span>
            <button
              v-for="r in ROLES"
              :key="r"
              type="button"
              class="printer__key"
              :aria-pressed="role === r"
              :disabled="state === 'printing'"
              @click="role = r"
            >
              {{ r }}
            </button>
          </div>
          <button
            type="button"
            class="printer__print"
            :disabled="state === 'printing'"
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

    <!-- The receipt, fed out of the slot behind the printer's tear bar. -->
    <button
      v-if="state === 'printing' || state === 'printed' || state === 'torn'"
      type="button"
      class="printer__paper"
      aria-label="Take the printed CV"
      :disabled="state !== 'printed'"
      @click="tear"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <span class="printer__receipt" aria-hidden="true">
        <span class="printer__shop">CV printer</span>
        <span class="printer__stamp">{{ stamp }}</span>
        <span class="printer__rule" />
        <span class="printer__heading">Your order</span>
        <span class="printer__item"><b>1 × CV</b><i>free</i></span>
        <span class="printer__option">template · {{ template }}</span>
        <span class="printer__option">role · {{ role }}</span>
        <span class="printer__rule" />
        <span class="printer__name">{{ name }}</span>
        <span class="printer__focus">{{ FOCUS[role].line }}</span>
        <span v-for="line in lines" :key="line.name" class="printer__line">
          <span class="printer__item"
            ><b>{{ line.lead ? '▸ ' : '' }}{{ line.name }}</b
            ><i>{{ line.when }}</i></span
          >
          <span class="printer__role">{{ line.role }}</span>
        </span>
        <span class="printer__contact">{{ email }}</span>
        <span class="printer__rule" />
        <span class="printer__item printer__item--total"><b>Total</b><i>0.00</i></span>
        <span class="printer__item"><b>Paid with</b><i>curiosity</i></span>
        <BarCode class="printer__barcode" :seed="`${template}:${role}`" />
        <span class="printer__thanks">Thank you. Hiring? Write back.</span>
      </span>
    </button>

    <p v-if="state === 'printed'" class="printer__hint" aria-hidden="true">tear it off</p>
    <p v-if="note" class="printer__hint printer__hint--note" aria-hidden="true">
      demo: the PDF lands here
    </p>
    <span class="u-visually-hidden" aria-live="polite">{{ status }}</span>
  </div>
</template>
