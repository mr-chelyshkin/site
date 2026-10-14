<script setup lang="ts">
import PastedSheet from '@/components/ui/PastedSheet.vue'
import CiCode from '@/components/sections/ci-platform/CiCode.vue'
import CiInline from '@/components/sections/ci-platform/CiInline.vue'
import CiLinks from '@/components/sections/ci-platform/CiLinks.vue'
import CiZones from '@/components/sections/ci-platform/CiZones.vue'
import type { GuideLabels, GuideStep } from '@/components/sections/ci-platform/types'

defineProps<{
  step: GuideStep
  labels: GuideLabels
  tilt: number
}>()
</script>

<template>
  <article :id="step.id" class="ci-step" :aria-labelledby="`${step.id}-title`">
    <PastedSheet class="ci-step__sheet" :seed="step.id" stock="paper" :tape="['top']" :tilt="tilt">
      <div class="ci-step__body">
        <header class="ci-step__head">
          <span class="ci-step__number" aria-hidden="true">{{ step.number }}</span>
          <div>
            <p class="c-kicker ci-step__kicker">
              <span>{{ labels.step }} {{ step.number }}</span>
            </p>
            <h3 :id="`${step.id}-title`" class="ci-step__title">{{ step.title }}</h3>
          </div>
        </header>

        <p class="ci-step__why"><CiInline :text="step.why" /></p>

        <p class="ci-step__label">{{ labels.do }}</p>
        <ol class="ci-step__actions" role="list">
          <li v-for="(action, i) in step.actions" :key="i" class="ci-step__action">
            <CiInline :text="action" />
          </li>
        </ol>

        <CiCode
          v-for="(block, i) in step.code ?? []"
          :key="i"
          :label="block.label"
          :code="block.code"
          :copy-label="labels.copy"
          :copied-label="labels.copied"
        />

        <table v-if="step.table" class="ci-step__table">
          <caption class="c-kicker ci-step__table-caption">
            {{
              step.table.caption
            }}
          </caption>
          <tbody>
            <tr v-for="(row, i) in step.table.rows" :key="i" class="ci-step__table-row">
              <th scope="row" class="ci-step__table-flag">
                <code>{{ row.flag }}</code>
              </th>
              <td class="ci-step__table-note">{{ row.note }}</td>
            </tr>
          </tbody>
        </table>

        <CiZones v-if="step.zones" :content="step.zones" />

        <p class="ci-step__check">
          <span class="ci-step__check-label">{{ labels.check }}</span
          >{{ ' ' }}<CiInline :text="step.check" />
        </p>

        <p v-if="step.tip" class="ci-step__tip">
          <b class="ci-step__tip-label">{{ labels.tip }}</b
          >{{ ' ' }}<CiInline :text="step.tip" />
        </p>

        <CiLinks
          v-if="step.links.length"
          :label="labels.example"
          :links="step.links"
          :new-tab="labels.newTab"
        />
      </div>
    </PastedSheet>
  </article>
</template>
