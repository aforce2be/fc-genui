import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { catalog } from '../../app/genui/catalog'
import { SCENARIOS, type ScenarioId } from '../../app/genui/scenarios'
import {
  alerts, customers, schedules, coveragesOf, dDay, fcs, MOCK_TODAY,
  ALERT_LABEL, CATEGORY_LABEL,
} from '../../data/mock'
import veteranMorning from '../../tests/fixtures/veteran-morning.json'
import rookiePrep from '../../tests/fixtures/rookie-prep.json'
import veteranMobile from '../../tests/fixtures/veteran-mobile.json'

const FIXTURES: Record<ScenarioId, unknown> = {
  'veteran-morning': veteranMorning,
  'rookie-prep': rookiePrep,
  'veteran-mobile': veteranMobile,
}

/** 목업 LLM: 시나리오별 고정 명세 (골든셋의 씨앗). 원본이 바뀌지 않도록 복사해서 돌려준다. */
export function mockSpec(scenario: ScenarioId): unknown {
  return structuredClone(FIXTURES[scenario])
}

const RULES = [
  '명세의 root는 BriefingSlot 1개다. BriefingSection은 최대 2개.',
  '고객명·금액·날짜·상품명을 props에 쓰지 않는다. ID만 고른다. 사실 데이터는 컴포넌트가 DB에서 읽는다.',
  '아래 컨텍스트에 있는 customerId·policyId만 쓴다. 없는 ID를 만들지 않는다.',
  'CustomerAlertCard는 D-day가 작은 것부터 배치한다. 같은 고객+알림 유형은 1번만.',
  '모든 카드에 reason(4~40자)을 쓴다. 왜 이 카드가 이 위치에 있는지 FC가 이해할 수 있게 쓴다.',
  '특정 상품 가입을 권하거나 추천하는 문장을 쓰지 않는다. 보장 공백·일정 같은 사실 정리만 한다.',
  '카드는 적게 고른다. 꼭 필요한 카드만 우선순위대로.',
]

/** 모델이 판단에 쓸 컨텍스트. 모델은 이걸 읽고 판단하지만 출력에는 ID만 넣는다. */
function buildContext(scenario: ScenarioId): string {
  const s = SCENARIOS[scenario]
  const fc = fcs.find(f => f.id === s.fcId)!
  const mine = customers.filter(c => c.fcId === s.fcId)
  const ids = new Set(mine.map(c => c.id))
  const lines = [
    `기준일: ${MOCK_TODAY}`,
    `FC: ${fc.id} (${fc.persona === 'veteran' ? '베테랑' : '신입'})`,
    `상황: ${s.situation}`,
    '',
    '[담당 고객]',
    ...mine.map(c => `- ${c.id} ${c.ageBand}, 최근 접촉 ${c.lastContactDate}`),
    '',
    '[알림]',
    ...alerts.filter(a => ids.has(a.customerId))
      .map(a => `- ${a.customerId} policyId=${a.policyId ?? 'null'} alertType=${a.alertType}(${ALERT_LABEL[a.alertType]}) D-${dDay(a.dueDate)} ${a.note}`),
    '',
    '[오늘 일정]',
    ...schedules.filter(x => x.fcId === s.fcId && x.date === MOCK_TODAY)
      .map(x => `- ${x.time} ${x.kind} ${x.customerId}`),
    '',
    '[보장 현황]',
    ...mine.flatMap(c => coveragesOf(c.id)
      .map(v => `- ${c.id} ${v.category}(${CATEGORY_LABEL[v.category]}) ${v.amount === 0 ? '보장 없음' : '보장 있음'}`)),
  ]
  return lines.join('\n')
}

export interface LiveOptions { apiKey: string, model: string }

/** 실제 LLM으로 명세 생성. 결과는 반드시 validateBriefing을 거친 뒤 렌더한다. */
export async function liveSpec(scenario: ScenarioId, opts: LiveOptions): Promise<unknown> {
  const anthropic = createAnthropic({ apiKey: opts.apiKey })
  const { object } = await generateObject({
    model: anthropic(opts.model),
    schema: catalog.zodSchema(),
    system: catalog.prompt({
      system: '너는 보험 FC의 업무 화면을 조합하는 도우미다. 정해진 카탈로그 컴포넌트만 사용해 JSON 명세를 만든다.',
      customRules: RULES,
    }),
    prompt: buildContext(scenario),
    providerOptions: {
      anthropic: {
        // claude-opus-5-5는 강제 tool 호출(tool_choice any/tool)을 지원하지 않으므로 네이티브 구조화 출력을 쓴다.
        structuredOutputMode: 'outputFormat',
        // 안전 분류기가 거절하면 서버가 권장 모델로 재시도한다.
        fallbacks: 'default',
      },
    },
  })
  return object
}
