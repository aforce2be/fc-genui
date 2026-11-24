<script setup lang="ts">
import { computed } from 'vue'
import { useActions } from '@json-render/vue'
import { CATEGORY_LABEL, coveragesOf, findCustomer, type CoverageCategory } from '../../../data/mock'

const props = defineProps<{ customerId: string, highlight: CoverageCategory[], reason: string }>()
const customer = computed(() => findCustomer(props.customerId))
const rows = computed(() => coveragesOf(props.customerId))
const { execute } = useActions()
</script>

<template>
  <GenuiCard
    :title="`${customer?.name ?? customerId} 보장 현황`"
    :reason="reason"
  >
    <table class="coverage-table">
      <caption class="sr-only">
        보장 카테고리별 가입 금액
      </caption>
      <thead>
        <tr>
          <th scope="col">
            보장
          </th>
          <th scope="col">
            가입 금액
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.category"
          class="coverage-table__row"
          :class="{
            'coverage-table__row--highlight': highlight.includes(row.category),
            'coverage-table__row--gap': row.amount === 0,
          }"
        >
          <th scope="row">
            {{ CATEGORY_LABEL[row.category] }}
          </th>
          <td>{{ row.amount === 0 ? '보장 없음' : `${row.amount.toLocaleString('ko-KR')}만원` }}</td>
        </tr>
      </tbody>
    </table>
    <template #actions>
      <button
        type="button"
        class="btn"
        @click="execute({ action: 'open_coverage_analysis', params: { customerId } })"
      >
        보장분석 상세
      </button>
    </template>
  </GenuiCard>
</template>
