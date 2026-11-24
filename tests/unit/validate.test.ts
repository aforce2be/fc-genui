import { describe, expect, it } from 'vitest'
import { applyFold, renderOrder, SHOW_MORE_STATE_PATH, validateBriefing } from '../../app/genui/validate'
import veteranMorning from '../fixtures/veteran-morning.json'
import rookiePrep from '../fixtures/rookie-prep.json'
import veteranMobile from '../fixtures/veteran-mobile.json'

type El = { type: string, props: Record<string, unknown>, children: string[] }
type TestSpec = { root: string, elements: Record<string, El> }

const clone = <T>(v: T): T => structuredClone(v)

/** 섹션 하나에 카드들을 넣은 명세를 만든다. */
function specWith(cards: El[], extraSections = 0): TestSpec {
  const keys = cards.map((_, i) => `card-${i}`)
  const sections = Array.from({ length: 1 + extraSections }, (_, i) => `sec-${i}`)
  const elements: Record<string, El> = {
    slot: { type: 'BriefingSlot', props: {}, children: sections },
  }
  sections.forEach((s, i) => {
    elements[s] = {
      type: 'BriefingSection',
      props: { title: `섹션 ${i}`, reason: '테스트용 섹션' },
      children: i === 0 ? keys : [],
    }
  })
  cards.forEach((c, i) => { elements[keys[i]!] = c })
  return { root: 'slot', elements }
}

const alertCard = (customerId: string, policyId: string | null, alertType: string): El => ({
  type: 'CustomerAlertCard',
  props: { customerId, policyId, alertType, reason: '테스트 근거', primaryAction: 'call_customer' },
  children: [],
})
const gapCard = (category: string): El => ({
  type: 'CoverageGapCard',
  props: { customerId: 'C0005', category, reason: '테스트 근거' },
  children: [],
})

describe('fixtures (골든셋 씨앗)', () => {
  it.each([
    ['veteran-morning', veteranMorning, 'pc'],
    ['rookie-prep', rookiePrep, 'pc'],
    ['veteran-mobile', veteranMobile, 'mo'],
  ] as const)('%s는 모든 규칙을 통과한다', (_, spec, device) => {
    const r = validateBriefing(clone(spec), device)
    expect(r.violations).toEqual([])
    expect(r.blocked).toBe(false)
  })
})

describe('SCHEMA', () => {
  it('카탈로그에 없는 컴포넌트는 차단', () => {
    const spec = specWith([{ type: 'ProductRecommendCard', props: { reason: '추천' }, children: [] }])
    const r = validateBriefing(spec, 'pc')
    expect(r.blocked).toBe(true)
    expect(r.violations[0]!.rule).toBe('SCHEMA')
  })

  it('reason 누락은 차단', () => {
    const spec = specWith([gapCard('cancer')])
    delete spec.elements['card-0']!.props.reason
    expect(validateBriefing(spec, 'pc').blocked).toBe(true)
  })

  it('props 규칙 위반(reason 4자 미만, 잘못된 ID 형식)은 차단', () => {
    const spec = specWith([gapCard('cancer')])
    spec.elements['card-0']!.props.reason = '짧음'
    spec.elements['card-0']!.props.customerId = 'customer-1'
    const r = validateBriefing(spec, 'pc')
    expect(r.blocked).toBe(true)
    expect(r.violations.filter(v => v.rule === 'SCHEMA')).toHaveLength(2)
  })

  it('root가 BriefingSlot이 아니면 차단', () => {
    const spec = specWith([gapCard('cancer')])
    spec.root = 'sec-0'
    delete spec.elements.slot
    const r = validateBriefing(spec, 'pc')
    expect(r.blocked).toBe(true)
    expect(r.violations.some(v => v.rule === 'SCHEMA')).toBe(true)
  })
})

