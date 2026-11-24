<script setup lang="ts">
import { computed, inject } from 'vue'
import { findCustomer, schedulesOf } from '../../../data/mock'
import { CURRENT_FC } from '~/genui/context'

const props = defineProps<{ date: string, reason: string }>()
const fcId = inject(CURRENT_FC)
// 현재 FC의 일정만 보여준다. FC를 모르면 아무것도 보여주지 않는다 (다른 FC 데이터 노출 방지).
const items = computed(() =>
  fcId ? schedulesOf(props.date, fcId.value).slice().sort((a, b) => a.time.localeCompare(b.time)) : [],
)
</script>

<template>
  <GenuiCard
    :title="`${date} 일정`"
    :reason="reason"
  >
    <ol
      v-if="items.length"
      class="timeline"
    >
      <li
        v-for="item in items"
        :key="`${item.time}-${item.customerId}`"
        class="timeline__item"
      >
        <span class="timeline__time">{{ item.time }}</span>
        <span class="timeline__what">
          {{ findCustomer(item.customerId)?.name }} · {{ item.kind === 'visit' ? '방문' : '통화' }}
        </span>
        <span class="timeline__place">{{ item.place }}</span>
      </li>
    </ol>
    <p
      v-else
      class="timeline__empty"
    >
      일정이 없습니다
    </p>
  </GenuiCard>
</template>
