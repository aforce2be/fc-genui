# FC Gen UI — 나중에 바꿔야 할 부분

> 작성일: 2026-11-23 · 상위 문서: `docs/fc-genui-project.md`
> PoC 단계라 임시로 처리해 둔 곳의 목록. 바꿀 때 이 목록에서 지운다.

---

## 1. 데이터 소스 (목업 → 실제 API)

> ⚠️ **전제**: CLAUDE.md 절대 원칙 5번에 따라 회사 API·데이터는 이 개인 프로젝트에서 연결하지 않는다. 회사 제안이 승인된 뒤 사내 환경에서 진행한다. 기획 문서 5장 사내 확인 사항을 먼저 처리할 것.

**현재**: 모든 데이터가 `data/mock/index.ts`에 있고, 아래 파일들이 이 파일을 직접 import한다.

| 위치 | 쓰는 데이터 | 용도 |
|---|---|---|
| `app/components/genui/CustomerAlertCard.vue` | 고객, 계약, 알림, D-day | 카드 표시 |
| `app/components/genui/ScheduleTimeline.vue` | 고객, 일정 | 카드 표시 |
| `app/components/genui/CoverageOverview.vue` | 고객, 보장 | 카드 표시 |
| `app/components/genui/CoverageGapCard.vue` | 고객, 보장 | 카드 표시 |
| `app/components/genui/CustomerSummaryCard.vue` | 고객 | 카드 표시 |
| `app/genui/validate.ts` | 고객, 계약, 알림, D-day | R2·R3 검증 |
| `server/utils/generate-spec.ts` | 전체 | LLM 컨텍스트 작성 |
| `app/pages/index.vue` | FC, 고객 | 헤더, 액션 안내 문구 |

**문제**: 지금은 카드가 메모리 배열을 즉시(동기) 읽는다. 실제 API는 비동기라 그대로 바꿀 수 없다.

**바꾸는 방법 (안)**
1. 데이터 접근 계층을 만든다 (예: `server/data/repository.ts`). 조회 함수를 여기에 모으고, 내부에서 목업과 API 중 하나를 고르게 한다.
2. 서버(`/api/briefing`)가 명세에 나온 ID의 데이터를 한 번에 모아 명세와 함께 내려준다. 카드는 내려받은 데이터만 읽는다.
   - AI 출력에는 여전히 ID만 들어간다 (절대 원칙 1 유지).
3. `validate.ts`의 R2·R3도 같은 계층을 통해 조회한다.
4. 기준일 `MOCK_TODAY`(2026-11-24 고정)를 실제 오늘 날짜로 바꾼다. 단, 테스트에서는 날짜를 고정할 수 있게 주입 가능한 형태로 둔다.

**권장 시점**: 목업 데이터 스키마를 설계하는 단계에서 1번 계층을 함께 만든다.

---

## 2. LLM 연결

| 항목 | 현재 | 나중에 |
|---|---|---|
| 모드 | `mock` 기본 (고정 명세) | `.env`에 `NUXT_GENUI_MODE=live` + `NUXT_ANTHROPIC_API_KEY` |
| live 호출 | **한 번도 실행하지 않음** | 첫 호출로 확인. 카탈로그의 정규식·글자 수 제한을 구조화 출력이 받아주지 않으면 오류가 날 수 있음 → 오류 시 스키마 조정 필요 |
| 모델 | `claude-opus-5-5` (`NUXT_GENUI_MODEL`) | 사내 정책상 사용 가능한 모델로 교체 (AI SDK라 provider만 바꾸면 됨) |
| 거절 시 재시도 | `fallbacks: 'default'` 켜 둠 (`server/utils/generate-spec.ts`) | 사내 정책에 맞춰 유지 또는 제거 |
| 외부 전송 데이터 | LLM에 고객 ID·알림·보장 유무가 전송됨 | 실제 데이터라면 망분리·개인정보 기준 확인 전 사용 금지 |

---

## 3. 로그인·FC 식별

**현재**: 상단 시나리오 탭이 "현재 FC"를 정한다 (`app/genui/scenarios.ts`, `app/pages/index.vue`의 `provide(CURRENT_FC, ...)`).

**나중에**: 실제 로그인 세션에서 FC를 가져온다. 서버(`/api/briefing`)도 요청 본문의 시나리오가 아니라 세션 기준으로 FC를 판단해야 한다. 그래야 다른 FC의 데이터를 요청할 수 없다.

---

## 4. 카드 액션

**현재**: 전화 걸기, 메시지 작성 등은 화면에 "(목업)" 안내만 띄운다 (`app/pages/index.vue`의 `handlers`).

**나중에**: 기존 FC 모바일 앱의 웹뷰 연동(전화 앱 연결, 고객 상세 화면 이동 등)으로 교체한다. 웹뷰 탑재 가능 여부는 사내 확인 사항.

---

## 5. 화면·기능

- **의도 입력창**: 비활성 상태로 자리만 있음. 자연어 요청 시 슬롯 재조합 기능 미구현 (카탈로그 문서 5장 열린 질문과 연결).
- **mo 접기 화면**: 섹션의 카드가 모두 접히면 빈 섹션 제목 아래에 "더보기"만 남음. 디자인 단계에서 정리.
- **디자인**: 현재는 최소 스타일. 컴포넌트 디자인 완성 필요.

---

## 6. 라이브러리 버전

| 패키지 | 현재 | 확인할 것 |
|---|---|---|
| `@json-render/*` | 0.22.0 고정 | 0.x라 업그레이드 시 API가 바뀔 수 있음. 특히 `catalog.validate()`가 props를 검사하지 않는 점 → 새 버전에서 검사하게 되면 `validate.ts`의 직접 검사 중복 여부 확인 |
| TypeScript | 6.0.3 | Vue 타입 도구(volar)와 typescript-eslint가 TS 7을 지원하면 올림 |
