# 인터랙티브 콘텐츠 제작 Agent/Skill 아키텍처 계획 초안

> **버전**: 0.2.0 (수정본)
> **작성일**: 2025-12-20
> **프로젝트**: fact-check "움직이는 글" 카테고리
> **목표**: 주제 입력만으로 인터랙티브 아티클 완전 자동 생성

---

## 1. 전체 아키텍처 개요

### 1.1 Claude Code Best Practice 적용

**핵심 원칙**:
- ❌ 별도 오케스트레이터 Agent 불필요 → Alfred가 직접 조율 (CLAUDE.md Rule 5)
- ❌ 디자인 시스템 Agent 불필요 → 이미 정해진 디자인 시스템 사용
- ✅ Slash Command로 워크플로우 정의
- ✅ 파일 기반 데이터 전달 (명시적, Git 추적 가능)

### 1.2 파이프라인 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    🎬 Interactive Article Pipeline                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      Alfred (Main Orchestrator)                         │ │
│  │                    CLAUDE.md Rule 1-10 적용                              │ │
│  │                    별도 오케스트레이터 Agent 불필요                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                /interactive-article <topic>                             │ │
│  │                      (Slash Command)                                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│              ┌───────────────────────┼───────────────────────┐              │
│              ▼                       ▼                       ▼              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  🔍 Stage 1      │  │  📖 Stage 2      │  │  🧩 Stage 3      │          │
│  │  Data Collection │→ │  Story Design    │→ │  Chart Building  │          │
│  │                   │  │                   │  │                   │          │
│  │ expert-data-      │  │ expert-story-    │  │ expert-chart-    │          │
│  │ collector         │  │ architect        │  │ builder          │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│              │                       │                       │              │
│              ▼                       ▼                       ▼              │
│  ┌──────────────────┐  ┌──────────────────┐                                 │
│  │  🎬 Stage 4      │  │  🖼️ Stage 5      │                                 │
│  │  Scroll Assembly │  │  AI Image Gen    │                                 │
│  │                   │  │  (조건부)         │                                 │
│  │ expert-scroll-   │  │ ai-nano-banana   │                                 │
│  │ orchestrator     │  │ (기존 agent)      │                                 │
│  └──────────────────┘  └──────────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 데이터 전달: 파일 기반 (Best Practice)

```
fact-check/.interactive/
├── [slug]/
│   ├── data.json           ← expert-data-collector 출력
│   ├── story.json          ← expert-story-architect 출력
│   ├── components/         ← expert-chart-builder 출력
│   │   ├── Chart.tsx
│   │   └── ...
│   ├── page.tsx            ← expert-scroll-orchestrator 출력
│   └── assets/             ← ai-nano-banana 출력 (조건부)
│       └── hero.png
```

**장점**:
- 명확한 버전 관리 (Git 추적)
- Agent 간 상태 공유 명시적
- 실패 시 디버깅 용이
- 병렬 작업 가능 (각자 파일 영역 분담)

### 1.4 자동화 수준

| 수준 | 설명 | 사용자 개입 |
|-----|------|-----------|
| **완전 자동** (선택됨) | 주제만 입력 → 전체 아티클 자동 생성 | 주제 입력, 최종 승인만 |

### 1.5 데이터 소스 범위

- ✅ 공공 데이터 포털 (data.go.kr, 통계청, KOSIS)
- ✅ 웹 스크래핑 (법적 허용 범위 내)
- ❌ 사용자 제공 데이터 (범위 외)
- ❌ 실시간 API (범위 외)

### 1.6 이미지 생성 범위

- ✅ D3.js 기반 차트/그래프
- ✅ SVG 아이콘/일러스트
- ✅ AI 생성 이미지 (Nano Banana Pro)

---

## 2. Agent 상세 설계

### 2.0 Slash Command (워크플로우 진입점)

```yaml
# .claude/commands/custom/interactive-article.md
name: interactive-article
description: 주제를 입력받아 인터랙티브 아티클을 자동 생성
argument-hint: "<topic> [--style=hybrid] [--depth=standard]"
allowed-tools: Task, Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch
```

**사용 예시**:
```bash
/interactive-article "30년간 한국 암환자 5년 생존율 변화"
/interactive-article "대한민국 출산율 변화" --style=nyt --depth=deep
```

