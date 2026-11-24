# FC Gen UI

보험 FC(설계사)가 접속하면 AI가 업무 화면(카드)을 골라 순서대로 보여주는 Generative UI PoC.

- AI(LLM)는 **어떤 카드를 어떤 순서로** 보여줄지만 정하고, 화면은 json-render가 정해진 Vue 컴포넌트로 그린다.
- 고객명·금액·날짜는 AI가 아니라 컴포넌트가 목업 DB에서 직접 읽는다.
- 모든 데이터는 가상 목업이다.

기획 문서: [`docs/fc-genui-project.md`](docs/fc-genui-project.md), [`docs/fc-genui-catalog.md`](docs/fc-genui-catalog.md), 나중에 바꿀 부분: [`docs/fc-genui-later.md`](docs/fc-genui-later.md)

---

## 로컬에서 실행하기

### 1. 준비 (처음 한 번)

| 필요 | 버전 | 확인 |
|---|---|---|
| Node.js | 24 이상 | `node -v` |
| pnpm | corepack으로 켬 | `pnpm -v` |

```bash
corepack enable   # pnpm 켜기
pnpm install      # 의존성 설치
```

> Node를 nvm으로 설치했는데 터미널에서 `node`를 못 찾으면, 터미널을 새로 열거나 `nvm use 24`를 실행한다.

### 2. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 **http://localhost:3000** 을 연다. 끌 때는 터미널에서 `Ctrl + C`.

### 3. 화면 보는 법

- 상단 탭으로 시나리오 전환: **정미경 · 아침 브리핑** / **김현수 · 상담 준비** / **정미경 · 이동 중**
- **모바일(mo) 화면**: 브라우저 폭을 768px 미만으로 줄이거나 개발자 도구(F12)의 기기 모드 사용
  - 1열 배치, 입력창 숨김, 카드 3장 초과 시 "더보기"로 접힘
- 화면 맨 아래 "명세 출처"에서 목업 LLM인지 실제 LLM인지 확인

---

## LLM 모드 (mock / live)

기본은 **mock**이다. LLM을 부르지 않고 `tests/fixtures/`에 미리 써 둔 명세를 쓰므로 API 키가 필요 없다.

실제 LLM으로 바꾸려면 `.env.example`을 복사해 `.env`를 만들고 값을 채운다.

```bash
cp .env.example .env
```

```
NUXT_GENUI_MODE=live
NUXT_GENUI_MODEL=claude-opus-5-5
NUXT_ANTHROPIC_API_KEY=발급받은-키
```

> ⚠️ live 모드는 아직 실제로 호출해 본 적이 없다. 그리고 live 모드에서는 고객 ID·알림·보장 유무가 외부 API로 전송된다 — 실제 고객·회사 데이터로는 절대 사용하지 않는다.

---

## 명령어

| 명령 | 내용 |
|---|---|
| `pnpm dev` | 개발 서버 (http://localhost:3000) |
| `pnpm build` / `pnpm preview` | 운영용 빌드 / 빌드 결과 실행 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | 타입 검사 |
| `pnpm test` | 단위 테스트 (Vitest) — 검증 규칙 R1~R5 |
| `pnpm test:e2e` | E2E 테스트 (Playwright, pc/mo 뷰포트 + axe 접근성). 처음 한 번 `pnpm exec playwright install chromium` 필요 |

---

## 폴더 구조

```
app/
  genui/catalog.ts       컴포넌트 카탈로그 (AI가 쓸 수 있는 컴포넌트 목록, Zod)
  genui/validate.ts      검증 규칙 R1~R5 (렌더 전에 실행)
  genui/registry.ts      카탈로그 이름 → Vue 컴포넌트 연결
  components/genui/      카드 컴포넌트
  pages/index.vue        진입 화면 (고정 뼈대 + 브리핑 슬롯)
server/api/briefing.post.ts   명세 생성(mock/live) → 검증 → 응답
data/mock/               가상 목업 데이터
tests/fixtures/          mock 모드 고정 명세
tests/unit/, tests/e2e/  테스트
logs/genui-violations.jsonl   검증 위반 로그 (실행 중 생성)
```
