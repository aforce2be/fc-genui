/**
 * Gen UI 명세 검증 (렌더 전에 실행). 서버(server/api/briefing.post.ts)와 클라이언트가 함께 쓴다.
 *
 * - SCHEMA: 카탈로그 Zod 스키마 + json-render 구조 검증 → 위반 시 렌더 차단
 * - R1 카드 수 초과 → 렌더하되 초과분은 "더보기"로 접는다
 * - R2~R5 → 렌더 차단
 * 모든 위반은 호출 측이 logs/genui-violations.jsonl에 기록한다.
 */
import type { ZodType } from 'zod'
import { validateSpec, type Spec, type UIElement } from '@json-render/core'
import { catalog, DEVICE_CARD_LIMIT, MAX_SECTIONS, NON_CARD_TYPES } from './catalog'
import { findAlert, findCustomer, findPolicy, dDay, type AlertType } from '../../data/mock'

export type Device = keyof typeof DEVICE_CARD_LIMIT
export type RuleId = 'SCHEMA' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5'

export interface Violation {
  rule: RuleId
  message: string
  elementKey?: string
}

export interface ValidationResult {
  /** true면 렌더하지 않는다 (SCHEMA, R2~R5 위반) */
  blocked: boolean
  violations: Violation[]
  /** R1 초과로 "더보기"에 접을 카드 key (렌더 순서) */
  foldedKeys: string[]
}

/** 상한을 넘어 접힌 카드가 펼쳐졌는지 저장하는 state 경로 */
export const SHOW_MORE_STATE_PATH = '/ui/showMore'

const BLOCKING_RULES: RuleId[] = ['SCHEMA', 'R2', 'R3', 'R4', 'R5']

/** root에서 깊이 우선으로 따라가며 화면에 그려지는 순서대로 key를 반환한다. */
export function renderOrder(spec: Spec): string[] {
  const order: string[] = []
  const seen = new Set<string>()
  const visit = (key: string) => {
    if (seen.has(key)) return
    seen.add(key)
    const el = spec.elements[key]
    if (!el) return
    order.push(key)
    el.children?.forEach(visit)
  }
  visit(spec.root)
  return order
}

const isCard = (el: UIElement) => !(NON_CARD_TYPES as readonly string[]).includes(el.type)