**워크플로우 정의**:
```markdown
# /interactive-article Workflow

## Step 1: Parse Arguments
- topic: 필수
- style: hybrid (default) | nyt | pudding
- depth: standard (default) | quick | deep

## Step 2: Create Working Directory
```bash
mkdir -p .interactive/{slug}
```

## Step 3: Sequential Agent Delegation
1. Task(subagent_type="expert-data-collector", prompt="...")
2. Task(subagent_type="expert-story-architect", prompt="...")
3. Task(subagent_type="expert-chart-builder", prompt="...")
4. Task(subagent_type="expert-scroll-orchestrator", prompt="...")
5. Task(subagent_type="ai-nano-banana", prompt="...") # 조건부

## Step 4: Build & Verify
- npm run build
- Playwright 테스트

## Step 5: Report Results
- 생성된 페이지 URL
- 컴포넌트 목록
- 데이터 파일 경로
```

---

### 2.1 Stage 1: expert-data-collector

```yaml
name: expert-data-collector
tier: 1 (Expert)
role: 공공 데이터 수집, 정제, JSON 스키마 생성
skills:
  - skill-data-scraping (신규)
  - moai-formats-data
```

**책임**:
- 주제 관련 공공 데이터 포털 검색
- 웹 스크래핑 (법적 허용 범위)
- 데이터 정제 및 JSON 변환
- 출처 메타데이터 추출
- 데이터 유효성 검증

**입력**:
```typescript
interface DataCollectionRequest {
  topic: string;
  keywords: string[];
  dataSources: ("공공데이터포털" | "통계청" | "웹스크래핑")[];
  timeRange?: { start: string; end: string };
  locale: "ko" | "en";
}
```

**출력**:
```typescript
interface DataPackage {
  schema: JSONSchema;
  data: Record<string, any>;
  metadata: {
    source: string;
    sourceUrl: string;
    lastUpdated: string;
    license: string;
  };
  statistics: {
    recordCount: number;
    timeSpan: string;
    categories: string[];
  };
}
```

**도구**:
- WebFetch, WebSearch: 데이터 검색 및 수집
- Bash: 데이터 처리 스크립트 실행
- Write: JSON 파일 저장

---

### 2.2 Stage 2: expert-story-architect

```yaml
name: expert-story-architect
tier: 1 (Expert)
role: 스토리텔링 구조 설계, 3막 구조, 스크롤 Step 기획
skills:
  - skill-storytelling (신규)
```

**책임**:
- 데이터 기반 인사이트 추출
- 3막 구조 스토리보드 설계
- 스크롤 Step별 메시지 구성
- 하이라이트 포인트 선정
- NYT/Pudding 스타일 혼합 비율 결정

**입력**:
```typescript
interface StoryRequest {
  dataPackage: DataPackage;  // .interactive/{slug}/data.json
  style: "nyt" | "pudding" | "hybrid";
  targetLength: "short" | "medium" | "long";
  audience: "general" | "expert";
}
```

**출력**:
```typescript
// .interactive/{slug}/story.json
interface StoryStructure {
  title: string;
  subtitle: string;

  acts: {
    act1_introduction: {
      hook: string;           // "1993년, 암은 사형선고였다"
      keyNumber: number;      // 42.9
      emotion: string;        // "shocking"
    };
    act2_development: {
      steps: StoryStep[];     // 스크롤 단계별 내용
      milestones: Milestone[];
    };
    act3_conclusion: {
      insight: string;
      callToAction: string;
    };
  };

  interactions: {
    nytStyle: {            // 스크롤 동기화
      scrollSteps: number;
      stickyChart: boolean;
    };
    puddingStyle: {        // 사용자 참여
      filters: FilterConfig[];
      comparisons: ComparisonConfig[];
    };
  };

  highlights: HighlightCard[];
  keyInsights: Insight[];
}
```

---

### 2.3 Stage 3: expert-chart-builder

```yaml
name: expert-chart-builder
tier: 1 (Expert)
role: D3.js 기반 차트 컴포넌트 생성
skills:
  - skill-d3-charts (신규)
  - moai-domain-frontend
```

**책임**:
- 데이터 특성에 맞는 차트 타입 선택
- D3.js 기반 차트 컴포넌트 구현
- 스크롤 연동 트랜지션 구현
- 필터링 인터랙션 구현
- 반응형 차트 최적화
- 기존 디자인 시스템 (Tailwind + 정해진 컬러) 적용

