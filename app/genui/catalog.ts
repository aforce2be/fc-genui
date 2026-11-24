/**
 * FC Gen UI — 컴포넌트 카탈로그 (v0.2)
 *
 * 원칙
 * 1. AI는 "무엇을, 어떤 순서로" 보여줄지만 정한다. 모양은 디자인 시스템이 정한다.
 * 2. AI는 ID만 고른다. 금액·날짜·이름 같은 사실 데이터는 컴포넌트가 목업 DB에서 직접 읽는다.
 *    → AI가 숫자를 지어내는 환각을 구조적으로 차단.
 * 3. 모든 카드는 reason(근거)이 필수다. 왜 이 카드가 이 위치에 있는지 FC에게 보여준다.
 * 4. 상품 추천 컴포넌트는 카탈로그에 없다. 없는 컴포넌트는 AI가 만들 수 없다. (금소법 대응)
 * 5. AI가 쓴 텍스트가 들어가는 카드에는 'AI 초안 · 약관 확인 필요' 라벨을 고정 표시한다.
 *
 * json-render 0.22.0 API 확인 완료 (defineCatalog, @json-render/vue/schema).
 * 명세 형식: { root: string, elements: Record<key, { type, props, children }> } — 루트는 반드시 1개.
 */
import { z } from 'zod'
import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/vue/schema'

/* ---------- 공통 타입 ---------- */

// 근거: 모든 카드 필수. 짧고 구체적으로.
const reason = z
  .string()
  .min(4)
  .max(40)
  .describe('이 카드를 보여주는 이유. 예: "갱신일 3일 전", "암 진단비 보장 없음"')

const customerId = z.string().regex(/^C\d{4}$/).describe('목업 DB의 고객 ID')
const policyId = z.string().regex(/^P\d{5}$/).describe('목업 DB의 계약 ID')

const coverageCategory = z.enum([
  'cancer', // 암
  'brain', // 뇌혈관
  'heart', // 심장
  'hospitalization', // 입원
  'surgery', // 수술
  'indemnity', // 실손
  'death', // 사망
  'pension', // 연금
])

/* ---------- 컴포넌트 분류 (검증 규칙에서 사용) ---------- */

/** 레이아웃·안내용. R1 카드 수에서 제외된다. */
export const NON_CARD_TYPES = ['BriefingSlot', 'BriefingSection', 'InfoNotice'] as const

/** AI 자유 텍스트가 들어가 'AI 초안 · 약관 확인 필요' 라벨이 고정되는 카드 */
export const AI_TEXT_CARD_TYPES = ['TalkingPointCard', 'CustomerSummaryCard'] as const

/* ---------- 카탈로그 ---------- */

export const catalog = defineCatalog(schema, {
  components: {
    /* ===== 레이아웃 ===== */

    BriefingSlot: {
      props: z.object({}),
      slots: ['default'],
      description:
        '브리핑 슬롯의 최상위 컨테이너. 명세의 root는 항상 이 컴포넌트 1개. 자식은 BriefingSection 또는 InfoNotice.',
    },

    BriefingSection: {
      props: z.object({
        title: z.string().max(20),
        reason,
      }),
      slots: ['default'],
      description:
        "카드들을 묶는 섹션. 화면당 최대 2개. 예: '오늘 연락할 고객', '오후 상담 준비'",
    },

    /* ===== 시나리오 2: 기존 고객 관리 ===== */

    CustomerAlertCard: {
      props: z.object({
        customerId,
        policyId: policyId.nullable(),
        alertType: z.enum([
          'renewal', // 갱신
          'maturity', // 만기
          'claim', // 보험금 청구 진행
          'lapse_risk', // 실효 위험(미납)
          'anniversary', // 생일·기념일
        ]),
        reason,
        // actions에 정의된 이름을 그대로 사용한다 (별도 매핑 없음)
        primaryAction: z.enum(['call_customer', 'message_customer', 'open_customer_detail']),
      }),
      description:
        '연락이 필요한 고객 1명. 고객명·날짜·상품명은 컴포넌트가 DB에서 읽으므로 AI는 ID만 지정. D-day가 가까운 순서로 배치.',
    },

    ScheduleTimeline: {
      props: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        reason,
      }),
      description: '해당 날짜의 방문·통화 일정. 일정 데이터는 DB에서 읽음.',
    },

    /* ===== 시나리오 1: 상담 준비 ===== */

    CoverageOverview: {
      props: z.object({
        customerId,
        highlight: z.array(coverageCategory).max(3),
        reason,
      }),
      description:
        '고객의 보장 현황 요약표. 보장 금액·상태는 DB에서 계산. AI는 강조할 카테고리만 최대 3개 지정.',
    },

    CoverageGapCard: {
      props: z.object({
        customerId,
        category: coverageCategory,
        reason,
      }),
      description:
        '보장 공백 1건. 상품을 추천하지 않는다. 공백 사실과 근거만 표시.',
    },

    TalkingPointCard: {
      props: z.object({
        topic: z.string().max(20),
        points: z.array(z.string().max(60)).min(1).max(3),
        reason,
      }),
      description:
        "상담 시 설명 포인트(신입 FC용). AI 생성 텍스트이므로 화면에 'AI 초안 · 약관 확인 필요' 라벨이 고정 표시됨. 특정 상품 가입을 권하는 문장 금지.",
    },

    /* ===== 모바일 이동 중 ===== */

    CustomerSummaryCard: {
      props: z.object({
        customerId,
        keyPoints: z.array(z.string().max(30)).min(1).max(3),
        reason,
      }),
      description:
        "방문 직전 확인용 고객 요약 1장. 이름·나이대·최근 접촉일은 DB에서 읽고, AI는 핵심 포인트 최대 3개만 작성. AI 생성 텍스트이므로 화면에 'AI 초안 · 약관 확인 필요' 라벨이 고정 표시됨.",
    },

    /* ===== 공통 ===== */

    InfoNotice: {
      props: z.object({
        tone: z.enum(['info', 'empty']),
        message: z.string().max(50),
      }),
      description: "안내 또는 빈 상태. 예: '오늘 연락할 고객이 없습니다'",
    },
  },

  actions: {
    call_customer: { description: '고객에게 전화 (기기 전화 앱 연결)' },
    message_customer: { description: '고객에게 메시지 작성' },
    open_customer_detail: { description: '고객 상세 화면 열기' },
    open_coverage_analysis: { description: '보장분석 상세 화면 열기' },
    mark_done: { description: '알림 처리 완료 표시' },
    show_more: { description: '상한을 넘어 접힌 카드 펼치기' },
  },
})

/* ---------- 스키마 밖 추가 검증 규칙 (validate.ts에서 실행) ---------- */

export const DEVICE_CARD_LIMIT = { pc: 5, mo: 3 } as const
export const MAX_SECTIONS = 2

/**
 * 규칙 목록 — 모든 위반은 logs/genui-violations.jsonl에 기록한다.
 * R1은 렌더를 막지 않고 초과분을 "더보기"(show_more)로 접는다. R2~R5는 렌더 전에 차단한다.
 * R1. 카드 수: pc 5장 / mo 3장 이하 (BriefingSlot·BriefingSection·InfoNotice 제외)
 * R2. ID 실존: 모든 customerId·policyId가 목업 DB에 존재해야 함 (가상 고객 생성 금지)
 * R3. 정렬: CustomerAlertCard는 D-day 오름차순
 * R4. 중복 금지: 같은 customerId + alertType 조합은 1회만
 * R5. 섹션 수: BriefingSection 화면당 최대 2개
 */
