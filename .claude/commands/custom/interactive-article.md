---
name: interactive-article
description: 주제를 입력받아 NYT/Pudding 스타일의 인터랙티브 아티클을 완전 자동 생성
argument-hint: "<topic> [--style=hybrid] [--depth=standard]"
allowed-tools: Task, Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, TodoWrite, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_console_messages, mcp__playwright__browser_click, mcp__playwright__browser_evaluate, mcp__playwright__browser_close
---

# Interactive Article Generator

주제를 입력받아 스크롤리텔링 기반 인터랙티브 아티클을 완전 자동으로 생성합니다.

## Arguments

- `topic` (필수): 아티클 주제 (예: "30년간 한국 암환자 5년 생존율 변화")
- `--style`: 스타일 선택 (기본: hybrid)
  - `nyt`: NYT 스타일 (스크롤 동기화 중심)
  - `pudding`: The Pudding 스타일 (사용자 참여 중심)
  - `hybrid`: NYT 70% + Pudding 30% 혼합
- `--depth`: 깊이 설정 (기본: standard)
  - `quick`: 빠른 생성 (5-6 Step)
  - `standard`: 표준 (7-10 Step)
  - `deep`: 심층 분석 (10+ Step)

## Execution Flow

### Step 1: Parse Arguments & Setup

1. 주제에서 slug 생성 (영문 변환, kebab-case)
2. 작업 디렉토리 생성: `.interactive/{slug}/`
3. 스타일과 깊이 파라미터 파싱

### Step 2: Data Collection (expert-data-collector)

```
Task(
  subagent_type="expert-data-collector",
  prompt="주제: {topic}에 대한 데이터를 수집하세요.

수집 범위:
- 공공데이터포털 (data.go.kr)
- 통계청 KOSIS
- 관련 정부 기관 웹사이트

출력 경로: .interactive/{slug}/data.json

JSON 스키마 요구사항:
- metadata: source, sourceUrl, lastUpdated
- timeline: 시계열 데이터 배열
- categories: 카테고리별 데이터
- highlights: 주목할 만한 포인트
- keyInsights: 핵심 인사이트

데이터 품질 요구사항:
- 최소 10년 이상의 시계열 데이터
- 공식 출처만 사용
- 데이터 검증 수행"
)
```

### Step 3: Story Architecture (expert-story-architect)

```
Task(
  subagent_type="expert-story-architect",
  prompt="데이터 기반 스토리 구조를 설계하세요.

입력: .interactive/{slug}/data.json
출력: .interactive/{slug}/story.json
스타일: {style}
깊이: {depth}

3막 구조 설계:
1. Act 1 (Introduction): 충격적인 과거 데이터로 시작
2. Act 2 (Development): 시간에 따른 변화, 주요 마일스톤
3. Act 3 (Conclusion): 현재 상황, 인사이트, 희망 메시지

스크롤 Step 설계:
- 각 Step의 제목, 내용, 하이라이트 숫자
- NYT 스타일: 스크롤 동기화 차트 연동
- Pudding 스타일: 필터, 비교 인터랙션

출력 JSON 구조:
- title, subtitle
- acts: act1_introduction, act2_development, act3_conclusion
- steps: 스크롤 단계 배열
- interactions: nytStyle, puddingStyle 설정
- highlights: 하이라이트 카드
- keyInsights: 핵심 인사이트"
)
```

### Step 4: Chart Building (expert-chart-builder)

```
Task(
  subagent_type="expert-chart-builder",
  prompt="D3.js 기반 차트 컴포넌트를 생성하세요.

입력:
- .interactive/{slug}/data.json
- .interactive/{slug}/story.json

출력: .interactive/{slug}/components/
- 기존 src/components/interactive/ 컴포넌트 재사용 가능

생성할 컴포넌트:
1. 주요 라인 차트 (시계열 데이터)
2. 비교 차트 (카테고리별)
3. 애니메이션 숫자 컴포넌트
4. 필터 버튼 (Pudding 스타일)
5. 하이라이트 카드

기술 스택:
- React 19 + TypeScript
- D3.js v7
- Framer Motion
- Tailwind CSS (기존 디자인 시스템)

스크롤 연동:
- currentStep prop으로 차트 상태 변경
- 부드러운 트랜지션 (duration: 500ms)"
)
```

### Step 5: Scroll Assembly (expert-scroll-orchestrator)

```
Task(
  subagent_type="expert-scroll-orchestrator",
  prompt="Scrollama 기반 페이지를 조합하세요.

입력:
- .interactive/{slug}/story.json
- .interactive/{slug}/components/

출력: src/app/interactive/{slug}/page.tsx

페이지 구조:
1. Hero Section: 제목, 부제, 핵심 숫자 애니메이션
2. Scrollytelling Section:
   - ScrollyContainer + Scrollama
   - 좌측: 스크롤 Step 텍스트
   - 우측: Sticky 차트
3. Comparison Section: 필터링 인터랙션
4. Highlights Section: 하이라이트 카드
5. Insights Section: 핵심 인사이트
6. Source Section: 데이터 출처

기술 요구사항:
- 'use client' 지시문
- 반응형 (모바일: 1열, 데스크톱: 2열)
- 접근성 고려"
)
```

### Step 6: AI Image Generation (조건부)

히어로 이미지가 필요한 경우에만 실행:

```
Task(
  subagent_type="ai-nano-banana",
  prompt="인터랙티브 아티클용 히어로 이미지를 생성하세요.

주제: {topic}
스타일: 데이터 저널리즘, 희망적, 전문적
해상도: 2K (1920x1080)
비율: 16:9

출력: .interactive/{slug}/assets/hero.png"
)
```