**입력**:
```typescript
interface ChartRequest {
  dataPath: string;        // .interactive/{slug}/data.json
  storyPath: string;       // .interactive/{slug}/story.json
  chartTypes: ChartType[]; // "line", "bar", "comparison", "heatmap"
}
```

**출력**:
```typescript
// .interactive/{slug}/components/
interface ChartComponents {
  components: {
    name: string;          // "SurvivalLineChart"
    path: string;          // ".interactive/{slug}/components/SurvivalLineChart.tsx"
    type: ChartType;
    props: ChartProps;
  }[];
}
```

**생성 컴포넌트 예시**:
- `SurvivalLineChart.tsx`: 생존율 라인 차트
- `ComparisonChart.tsx`: 암 종류별 비교 차트
- `AnimatedNumber.tsx`: 애니메이션 숫자
- `FilterButtons.tsx`: 필터 버튼

---

### 2.4 Stage 4: expert-scroll-orchestrator

```yaml
name: expert-scroll-orchestrator
tier: 1 (Expert)
role: Scrollama 기반 스크롤리텔링 조합
skills:
  - skill-scrollytelling (신규)
  - moai-domain-frontend
```

**책임**:
- Scrollama 기반 스크롤 컨테이너 구성
- Sticky 차트 레이아웃 구현
- Step 진입/진행 이벤트 핸들링
- 차트 ↔ 텍스트 동기화 로직
- 모바일 대응 레이아웃

**입력**:
```typescript
interface ScrollRequest {
  storyPath: string;       // .interactive/{slug}/story.json
  componentsPath: string;  // .interactive/{slug}/components/
}
```

**출력**:
```typescript
// .interactive/{slug}/page.tsx
interface ScrollyComponents {
  page: {
    path: string;           // app/interactive/[slug]/page.tsx
    code: string;
  };
  containers: {
    scrollyContainer: string;
    stickyChart: string;
    scrollStep: string;
  };
  hooks: {
    useScrollProgress: string;
    useStepState: string;
  };
}
```

---

### 2.5 Stage 5: AI Image Generation (기존 agent 활용, 조건부)

```yaml
name: ai-nano-banana
tier: 5 (AI)
role: AI 생성 이미지 (히어로, 일러스트)
skills:
  - moai-connector-nano-banana (기존)
```

**호출 조건**:
- 히어로 이미지가 필요한 경우
- 데이터 시각화 외 일러스트가 필요한 경우
- 사용자가 AI 이미지 요청 시

**입력**:
```typescript
interface ImageRequest {
  purpose: "hero" | "illustration" | "icon";
  description: string;
  style: string;
  aspectRatio: string;
  outputPath: string;  // .interactive/{slug}/assets/
}
```

**출력**:
```typescript
// .interactive/{slug}/assets/hero.png
interface ImageOutput {
  path: string;
  metadata: {
    prompt: string;
    model: string;
    resolution: string;
  };
}
```

---

## 3. Skill 상세 설계

### 3.1 신규 Skill 목록

| Skill 이름 | 역할 | 모듈 |
|-----------|------|------|
| `skill-data-scraping` | 공공데이터 수집, 웹 스크래핑 | api-connectors, parsers, validators |
| `skill-storytelling` | 스토리텔링 구조, 3막 구조 | narrative-patterns, step-design |
| `skill-d3-charts` | D3.js 차트 패턴 | chart-types, transitions, responsive |
| `skill-scrollytelling` | Scrollama 패턴 | scroll-patterns, sticky-layout |

### 3.2 skill-data-scraping

```
.claude/skills/skill-data-scraping/
├── SKILL.md           # 스킬 개요
├── reference.md       # API 레퍼런스
├── examples.md        # 사용 예시
└── modules/
    ├── public-data-portals.md   # 공공데이터포털 API
    ├── statistics-korea.md      # 통계청 KOSIS API
    ├── web-scraping.md          # 웹 스크래핑 패턴
    ├── data-cleaning.md         # 데이터 정제
    └── schema-generation.md     # JSON 스키마 생성
```

