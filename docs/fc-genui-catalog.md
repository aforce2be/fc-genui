# FC Gen UI — 컴포넌트 카탈로그 v0.2

> 작성일: 2026-11-23 · 상위 문서: `docs/fc-genui-project.md`
> 상태: `app/genui/catalog.ts`로 구현됨 (json-render 0.22.0).
> v0.2 변경: 루트 컨테이너 `BriefingSlot` 추가, props 검증을 직접 수행(아래 3-1), 일정 카드의 FC 범위 제한.

---

## 1. 설계 원칙

1. **AI는 "무엇을, 어떤 순서로"만 정한다.** 모양은 디자인 시스템이 정한다.
2. **AI는 ID만 고른다.** 고객명·금액·날짜·상품명 같은 사실 데이터는 컴포넌트가 목업 DB에서 직접 읽는다. → AI가 숫자를 지어내는 환각을 구조적으로 차단.
3. **모든 카드에 `reason`(근거) 필수.** 4~40자. 예: "갱신일 3일 전", "암 진단비 보장 없음".
4. **상품 추천 컴포넌트는 만들지 않는다.** 카탈로그에 없는 컴포넌트는 AI가 만들 수 없다 → 금융소비자보호법 대응을 "규칙"이 아니라 "구조"로 해결.
5. **AI가 쓴 문장은 표시한다.** 자유 텍스트가 들어가는 카드에는 "AI 초안 · 약관 확인 필요" 라벨을 고정 노출.

---

## 2. 컴포넌트 목록

| 구분 | 컴포넌트 | AI가 정하는 것 | DB에서 읽는 것 | 주 사용처 |
|---|---|---|---|---|
| 레이아웃 | **BriefingSlot** | — (props 없음) | — | pc·mo |
| 레이아웃 | **BriefingSection** | 섹션 제목, 근거 | — | pc·mo |
| 고객 관리 | **CustomerAlertCard** | 고객·계약 ID, 알림 유형(갱신/만기/청구/실효위험/기념일), 주 액션(`call_customer`/`message_customer`/`open_customer_detail`), 근거 | 고객명, D-day, 상품명 | pc 아침 브리핑 |
| 고객 관리 | **ScheduleTimeline** | 날짜, 근거 | 방문·통화 일정 (현재 로그인한 FC의 일정만) | pc |
| 상담 준비 | **CoverageOverview** | 고객 ID, 강조 카테고리(최대 3), 근거 | 보장 금액·상태 | pc 상담 준비 |
| 상담 준비 | **CoverageGapCard** | 고객 ID, 공백 카테고리, 근거 | 현재 보장 내역 | pc 상담 준비 |
| 상담 준비 | **TalkingPointCard** | 주제, 설명 포인트 1~3개 (AI 텍스트), 근거 | — | pc (신입 FC) |
| 이동 중 | **CustomerSummaryCard** | 고객 ID, 핵심 포인트 1~3개 (AI 텍스트), 근거 | 이름, 나이대, 최근 접촉일 | mo |
| 공통 | **InfoNotice** | 톤(안내/빈 상태), 메시지 | — | pc·mo |

보장 카테고리: 암 · 뇌혈관 · 심장 · 입원 · 수술 · 실손 · 사망 · 연금

### 명세 구조
json-render 명세는 루트가 반드시 1개인 평면 구조(`{ root, elements }`)다. 그래서 섹션 2개를 담을 최상위 컨테이너로 **BriefingSlot**을 둔다.

```
BriefingSlot (root, 1개)
├─ BriefingSection (최대 2개) ─ 카드들
└─ InfoNotice (선택)
```

### 현재 FC 범위
현재 로그인한 FC는 AI 출력이 아니라 페이지(세션)가 정한다(`app/genui/context.ts`의 `CURRENT_FC`). 담당 범위가 있는 카드(현재는 ScheduleTimeline)는 이 값으로 데이터를 제한한다. 그래서 다른 FC의 고객이 섞이지 않는다.

"AI 초안 · 약관 확인 필요" 라벨 고정 대상: **TalkingPointCard**, **CustomerSummaryCard** (AI 텍스트가 들어가는 카드 전부)

### 액션
카탈로그의 `actions` 이름을 그대로 쓴다. `CustomerAlertCard.primaryAction`도 이 이름 중 하나를 고른다.

