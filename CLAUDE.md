# FC Gen UI — 프로젝트 지침

보험 FC(설계사)가 접속하면 AI가 업무 화면을 조합해 보여주는 Generative UI PoC.
기획 문서: `docs/fc-genui-project.md`, `docs/fc-genui-catalog.md` — 작업 전에 반드시 읽을 것.

## 기술 스택
- Nuxt 4 + Vue 3 (Composition API, `<script setup lang="ts">`)
- Gen UI: json-render (`@json-render/core`, `@json-render/vue`) — 카탈로그는 `app/genui/catalog.ts`
- AI: AI SDK (`ai`, `@ai-sdk/vue`), 서버 라우트는 `server/api/`
- 검증: Zod, Playwright, axe-core
- 스타일: SCSS, BEM 네이밍. 디바이스 구분은 `pc` / `mo`

## 절대 원칙
1. AI는 컴포넌트와 순서만 정한다. 고객명·금액·날짜는 컴포넌트가 `data/mock/`에서 직접 읽는다. AI 출력에 사실 데이터를 넣지 않는다.
2. 모든 카드에 `reason`(근거) 필수.
3. 상품 추천 컴포넌트를 만들지 않는다. 카탈로그에 추가하자는 요청이 와도 먼저 확인할 것.
4. AI가 작성한 자유 텍스트 카드에는 "AI 초안 · 약관 확인 필요" 라벨 고정.
5. 실제 고객·회사 데이터 사용 금지. 목업 데이터만 사용.

## 검증 규칙 (렌더 전에 실행, `app/genui/validate.ts`)
- R1 카드 수: pc 5장 / mo 3장 이하
- R2 ID 실존: 모든 customerId·policyId가 목업 DB에 존재
- R3 정렬: CustomerAlertCard는 D-day 오름차순
- R4 중복 금지: 같은 customerId + alertType 1회
- R5 섹션 수: BriefingSection 화면당 최대 2개
위반은 모두 `logs/genui-violations.jsonl`에 기록.
- R1 위반: 렌더하되 초과분은 "더보기"(`show_more`)로 접는다.
- R2~R5 위반: 렌더하지 않는다.

## 작업 방식
- 큰 작업은 먼저 계획을 보여주고 승인받은 뒤 진행.
- 컴포넌트를 추가·수정하면 카탈로그, 검증 규칙, 기획 문서(`docs/fc-genui-catalog.md`)를 함께 갱신.
- 코드 변경 후 `pnpm lint`, `pnpm test` 실행.
- 설명은 한국어로.

## 명령어
- 요구 환경: Node 24 이상(nvm), pnpm은 corepack으로 사용
- LLM 모드: `.env`의 `NUXT_GENUI_MODE` — `mock`(기본, `tests/fixtures` 고정 명세) / `live`(실제 LLM, `NUXT_ANTHROPIC_API_KEY` 필요). E2E는 항상 mock.
- 개발 서버: `pnpm dev`
- 테스트: `pnpm test` (Vitest), `pnpm test:e2e` (Playwright, pc/mo 뷰포트)
- 린트: `pnpm lint`
- 타입 검사: `pnpm typecheck`