export function validateBriefing(input: unknown, device: Device): ValidationResult {
  const violations: Violation[] = []

  // ---- SCHEMA ----
  const parsed = catalog.validate(input)
  if (!parsed.success) {
    for (const issue of parsed.error?.issues ?? []) {
      violations.push({ rule: 'SCHEMA', message: `${issue.path.join('.')}: ${issue.message}` })
    }
    if (violations.length === 0) violations.push({ rule: 'SCHEMA', message: '카탈로그 스키마 불일치' })
    return { blocked: true, violations, foldedKeys: [] }
  }
  const spec = input as Spec
  const structure = validateSpec(spec)
  for (const issue of structure.issues) {
    if (issue.severity === 'error') {
      violations.push({ rule: 'SCHEMA', message: issue.message, elementKey: issue.elementKey })
    }
  }
  // catalog.validate()는 컴포넌트별 props를 검사하지 않으므로(0.22.0 기준) 직접 검사한다.
  const componentDefs = catalog.data.components as Record<string, { props: ZodType }>
  for (const [key, el] of Object.entries(spec.elements)) {
    const def = componentDefs[el.type]
    if (!def) {
      violations.push({ rule: 'SCHEMA', message: `카탈로그에 없는 컴포넌트: ${el.type}`, elementKey: key })
      continue
    }
    const res = def.props.safeParse(el.props)
    if (!res.success) {
      for (const issue of res.error.issues) {
        violations.push({ rule: 'SCHEMA', message: `${el.type}.${issue.path.join('.')}: ${issue.message}`, elementKey: key })
      }
    }
  }
  const rootEl = spec.elements[spec.root]
  if (rootEl && rootEl.type !== 'BriefingSlot') {
    violations.push({ rule: 'SCHEMA', message: 'root는 BriefingSlot이어야 합니다', elementKey: spec.root })
  }
  if (violations.length > 0) return { blocked: true, violations, foldedKeys: [] }

  const ordered = renderOrder(spec).map(key => ({ key, el: spec.elements[key]! }))

  // ---- R2 ID 실존 ----
  for (const { key, el } of ordered) {
    const props = el.props as Record<string, unknown>
    const cid = props.customerId
    if (typeof cid === 'string' && !findCustomer(cid)) {
      violations.push({ rule: 'R2', message: `존재하지 않는 고객 ID: ${cid}`, elementKey: key })
    }
    const pid = props.policyId
    if (typeof pid === 'string') {
      const policy = findPolicy(pid)
      if (!policy) {
        violations.push({ rule: 'R2', message: `존재하지 않는 계약 ID: ${pid}`, elementKey: key })
      }
      else if (typeof cid === 'string' && policy.customerId !== cid) {
        violations.push({ rule: 'R2', message: `계약 ${pid}는 고객 ${cid}의 계약이 아닙니다`, elementKey: key })
      }
    }
    if (el.type === 'CustomerAlertCard' && typeof cid === 'string' && findCustomer(cid)
      && !findAlert(cid, props.alertType as AlertType)) {
      violations.push({ rule: 'R2', message: `DB에 없는 알림: ${cid} / ${String(props.alertType)}`, elementKey: key })
    }
  }

  // ---- R3 정렬 (CustomerAlertCard D-day 오름차순, 화면 전체 기준) ----
  let prev: { key: string, d: number } | null = null
  for (const { key, el } of ordered) {
    if (el.type !== 'CustomerAlertCard') continue
    const props = el.props as { customerId: string, alertType: AlertType }
    const alert = findAlert(props.customerId, props.alertType)
    if (!alert) continue // R2에서 이미 기록
    const d = dDay(alert.dueDate)
    if (prev && d < prev.d) {
      violations.push({ rule: 'R3', message: `D-day 정렬 위반: ${prev.key}(D-${prev.d}) 다음에 ${key}(D-${d})`, elementKey: key })
    }
    prev = { key, d }
  }

  // ---- R4 중복 금지 ----
  const pairs = new Set<string>()
  for (const { key, el } of ordered) {
    if (el.type !== 'CustomerAlertCard') continue
    const props = el.props as { customerId: string, alertType: string }
    const pair = `${props.customerId}:${props.alertType}`
    if (pairs.has(pair)) {
      violations.push({ rule: 'R4', message: `중복 알림: ${pair}`, elementKey: key })
    }
    pairs.add(pair)
  }

  // ---- R5 섹션 수 ----
  const sections = ordered.filter(({ el }) => el.type === 'BriefingSection')
  if (sections.length > MAX_SECTIONS) {
    violations.push({ rule: 'R5', message: `BriefingSection ${sections.length}개 (최대 ${MAX_SECTIONS})` })
  }

  // ---- R1 카드 수 (접기) ----
  const limit = DEVICE_CARD_LIMIT[device]
  const cards = ordered.filter(({ el }) => isCard(el))
  const foldedKeys = cards.slice(limit).map(c => c.key)
  if (foldedKeys.length > 0) {
    violations.push({ rule: 'R1', message: `${device} 카드 ${cards.length}장 (상한 ${limit}) — ${foldedKeys.length}장 접음` })
  }

  const blocked = violations.some(v => BLOCKING_RULES.includes(v.rule))
  return { blocked, violations, foldedKeys: blocked ? [] : foldedKeys }
}

/**
 * R1 초과 카드에 visible 조건을 붙인 새 명세를 만든다.
 * 펼침 여부는 json-render state(SHOW_MORE_STATE_PATH)로 제어한다.
 */
export function applyFold(spec: Spec, foldedKeys: string[]): Spec {
  if (foldedKeys.length === 0) return spec
  const elements = { ...spec.elements }
  for (const key of foldedKeys) {
    const el = elements[key]
    if (el) elements[key] = { ...el, visible: { $state: SHOW_MORE_STATE_PATH } }
  }
  return { ...spec, elements }
}
