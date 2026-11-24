/**
 * 카탈로그 이름 → Vue 컴포넌트 연결.
 * json-render는 카탈로그 Zod 스키마로 검증된 props를 넘겨준다. 컴포넌트는 ID로 목업 DB를 직접 읽는다.
 */
import { h } from 'vue'
import { defineRegistry } from '@json-render/vue'
import { catalog } from './catalog'
import BriefingSlot from '~/components/genui/BriefingSlot.vue'
import BriefingSection from '~/components/genui/BriefingSection.vue'
import CustomerAlertCard from '~/components/genui/CustomerAlertCard.vue'
import ScheduleTimeline from '~/components/genui/ScheduleTimeline.vue'
import CoverageOverview from '~/components/genui/CoverageOverview.vue'
import CoverageGapCard from '~/components/genui/CoverageGapCard.vue'
import TalkingPointCard from '~/components/genui/TalkingPointCard.vue'
import CustomerSummaryCard from '~/components/genui/CustomerSummaryCard.vue'
import InfoNotice from '~/components/genui/InfoNotice.vue'

// 액션의 실제 동작은 페이지의 ActionProvider handlers가 담당한다. 여기는 카탈로그가 요구하는 자리만 채운다.
const noop = async () => {}

export const { registry } = defineRegistry(catalog, {
  components: {
    BriefingSlot: ({ children }) => h(BriefingSlot, null, { default: () => children }),
    BriefingSection: ({ props, children }) => h(BriefingSection, props, { default: () => children }),
    CustomerAlertCard: ({ props }) => h(CustomerAlertCard, props),
    ScheduleTimeline: ({ props }) => h(ScheduleTimeline, props),
    CoverageOverview: ({ props }) => h(CoverageOverview, props),
    CoverageGapCard: ({ props }) => h(CoverageGapCard, props),
    TalkingPointCard: ({ props }) => h(TalkingPointCard, props),
    CustomerSummaryCard: ({ props }) => h(CustomerSummaryCard, props),
    InfoNotice: ({ props }) => h(InfoNotice, props),
  },
  actions: {
    call_customer: noop,
    message_customer: noop,
    open_customer_detail: noop,
    open_coverage_analysis: noop,
    mark_done: noop,
    show_more: noop,
  },
})