**핵심 기능**:
```typescript
// 공공데이터포털 API
interface PublicDataAPI {
  searchDatasets(query: string): Promise<Dataset[]>;
  fetchData(datasetId: string): Promise<RawData>;
  parseResponse(data: RawData): ParsedData;
}

// 웹 스크래핑 (법적 범위)
interface WebScraper {
  checkRobotsTxt(url: string): Promise<boolean>;
  extractTable(url: string, selector: string): Promise<TableData>;
  extractText(url: string, selector: string): Promise<string>;
}

// 데이터 정제
interface DataCleaner {
  normalizeNumbers(data: any): any;
  fillMissingValues(data: any, strategy: string): any;
  validateSchema(data: any, schema: JSONSchema): ValidationResult;
}
```

---

### 3.3 skill-storytelling

```
.claude/skills/skill-storytelling/
├── SKILL.md
├── reference.md
├── examples.md
└── modules/
    ├── three-act-structure.md    # 3막 구조 패턴
    ├── data-insights.md          # 데이터 인사이트 추출
    ├── scroll-step-design.md     # 스크롤 Step 설계
    ├── highlight-selection.md    # 하이라이트 선정
    └── nyt-pudding-hybrid.md     # 스타일 혼합 가이드
```

**핵심 패턴**:
```typescript
// 3막 구조 생성
interface ThreeActGenerator {
  analyzeData(data: DataPackage): DataInsights;
  generateHook(insights: DataInsights): string;
  createDevelopmentSteps(insights: DataInsights): StoryStep[];
  craftConclusion(insights: DataInsights): Conclusion;
}

// 스타일 혼합
interface StyleMixer {
  calculateRatio(content: StoryContent): { nyt: number; pudding: number };
  applyNYTPatterns(steps: StoryStep[]): NYTFormatted[];
  applyPuddingPatterns(steps: StoryStep[]): PuddingFormatted[];
}
```

---

### 3.4 skill-d3-charts

```
.claude/skills/skill-d3-charts/
├── SKILL.md
├── reference.md
├── examples.md
└── modules/
    ├── chart-types/
    │   ├── line-chart.md
    │   ├── bar-chart.md
    │   ├── comparison-chart.md
    │   └── heatmap.md
    ├── scroll-integration.md     # 스크롤 연동
    ├── transitions.md            # 애니메이션
    ├── responsive.md             # 반응형
    └── accessibility.md          # 접근성
```

**핵심 패턴**:
```typescript
// 차트 컴포넌트 생성
interface D3ChartGenerator {
  selectChartType(data: DataPackage): ChartType;
  generateComponent(type: ChartType, data: DataPackage): ReactComponent;
  addScrollTransition(component: ReactComponent): ReactComponent;
  makeResponsive(component: ReactComponent): ReactComponent;
}

// 스크롤 연동
interface ScrollIntegration {
  bindToProgress(chart: D3Chart, progress: number): void;
  animateDataChange(chart: D3Chart, step: number): void;
  highlightDataPoint(chart: D3Chart, index: number): void;
}
```

---

### 3.5 skill-scrollytelling

```
.claude/skills/skill-scrollytelling/
├── SKILL.md
├── reference.md
├── examples.md
└── modules/
    ├── scrollama-setup.md        # Scrollama 설정
    ├── sticky-layout.md          # Sticky 레이아웃
    ├── step-triggers.md          # Step 트리거
    ├── mobile-fallback.md        # 모바일 대응
    └── performance.md            # 성능 최적화
```

**핵심 패턴**:
```typescript
// 스크롤리텔링 레이아웃
interface ScrollyLayout {
  createContainer(config: ScrollConfig): JSX.Element;
  createStickyChart(chart: ChartComponent): JSX.Element;
  createScrollSteps(steps: StoryStep[]): JSX.Element[];
}

// 이벤트 핸들링
interface ScrollEvents {
  onStepEnter(index: number, direction: 'up' | 'down'): void;
  onStepProgress(index: number, progress: number): void;
  onStepExit(index: number, direction: 'up' | 'down'): void;
}
```

---

## 4. Agent 간 협력 패턴

### 4.1 순차 실행 (Sequential) - Alfred 직접 조율

