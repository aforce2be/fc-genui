<script setup lang="ts">
/**
 * 진입 화면: 뼈대(헤더·내비·영역)는 고정, "오늘의 브리핑" 슬롯만 AI가 조합한다.
 * 명세는 하나, 렌더링은 pc/mo로 나뉜다 (카드 상한 R1은 디바이스별로 접기).
 */
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { CURRENT_FC } from '~/genui/context'
import { JSONUIProvider, Renderer, createStateStore } from '@json-render/vue'
import type { Spec } from '@json-render/core'
import { registry } from '~/genui/registry'
import { SCENARIOS, SCENARIO_IDS, type ScenarioId } from '~/genui/scenarios'
import { applyFold, SHOW_MORE_STATE_PATH, type Device, type Violation } from '~/genui/validate'
import { fcs, findCustomer } from '../../data/mock'

interface BriefingResponse {
  mode: 'mock' | 'live'
  blocked: boolean
  violations: Violation[]
  foldedKeys: string[]
  spec: Spec | null
}

const device = ref<Device>('pc')
const scenario = ref<ScenarioId>('veteran-morning')
const loading = ref(true)
const error = ref('')
const data = ref<BriefingResponse | null>(null)
const showMore = ref(false)
const lastAction = ref('')

const fc = computed(() => fcs.find(f => f.id === SCENARIOS[scenario.value].fcId))
provide(CURRENT_FC, computed(() => SCENARIOS[scenario.value].fcId))
const store = createStateStore({ ui: { showMore: false } })

const renderedSpec = computed(() =>
  data.value?.spec ? applyFold(data.value.spec, data.value.foldedKeys) : null,
)
const hiddenCount = computed(() => (showMore.value ? 0 : data.value?.foldedKeys.length ?? 0))

async function load() {
  loading.value = true
  error.value = ''
  showMore.value = false
  store.set(SHOW_MORE_STATE_PATH, false)
  try {
    data.value = await $fetch<BriefingResponse>('/api/briefing', {
      method: 'POST',
      body: { scenario: scenario.value, device: device.value },
    })
  }
  catch (e) {
    data.value = null
    error.value = e instanceof Error ? e.message : '브리핑을 불러오지 못했습니다'
  }
  finally {
    loading.value = false
  }
}

// 액션 실제 동작. PoC에서는 외부 연동 없이 안내만 표시한다.
const customerName = (p?: Record<string, unknown>) =>
  findCustomer(String(p?.customerId ?? ''))?.name ?? ''
const handlers = {
  call_customer: (p?: Record<string, unknown>) => { lastAction.value = `${customerName(p)} 고객에게 전화 연결 (목업)` },
  message_customer: (p?: Record<string, unknown>) => { lastAction.value = `${customerName(p)} 고객 메시지 작성 (목업)` },
  open_customer_detail: (p?: Record<string, unknown>) => { lastAction.value = `${customerName(p)} 고객 상세 열기 (목업)` },
  open_coverage_analysis: (p?: Record<string, unknown>) => { lastAction.value = `${customerName(p)} 보장분석 상세 열기 (목업)` },
  mark_done: (p?: Record<string, unknown>) => { lastAction.value = `${customerName(p)} 알림 처리 완료 (목업)` },
  show_more: () => {
    showMore.value = true
    store.set(SHOW_MORE_STATE_PATH, true)
  },
}

let mql: MediaQueryList | null = null
const syncDevice = () => {
  device.value = mql?.matches ? 'mo' : 'pc'
}

onMounted(() => {
  mql = window.matchMedia('(max-width: 767px)')
  syncDevice()
  if (device.value === 'mo') scenario.value = 'veteran-mobile'
  mql.addEventListener('change', syncDevice)
  load()
})
onBeforeUnmount(() => mql?.removeEventListener('change', syncDevice))
watch([scenario, device], () => load())
</script>

<template>
  <div
    class="layout"
    :class="`layout--${device}`"
  >
    <header class="layout__header">
      <h1 class="layout__brand">
        FC 브리핑
      </h1>
      <p class="layout__user">
        {{ fc?.name }} FC
      </p>
    </header>

    <nav
      class="layout__nav"
      aria-label="시나리오"
    >
      <button
        v-for="id in SCENARIO_IDS"
        :key="id"
        type="button"
        class="tab"
        :class="{ 'tab--active': scenario === id }"
        :aria-pressed="scenario === id"
        @click="scenario = id"
      >
        {{ SCENARIOS[id].label }}
      </button>
    </nav>

    <main
      class="layout__main"
      data-testid="briefing-slot"
    >
      <h2 class="sr-only">
        오늘의 브리핑
      </h2>
      <p
        v-if="loading"
        class="info-notice info-notice--info"
        role="status"
      >
        브리핑을 준비하고 있습니다…
      </p>
      <p
        v-else-if="error"
        class="info-notice info-notice--empty"
        role="alert"
      >
        {{ error }}
      </p>
      <div
        v-else-if="data?.blocked"
        class="info-notice info-notice--empty"
        role="alert"
        data-testid="blocked"
      >
        검증 규칙 위반으로 화면을 표시하지 않습니다
        ({{ [...new Set(data.violations.map(v => v.rule))].join(', ') }})
      </div>
      <template v-else-if="renderedSpec">
        <!-- JSONUIProvider = State + Visibility + Action + Validation provider 묶음 -->
        <JSONUIProvider
          :registry="registry"
          :store="store"
          :handlers="handlers"
        >
          <Renderer
            :spec="renderedSpec"
            :registry="registry"
          />
        </JSONUIProvider>
        <button
          v-if="hiddenCount > 0"
          type="button"
          class="btn btn--more"
          data-testid="show-more"
          @click="handlers.show_more()"
        >
          카드 {{ hiddenCount }}장 더보기
        </button>
      </template>

      <p
        class="layout__live"
        aria-live="polite"
      >
        {{ lastAction }}
      </p>
    </main>

    <footer class="layout__footer">
      <form
        class="layout__intent"
        @submit.prevent
      >
      <label
        class="sr-only"
        for="intent"
      >요청 입력</label>
      <input
        id="intent"
        class="layout__intent-input"
        type="text"
        placeholder="예: 이번 주 만기 고객만 보여줘 (준비 중)"
        disabled
      >
      </form>

      <p
        v-if="data"
        class="layout__mode"
      >
        명세 출처: {{ data.mode === 'mock' ? '목업 LLM' : 'LLM' }}
      </p>
    </footer>
  </div>
</template>