| 액션 이름 | 설명 |
|---|---|
| `call_customer` | 전화 걸기 |
| `message_customer` | 메시지 작성 |
| `open_customer_detail` | 고객 상세 열기 |
| `open_coverage_analysis` | 보장분석 상세 열기 |
| `mark_done` | 처리 완료 |
| `show_more` | 더보기 (R1 상한을 넘어 접힌 카드 펼치기) |

---

## 3. 스키마 밖 검증 규칙 (검증 1단계에서 함께 실행)

| 규칙 | 내용 | 위반 시 |
|---|---|---|
| SCHEMA | 카탈로그 Zod 스키마 + 컴포넌트별 props + 명세 구조, root는 BriefingSlot | 렌더 차단 + 로그 |
| R1 카드 수 | pc 5장 / mo 3장 이하 (슬롯·섹션·안내 제외) | 렌더는 하되 초과분은 "더보기"로 접기 + 로그 |
| R2 ID 실존 | 모든 고객·계약 ID가 목업 DB에 존재 | 렌더 차단 + 로그 |
| R3 정렬 | CustomerAlertCard는 D-day 오름차순 | 렌더 차단 + 로그 |
| R4 중복 금지 | 같은 고객 + 알림 유형 조합은 1회 | 렌더 차단 + 로그 |
| R5 섹션 수 | BriefingSection 화면당 최대 2개 | 렌더 차단 + 로그 |

> 로그는 모두 `logs/genui-violations.jsonl`에 남긴다. 위반 로그는 그대로 품질 지표가 된다 (예: "R2 위반률" = 환각 발생률).

- R2는 ID가 있는지뿐 아니라 다음도 확인한다: 계약이 해당 고객의 것인지, CustomerAlertCard의 고객+알림 유형 조합이 DB에 실제로 있는지.
- R3은 화면 전체의 CustomerAlertCard를 렌더 순서대로 보고 판단한다.

### 3-1. 구현 메모 (json-render 0.22.0)
- `catalog.validate()`는 컴포넌트 이름만 검사하고 **컴포넌트별 props(Zod)는 검사하지 않는다**. 그래서 `validate.ts`가 각 요소의 props를 카탈로그 스키마로 직접 검사한다. `reason` 누락이나 ID 형식 오류도 여기서 잡는다.
- R1 접기는 초과 카드에 `visible: { $state: "/ui/showMore" }`를 붙이는 방식이다. "더보기"(`show_more`)를 누르면 이 state가 true가 되어 펼쳐진다.

---

## 4. 페르소나별 조합 예시 (같은 데이터, 다른 화면)

**정미경 (베테랑) — 아침 브리핑, pc**
- BriefingSection "오늘 연락할 고객"
  - CustomerAlertCard — 갱신, "갱신일 3일 전", 전화
  - CustomerAlertCard — 실효 위험, "보험료 2회 미납", 전화
  - CustomerAlertCard — 청구, "청구 서류 미제출 5일째", 메시지
- BriefingSection "오후 일정"
  - ScheduleTimeline

**김현수 (신입) — 상담 준비, pc**
- BriefingSection "14시 상담 준비"
  - CoverageOverview — 강조: 암·실손, "40대 기준 가입 비중이 높은 보장"
  - CoverageGapCard — 암, "암 진단비 보장 없음"
  - TalkingPointCard — "갱신형 vs 비갱신형", 포인트 3개, "고객 문의 가능성 높음"

**정미경 — 이동 중, mo**
- CustomerSummaryCard — 포인트 3개, "14시 방문 예정"

---

## 5. 열린 질문
- 근거(`reason`)를 AI가 쓰게 할지, 규칙 엔진이 만든 근거 후보 중 고르게 할지 → 후자가 더 안전하나 유연성 감소
- TalkingPointCard의 출처를 상품 설명서(목업)로 제한할지 (RAG 범위)
- 의도 입력창으로 요청했을 때 슬롯 전체를 다시 만들지, 특정 섹션만 바꿀지

---

## 부록: Zod 카탈로그 코드 초안
`app/genui/catalog.ts`에 있음. json-render API 이름은 세팅 시 최신 문서로 재확인.
