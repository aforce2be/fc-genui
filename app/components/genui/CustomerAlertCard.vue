<script setup lang="ts">
import { computed } from 'vue'
import { useActions } from '@json-render/vue'
import { ALERT_LABEL, dDay, findAlert, findCustomer, findPolicy, type AlertType } from '../../../data/mock'

const props = defineProps<{
  customerId: string
  policyId: string | null
  alertType: AlertType
  reason: string
  primaryAction: 'call_customer' | 'message_customer' | 'open_customer_detail'
}>()

// 사실 데이터는 전부 목업 DB에서 읽는다 (AI 출력에는 ID만 있음)
const customer = computed(() => findCustomer(props.customerId))
const policy = computed(() => (props.policyId ? findPolicy(props.policyId) : undefined))
const alert = computed(() => findAlert(props.customerId, props.alertType))
const dday = computed(() => (alert.value ? dDay(alert.value.dueDate) : null))

const ACTION_LABEL = {
  call_customer: '전화 걸기',
  message_customer: '메시지 작성',
  open_customer_detail: '고객 상세',
} as const

const { execute } = useActions()
const run = (action: string) => execute({ action, params: { customerId: props.customerId } })
</script>

<template>
  <GenuiCard
    :title="customer?.name ?? props.customerId"
    :badge="ALERT_LABEL[alertType]"
    :reason="reason"
    :tone="alertType === 'lapse_risk' ? 'warning' : 'default'"
  >
    <dl class="alert-card__facts">
      <div class="alert-card__fact">
        <dt>D-day</dt>
        <dd class="alert-card__dday">
          {{ dday === null ? '-' : dday >= 0 ? `D-${dday}` : `D+${-dday}` }}
        </dd>
      </div>
      <div
        v-if="policy"
        class="alert-card__fact"
      >
        <dt>계약</dt>
        <dd>{{ policy.productName }}</dd>
      </div>
      <div
        v-if="alert"
        class="alert-card__fact"
      >
        <dt>예정일</dt>
        <dd>{{ alert.dueDate }}</dd>
      </div>
    </dl>
    <template #actions>
      <button
        type="button"
        class="btn btn--primary"
        @click="run(primaryAction)"
      >
        {{ ACTION_LABEL[primaryAction] }}
      </button>
      <button
        type="button"
        class="btn"
        @click="run('mark_done')"
      >
        처리 완료
      </button>
    </template>
  </GenuiCard>
</template>
