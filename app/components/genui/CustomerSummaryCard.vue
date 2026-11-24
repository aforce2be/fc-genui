<script setup lang="ts">
import { computed } from 'vue'
import { useActions } from '@json-render/vue'
import { findCustomer } from '../../../data/mock'

const props = defineProps<{ customerId: string, keyPoints: string[], reason: string }>()
const customer = computed(() => findCustomer(props.customerId))
const { execute } = useActions()
</script>

<template>
  <GenuiCard
    :title="customer?.name ?? customerId"
    :badge="customer?.ageBand"
    :reason="reason"
    ai-draft
  >
    <p class="summary-card__meta">
      최근 접촉 {{ customer?.lastContactDate ?? '-' }}
    </p>
    <ul class="point-list">
      <li
        v-for="(p, i) in keyPoints"
        :key="i"
        class="point-list__item"
      >
        {{ p }}
      </li>
    </ul>
    <template #actions>
      <button
        type="button"
        class="btn btn--primary"
        @click="execute({ action: 'call_customer', params: { customerId } })"
      >
        전화 걸기
      </button>
      <button
        type="button"
        class="btn"
        @click="execute({ action: 'open_customer_detail', params: { customerId } })"
      >
        고객 상세
      </button>
    </template>
  </GenuiCard>
</template>
