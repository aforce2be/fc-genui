import type { FcId } from '../../data/mock'

/**
 * 1차 범위 시나리오. 같은 목업 데이터를 페르소나·상황에 따라 다르게 조합한다.
 * (기획 문서 4-3, 카탈로그 문서 4장)
 */
export const SCENARIOS = {
  'veteran-morning': { label: '정미경 · 아침 브리핑', fcId: 'FC01', situation: '오전 9시 30분, 지점 PC. 오늘 연락할 고객과 오후 일정을 확인한다.' },
  'rookie-prep': { label: '김현수 · 상담 준비', fcId: 'FC02', situation: '오전 11시, 지점 PC. 14시 방문 상담을 준비한다. 상품 지식이 부족한 신입이다.' },
  'veteran-mobile': { label: '정미경 · 이동 중', fcId: 'FC01', situation: '오후 1시 30분, 이동 중 모바일. 다음 방문 고객을 빠르게 확인한다.' },
} as const satisfies Record<string, { label: string, fcId: FcId, situation: string }>

export type ScenarioId = keyof typeof SCENARIOS
export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[]
export const isScenarioId = (v: unknown): v is ScenarioId =>
  typeof v === 'string' && v in SCENARIOS
