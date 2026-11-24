<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORY_LABEL, coveragesOf, findCustomer, type CoverageCategory } from '../../../data/mock'

// 상품을 추천하지 않는다. 공백 사실과 근거만 표시한다.
const props = defineProps<{ customerId: string, category: CoverageCategory, reason: string }>()
const customer = computed(() => findCustomer(props.customerId))
const current = computed(() => coveragesOf(props.customerId).find(c => c.category === props.category))
</script>

<template>
  <GenuiCard
    :title="`${CATEGORY_LABEL[category]} 보장 공백`"
    badge="보장 공백"
    tone="warning"
    :reason="reason"
  >
    <p class="gap-card__fact">
      {{ customer?.name ?? customerId }} 고객 ·
      {{ CATEGORY_LABEL[category] }}:
      <strong>{{ !current || current.amount === 0 ? '보장 없음' : `${current.amount.toLocaleString('ko-KR')}만원` }}</strong>
    </p>
  </GenuiCard>
</template>