### Step 7: Build & Verify

```bash
# 빌드 테스트
cd fact-check && npm run build

# 개발 서버 실행 (선택적)
npm run dev
```

### Step 8: Playwright Visual Verification

빌드 성공 후 Playwright MCP를 사용하여 완성된 페이지를 자동 검증합니다.

#### 8.1 개발 서버 시작 (백그라운드)

```bash
# 백그라운드에서 개발 서버 시작
cd fact-check && npm run dev &
# 서버 준비 대기 (3초)
sleep 3
```

#### 8.2 브라우저 네비게이션

```
mcp__playwright__browser_navigate(url="http://localhost:3000/interactive/{slug}")
```

#### 8.3 Hero Section 검증

```
mcp__playwright__browser_snapshot()
```

검증 항목:
- 제목이 올바르게 표시되는지
- 애니메이션 숫자 컴포넌트가 렌더링되는지
- Hero 섹션 레이아웃이 정상인지

#### 8.4 Scrollytelling 검증

스크롤하며 각 Step 검증:

```
# 스크롤 인터랙션 테스트
mcp__playwright__browser_evaluate(
  function="async (page) => {
    const scrollHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    let currentPosition = 0;
    while (currentPosition < scrollHeight - viewportHeight) {
      currentPosition += 300;
      window.scrollTo(0, currentPosition);
      await new Promise(r => setTimeout(r, 500));
    }
    return 'Scroll test completed';
  }"
)
```

#### 8.5 차트 렌더링 검증

```
mcp__playwright__browser_snapshot()
```

검증 항목:
- D3.js 차트가 정상 렌더링되는지
- SVG 요소들이 존재하는지
- 데이터 포인트가 표시되는지

#### 8.6 Console Error 체크

```
mcp__playwright__browser_console_messages(level="error")
```

검증 항목:
- JavaScript 런타임 에러 없음
- React 하이드레이션 에러 없음
- D3.js 렌더링 에러 없음

#### 8.7 스크린샷 저장

```
mcp__playwright__browser_take_screenshot(
  filename=".interactive/{slug}/verification/page-full.png",
  fullPage=true
)
```

#### 8.8 브라우저 종료

```
mcp__playwright__browser_close()
```

### Step 9: Auto Debug (조건부)

Step 8에서 문제가 발견되면 자동 디버깅을 수행합니다.

#### 9.1 문제 유형별 자동 수정

**Console Error 발견 시:**
```
1. 에러 메시지 분석
2. 관련 컴포넌트 파일 확인
3. 에러 원인 파악 및 수정
4. 빌드 재실행
5. Step 8 재검증 (최대 3회 반복)
```

**차트 미렌더링 시:**
```
1. D3.js 코드 검토
2. 데이터 바인딩 확인
3. SVG viewBox 및 크기 확인
4. useEffect 의존성 배열 검토
5. 수정 후 재검증
```

**레이아웃 깨짐 시:**
```
1. Tailwind CSS 클래스 검토
2. 반응형 브레이크포인트 확인
3. Sticky positioning 확인
4. 수정 후 재검증
```

#### 9.2 디버깅 실패 시

3회 재시도 후에도 문제가 해결되지 않으면:
```
- 상세 에러 로그 저장: .interactive/{slug}/debug/error-log.txt
- 스크린샷 저장: .interactive/{slug}/debug/error-state.png
- 사용자에게 수동 검토 요청
```

### Step 10: Final Report

최종 결과 리포트:

```
인터랙티브 아티클 생성 완료!

페이지: /interactive/{slug}
컴포넌트: {count}개
데이터: .interactive/{slug}/data.json
스토리: .interactive/{slug}/story.json

Playwright 검증 결과:
- Hero Section: 정상
- Scrollytelling: 정상
- Chart Rendering: 정상
- Console Errors: 없음
- Screenshots: .interactive/{slug}/verification/

다음 단계:
1. 내용 검토 및 수정
2. npm run build로 프로덕션 빌드
3. Firebase 배포
```

## Error Handling

### 데이터 수집 실패

- 재시도: 최대 3회
- 대안: 사용자에게 수동 데이터 입력 요청
- 취소: 사용자 확인 후 중단

### 차트 생성 실패

- 재시도: 최대 2회
- 대안: 간단한 차트 타입으로 대체
- 로그: 에러 상세 기록

### 빌드 실패

- 에러 분석 및 자동 수정 시도
- TypeScript 에러: 타입 수정
- Import 에러: 경로 수정

### Playwright 검증 실패

- 자동 디버깅 시도 (Step 9)
- 최대 3회 재시도
- 실패 시 수동 검토 요청

## Usage Examples

```bash
# 기본 사용
/interactive-article "30년간 한국 암환자 5년 생존율 변화"

# NYT 스타일로 심층 분석
/interactive-article "대한민국 출산율 변화" --style=nyt --depth=deep

# Pudding 스타일로 빠른 생성
/interactive-article "연도별 최저임금 변화" --style=pudding --depth=quick
```

## Notes

- 전체 실행 시간: 약 25-30분 (Playwright 검증 포함)
- 예상 토큰: ~70,000
- 데이터 소스: 공공데이터만 사용 (저작권 안전)
- 디자인 시스템: 기존 fact-check 프로젝트 Tailwind 설정 사용
- Playwright 검증: 빌드 성공 후 자동 실행