describe('R1 카드 수 (접기)', () => {
  const six = ['cancer', 'brain', 'heart', 'hospitalization', 'surgery', 'indemnity'].map(gapCard)

  it('pc 6장 → 1장 접고 렌더는 허용', () => {
    const r = validateBriefing(specWith(six), 'pc')
    expect(r.blocked).toBe(false)
    expect(r.foldedKeys).toEqual(['card-5'])
    expect(r.violations.map(v => v.rule)).toEqual(['R1'])
  })

  it('mo 6장 → 3장 접음', () => {
    const r = validateBriefing(specWith(six), 'mo')
    expect(r.foldedKeys).toEqual(['card-3', 'card-4', 'card-5'])
  })

  it('섹션·안내는 카드 수에서 제외', () => {
    const spec = specWith(six.slice(0, 3))
    spec.elements.notice = { type: 'InfoNotice', props: { tone: 'info', message: '안내' }, children: [] }
    spec.elements.slot!.children.push('notice')
    expect(validateBriefing(spec, 'mo').foldedKeys).toEqual([])
  })

  it('applyFold는 접힌 카드에만 visible 조건을 붙인다', () => {
    const spec = specWith(six) as unknown as Parameters<typeof applyFold>[0]
    const folded = applyFold(spec, ['card-5'])
    expect(folded.elements['card-5']!.visible).toEqual({ $state: SHOW_MORE_STATE_PATH })
    expect(folded.elements['card-4']!.visible).toBeUndefined()
    expect(spec.elements['card-5']!.visible).toBeUndefined() // 원본 불변
  })
})

describe('R2 ID 실존', () => {
  it('없는 고객 ID는 차단', () => {
    const r = validateBriefing(specWith([alertCard('C9999', null, 'renewal')]), 'pc')
    expect(r.blocked).toBe(true)
    expect(r.violations.some(v => v.rule === 'R2')).toBe(true)
  })

  it('없는 계약 ID는 차단', () => {
    const r = validateBriefing(specWith([alertCard('C0001', 'P99999', 'renewal')]), 'pc')
    expect(r.violations.some(v => v.rule === 'R2' && v.message.includes('P99999'))).toBe(true)
  })

  it('다른 고객의 계약 ID는 차단', () => {
    const r = validateBriefing(specWith([alertCard('C0001', 'P10002', 'renewal')]), 'pc')
    expect(r.violations.some(v => v.rule === 'R2')).toBe(true)
  })

  it('DB에 없는 알림(고객+유형)은 차단', () => {
    const r = validateBriefing(specWith([alertCard('C0001', 'P10001', 'maturity')]), 'pc')
    expect(r.violations.some(v => v.rule === 'R2')).toBe(true)
  })
})

describe('R3 D-day 정렬', () => {
  it('오름차순이면 통과', () => {
    const spec = specWith([alertCard('C0001', 'P10001', 'renewal'), alertCard('C0002', 'P10002', 'lapse_risk')])
    expect(validateBriefing(spec, 'pc').violations).toEqual([])
  })

  it('역순이면 차단', () => {
    const spec = specWith([alertCard('C0002', 'P10002', 'lapse_risk'), alertCard('C0001', 'P10001', 'renewal')])
    const r = validateBriefing(spec, 'pc')
    expect(r.blocked).toBe(true)
    expect(r.violations.map(v => v.rule)).toContain('R3')
  })
})

describe('R4 중복 금지', () => {
  it('같은 고객+알림 유형 2회는 차단', () => {
    const spec = specWith([alertCard('C0001', 'P10001', 'renewal'), alertCard('C0001', 'P10001', 'renewal')])
    const r = validateBriefing(spec, 'pc')
    expect(r.blocked).toBe(true)
    expect(r.violations.map(v => v.rule)).toContain('R4')
  })
})

describe('R5 섹션 수', () => {
  it('BriefingSection 3개는 차단', () => {
    const r = validateBriefing(specWith([gapCard('cancer')], 2), 'pc')
    expect(r.blocked).toBe(true)
    expect(r.violations.map(v => v.rule)).toContain('R5')
  })
})

describe('renderOrder', () => {
  it('root부터 깊이 우선 순서', () => {
    expect(renderOrder(clone(veteranMorning) as never)).toEqual([
      'slot', 'sec-contact', 'alert-1', 'alert-2', 'alert-3', 'sec-schedule', 'timeline',
    ])
  })
})