```
Alfred (CLAUDE.md Rule 5)
    │
    ├─ /interactive-article "topic" 실행
    │
    ├─1→ Task(expert-data-collector)
    │         └─→ .interactive/{slug}/data.json
    │
    ├─2→ Task(expert-story-architect)
    │         └─→ .interactive/{slug}/story.json
    │
    ├─3→ Task(expert-chart-builder)
    │         └─→ .interactive/{slug}/components/
    │
    ├─4→ Task(expert-scroll-orchestrator)
    │         └─→ app/interactive/{slug}/page.tsx
    │
    ├─5→ Task(ai-nano-banana) [조건부]
    │         └─→ .interactive/{slug}/assets/
    │
    └─6→ Build & Verify
          └─→ npm run build + Playwright test
```

### 4.2 병렬 실행 (Parallel) - 가능한 구간

```
After Stage 2 (story.json 확정 후):

    ┌─────────────────────────────────────┐
    │    .interactive/{slug}/story.json   │
    └─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
    Stage 3                 Stage 5
    (Chart)              (AI Image)
        │                       │
        └───────────┬───────────┘
                    ▼
               Stage 4
          (Scroll Assembly)
```

### 4.3 에러 복구 패턴

```typescript
interface ErrorRecovery {
  // 데이터 수집 실패 시
  dataCollectionFailed: {
    retry: 3,
    fallback: "cached_data" | "manual_input" | "abort"
  };

  // 차트 생성 실패 시
  chartBuildFailed: {
    retry: 2,
    fallback: "simpler_chart" | "static_image"
  };

  // AI 이미지 생성 실패 시
  imageFailed: {
    retry: 2,
    fallback: "placeholder" | "skip"
  };
}
```

---

## 5. 실행 예시

### 5.1 사용자 입력

```
/interactive-article "최근 30년간 한국 암환자 5년 생존율 변화"
```

### 5.2 자동 실행 플로우 (Alfred 조율)

```
Alfred: /interactive-article 명령 수신
   └─ slug 생성: cancer-survival
   └─ 작업 디렉토리 생성: .interactive/cancer-survival/

1️⃣ Task(expert-data-collector)
   └─ 국립암센터 중앙암등록본부 데이터 수집
   └─ 1993-2022년 암 종류별 생존율 데이터 추출
   └─ 출력: .interactive/cancer-survival/data.json

2️⃣ Task(expert-story-architect)
   └─ 입력: data.json 읽기
   └─ 핵심 인사이트: 42.9% → 72.9% (30%p 상승)
   └─ 3막 구조 설계: 충격(1993) → 발전(1999-2018) → 희망(2022)
   └─ 출력: .interactive/cancer-survival/story.json

3️⃣ Task(expert-chart-builder)
   └─ 입력: data.json + story.json 읽기
   └─ 기존 디자인 시스템 (Tailwind) 적용
   └─ 출력: .interactive/cancer-survival/components/
       ├─ SurvivalLineChart.tsx
       ├─ ComparisonChart.tsx
       ├─ AnimatedNumber.tsx
       └─ FilterButtons.tsx

4️⃣ Task(expert-scroll-orchestrator)
   └─ 입력: story.json + components/ 읽기
   └─ ScrollyContainer + Scrollama 설정
   └─ StickyChart 레이아웃 구성
   └─ 출력: app/interactive/cancer-survival/page.tsx

5️⃣ Task(ai-nano-banana) [조건부]
   └─ 히어로 이미지 필요 시에만 실행
   └─ "의료 발전과 희망" 테마 이미지 생성
   └─ 출력: .interactive/cancer-survival/assets/hero.png

6️⃣ Build & Verify
   └─ npm run build
   └─ Playwright 테스트 실행
   └─ 빌드 성공 확인

✅ 완료!
   📍 URL: /interactive/cancer-survival
   📊 컴포넌트: 4개
   📁 데이터: .interactive/cancer-survival/data.json
   📝 스토리: .interactive/cancer-survival/story.json
```

---

## 6. 구현 우선순위

### Phase 1: Slash Command + 핵심 Agent (1주)

| 순서 | 항목 | 우선순위 | 이유 |
|-----|------|---------|-----|
| 1 | `/interactive-article` 명령 | 🔴 Critical | 워크플로우 진입점 |
| 2 | expert-data-collector | 🔴 Critical | 데이터 없이 진행 불가 |
| 3 | expert-story-architect | 🔴 Critical | 스토리 구조 없이 시각화 불가 |

