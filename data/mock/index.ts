/**
 * 목업 DB (최소 시드). 모든 인물·계약은 가상이다. 실제 고객·회사 데이터 사용 금지.
 * 상세 스키마는 별도 단계에서 설계한다 — 지금은 카탈로그 8종을 렌더하는 데 필요한 필드만 둔다.
 *
 * 컴포넌트는 AI가 넘긴 ID로 여기서 사실 데이터(이름·날짜·금액)를 직접 읽는다.
 */

/** 목업 기준일. D-day 계산과 테스트 결과를 고정하기 위해 실제 오늘 날짜를 쓰지 않는다. */
export const MOCK_TODAY = '2026-11-24'

export type FcId = 'FC01' | 'FC02'
export type AlertType = 'renewal' | 'maturity' | 'claim' | 'lapse_risk' | 'anniversary'
export type CoverageCategory =
  | 'cancer' | 'brain' | 'heart' | 'hospitalization'
  | 'surgery' | 'indemnity' | 'death' | 'pension'

export interface Fc { id: FcId, name: string, persona: 'veteran' | 'rookie' }
export interface Customer {
  id: string
  fcId: FcId
  name: string
  ageBand: string
  phoneMasked: string
  lastContactDate: string
}
export interface Policy {
  id: string
  customerId: string
  productName: string
  renewalType: 'renewable' | 'non_renewable'
}
export interface Alert {
  customerId: string
  policyId: string | null
  alertType: AlertType
  dueDate: string
  note: string
}
export interface ScheduleItem {
  fcId: FcId
  date: string
  time: string
  customerId: string
  kind: 'visit' | 'call'
  place: string
}
export interface Coverage {
  customerId: string
  category: CoverageCategory
  /** 만원 단위. 0이면 보장 없음 */
  amount: number
}

export const fcs: Fc[] = [
  { id: 'FC01', name: '정미경', persona: 'veteran' },
  { id: 'FC02', name: '김현수', persona: 'rookie' },
]

export const customers: Customer[] = [
  { id: 'C0001', fcId: 'FC01', name: '박서준', ageBand: '40대', phoneMasked: '010-****-1201', lastContactDate: '2026-10-02' },
  { id: 'C0002', fcId: 'FC01', name: '이영자', ageBand: '60대', phoneMasked: '010-****-3308', lastContactDate: '2026-08-19' },
  { id: 'C0003', fcId: 'FC01', name: '최민호', ageBand: '30대', phoneMasked: '010-****-7745', lastContactDate: '2026-11-10' },
  { id: 'C0004', fcId: 'FC01', name: '한지은', ageBand: '50대', phoneMasked: '010-****-5562', lastContactDate: '2026-09-28' },
  { id: 'C0005', fcId: 'FC02', name: '오세훈', ageBand: '40대', phoneMasked: '010-****-9013', lastContactDate: '2026-11-17' },
]

export const policies: Policy[] = [
  { id: 'P10001', customerId: 'C0001', productName: '가상 건강보험 A형', renewalType: 'renewable' },
  { id: 'P10002', customerId: 'C0002', productName: '가상 종신보험', renewalType: 'non_renewable' },
  { id: 'P10003', customerId: 'C0003', productName: '가상 실손보험', renewalType: 'renewable' },
  { id: 'P10004', customerId: 'C0004', productName: '가상 연금보험', renewalType: 'non_renewable' },
  { id: 'P10005', customerId: 'C0005', productName: '가상 실손보험', renewalType: 'renewable' },
]

export const alerts: Alert[] = [
  { customerId: 'C0001', policyId: 'P10001', alertType: 'renewal', dueDate: '2026-11-27', note: '갱신 예정' },
  { customerId: 'C0002', policyId: 'P10002', alertType: 'lapse_risk', dueDate: '2026-11-30', note: '보험료 2회 미납' },
  { customerId: 'C0003', policyId: 'P10003', alertType: 'claim', dueDate: '2026-12-02', note: '청구 서류 미제출' },
  { customerId: 'C0004', policyId: null, alertType: 'anniversary', dueDate: '2026-12-05', note: '생일' },
  { customerId: 'C0004', policyId: 'P10004', alertType: 'maturity', dueDate: '2027-01-15', note: '연금 개시 예정' },
]

export const schedules: ScheduleItem[] = [
  { fcId: 'FC01', date: '2026-11-24', time: '14:00', customerId: 'C0001', kind: 'visit', place: '고객 자택' },
  { fcId: 'FC01', date: '2026-11-24', time: '16:30', customerId: 'C0004', kind: 'call', place: '전화' },
  { fcId: 'FC02', date: '2026-11-24', time: '14:00', customerId: 'C0005', kind: 'visit', place: '지점 상담실' },
]

export const coverages: Coverage[] = [
  { customerId: 'C0005', category: 'cancer', amount: 0 },
  { customerId: 'C0005', category: 'brain', amount: 1000 },
  { customerId: 'C0005', category: 'heart', amount: 1000 },
  { customerId: 'C0005', category: 'hospitalization', amount: 3 },
  { customerId: 'C0005', category: 'surgery', amount: 50 },
  { customerId: 'C0005', category: 'indemnity', amount: 5000 },
  { customerId: 'C0005', category: 'death', amount: 0 },
  { customerId: 'C0005', category: 'pension', amount: 0 },
  { customerId: 'C0001', category: 'cancer', amount: 3000 },
  { customerId: 'C0001', category: 'indemnity', amount: 5000 },
]

/* ---------- 조회 헬퍼 ---------- */

export const findCustomer = (id: string) => customers.find(c => c.id === id)
export const findPolicy = (id: string) => policies.find(p => p.id === id)
export const findAlert = (customerId: string, alertType: AlertType) =>
  alerts.find(a => a.customerId === customerId && a.alertType === alertType)
export const coveragesOf = (customerId: string) => coverages.filter(c => c.customerId === customerId)
export const schedulesOf = (date: string, fcId?: FcId) =>
  schedules.filter(s => s.date === date && (!fcId || s.fcId === fcId))

/** 기준일(MOCK_TODAY) 대비 남은 일수. 지난 날짜는 음수. */
export function dDay(date: string, today: string = MOCK_TODAY): number {
  const ms = Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

export const CATEGORY_LABEL: Record<CoverageCategory, string> = {
  cancer: '암', brain: '뇌혈관', heart: '심장', hospitalization: '입원',
  surgery: '수술', indemnity: '실손', death: '사망', pension: '연금',
}

export const ALERT_LABEL: Record<AlertType, string> = {
  renewal: '갱신', maturity: '만기', claim: '청구', lapse_risk: '실효 위험', anniversary: '기념일',
}
