import { isScenarioId } from '../../app/genui/scenarios'
import { validateBriefing, type Device } from '../../app/genui/validate'
import { mockSpec, liveSpec } from '../utils/generate-spec'
import { logViolations } from '../utils/violations'

/**
 * POST /api/briefing  { scenario, device }
 * → 명세 생성(mock | live) → 검증(SCHEMA, R1~R5) → 위반 로그 → 응답
 * 차단된 경우 spec을 내려보내지 않는다.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ scenario?: unknown, device?: unknown }>(event)
  if (!isScenarioId(body?.scenario)) {
    throw createError({ statusCode: 400, statusMessage: 'unknown scenario' })
  }
  const device: Device = body.device === 'mo' ? 'mo' : 'pc'
  const config = useRuntimeConfig(event)
  const mode = config.genuiMode === 'live' ? 'live' : 'mock'

  if (mode === 'live' && !config.anthropicApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_ANTHROPIC_API_KEY가 설정되지 않았습니다' })
  }

  const spec = mode === 'live'
    ? await liveSpec(body.scenario, { apiKey: config.anthropicApiKey, model: config.genuiModel })
    : mockSpec(body.scenario)

  const result = validateBriefing(spec, device)
  await logViolations({ scenario: body.scenario, device, mode, blocked: result.blocked, violations: result.violations })

  return {
    mode,
    blocked: result.blocked,
    violations: result.violations,
    foldedKeys: result.foldedKeys,
    spec: result.blocked ? null : spec,
  }
})