### Phase 2: 시각화 Agent (1주)

| 순서 | Agent | 우선순위 | 이유 |
|-----|-------|---------|-----|
| 4 | expert-chart-builder | 🟡 High | 차트 컴포넌트 생성 |
| 5 | expert-scroll-orchestrator | 🟡 High | 스크롤리텔링 조합 |

### Phase 3: AI 이미지 연동 (3일)

| 순서 | Agent | 우선순위 | 이유 |
|-----|-------|---------|-----|
| 6 | ai-nano-banana 연동 | 🟢 Medium | 기존 agent 활용, 조건부 실행 |

### Phase 4: Skill 구현 (1주)

| 순서 | Skill | 우선순위 |
|-----|-------|---------|
| 1 | skill-data-scraping | 🔴 Critical |
| 2 | skill-d3-charts | 🔴 Critical |
| 3 | skill-scrollytelling | 🟡 High |
| 4 | skill-storytelling | 🟢 Medium |

---

## 7. 예상 토큰 사용량

| Agent | 예상 토큰 | 실행 시간 |
|-------|----------|----------|
| expert-data-collector | 15,000 | 5분 |
| expert-story-architect | 10,000 | 3분 |
| expert-chart-builder | 20,000 | 8분 |
| expert-scroll-orchestrator | 15,000 | 5분 |
| ai-nano-banana (조건부) | 3,000 | 1분 |
| **Total** | **~63,000** | **~22분** |

**절감 효과**:
- 오케스트레이터 Agent 제거: -5,000 토큰
- 디자인 시스템 Agent 제거: -5,000 토큰
- 총 절감: ~10,000 토큰 (~14%)

---

## 8. 다음 단계

1. **사용자 승인** 후 구현 시작
2. **Phase 1**: `/interactive-article` 명령 + 핵심 Agent 생성 (builder-agent 활용)
3. **Phase 2**: 시각화 Agent 생성
4. **Phase 3**: AI 이미지 연동
5. **Phase 4**: Skill 생성 (builder-skill 활용)
6. **통합 테스트** (암 생존율 콘텐츠로 검증)
7. **이터레이션** 및 개선

---

## 9. 참고 사항

### 9.1 기존 MoAI-ADK Agent 재사용

- `ai-nano-banana`: AI 이미지 생성 (조건부 호출)
- `expert-frontend`: React 컴포넌트 품질 검증
- `manager-quality`: 전체 품질 게이트
- `mcp-playwright`: E2E 테스트

### 9.2 기존 Skill 재사용

- `moai-domain-frontend`: React/Next.js 패턴
- `moai-formats-data`: JSON 스키마

### 9.3 제거된 항목 (Best Practice 적용)

- ❌ `manager-article-interactive`: Alfred가 직접 조율 (CLAUDE.md Rule 5)
- ❌ `expert-visual-designer`: 디자인 시스템 이미 정해짐

---

## 10. 최종 Agent/Skill 요약

### 신규 Agent (4개)

| Agent | Tier | 역할 |
|-------|------|------|
| expert-data-collector | Expert | 공공데이터 수집, 웹 스크래핑, JSON 변환 |
| expert-story-architect | Expert | 3막 구조 설계, 스크롤 Step 기획 |
| expert-chart-builder | Expert | D3.js 차트 컴포넌트 생성 |
| expert-scroll-orchestrator | Expert | Scrollama 스크롤리텔링 조합 |

### 신규 Skill (4개)

| Skill | 역할 |
|-------|------|
| skill-data-scraping | 공공데이터포털/통계청 API, 웹 스크래핑 |
| skill-storytelling | 3막 구조, 데이터 인사이트, 스타일 혼합 |
| skill-d3-charts | 차트 타입, 스크롤 연동, 반응형 |
| skill-scrollytelling | Scrollama 설정, Sticky 레이아웃 |

### 신규 Slash Command (1개)

| Command | 역할 |
|---------|------|
| `/interactive-article` | 워크플로우 진입점, Agent 순차 호출 |

---

**문서 버전**: 0.2.0 (수정본)
**작성**: R2-D2
**수정 사항**: 오케스트레이터 Agent 제거, 디자인 시스템 Agent 제거, Claude Code Best Practice 적용
**검토 필요**: 사용자 승인 후 구현 시작
