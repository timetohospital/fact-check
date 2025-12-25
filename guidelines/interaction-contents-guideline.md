# 인터랙티브 콘텐츠 제작 가이드라인 (움직이는 글)

> **버전**: 1.0
> **최종 수정**: 2024-12-20
> **스타일**: NYT 기반 (70%) + The Pudding 혼합 (30%)

---

## 개요

'움직이는 글' 카테고리는 스크롤에 따라 시각적으로 변화하는 인터랙티브 인포그래픽 콘텐츠를 제공합니다.
정적인 글과 달리, 독자가 스크롤하며 데이터를 탐험하고 이해할 수 있도록 설계됩니다.

### 목표 스타일

| 스타일 | 적용 비율 | 특징 |
|-------|----------|------|
| **NYT 스타일** | 70% | 스크롤 동기화, 차트 트랜지션, 텍스트-시각화 연동 |
| **The Pudding 스타일** | 30% | 클릭/호버 인터랙션, 필터링, 사용자 선택 |

### 제작 워크플로우 (7단계)

```
1. 콘텐츠 방향 설정 → 2. 정보 수집 → 3. 인터랙션 방향 설정
                              ↓
7. 디버깅 ← 6. 테스트 ← 5. 개발 ← 4. 기술 스택 준비
```

---

## 1단계: 콘텐츠 방향 설정

### 1.1 핵심 메시지 정의

**질문 형식으로 작성**:
- 이 콘텐츠가 답하려는 핵심 질문은?
- 독자가 얻어갈 핵심 인사이트는?
- 왜 이 주제가 중요한가?

**예시 (암 생존율)**:
> **핵심 질문**: "지난 50년간 한국의 암 치료는 얼마나 발전했는가?"
> **핵심 인사이트**: 1970년대 20%대 → 현재 70%대로 생존율 급등
> **중요성**: 의료 발전의 실질적 성과를 데이터로 체감

### 1.2 콘텐츠 구조 설계

**스토리 아크 (3막 구조)**:

| 막 | 내용 | 인터랙션 유형 |
|---|-----|-------------|
| **1막: 도입** | 충격적인 과거 데이터 제시 | 정적 텍스트 + 단일 숫자 애니메이션 |
| **2막: 전개** | 시간에 따른 변화 시각화 | 스크롤 동기화 차트 (NYT) |
| **3막: 결말** | 암 종류별 비교, 인사이트 | 필터링 인터랙션 (The Pudding) |

### 1.3 정적 vs 인터랙션 영역 구분

**결정 기준**:
- ✅ **인터랙션**: 시간에 따른 변화, 비교, 탐색이 필요한 데이터
- ❌ **정적**: 배경 설명, 인용문, 출처, 결론 요약

---

## 2단계: 정보(자료) 수집

### 2.1 신뢰할 수 있는 데이터 소스

**필수 요건**:
- 정부/학술 기관 공식 데이터
- 최신 업데이트 (최근 2년 이내)
- 원본 데이터 접근 가능

**한국 암 통계 주요 소스**:

| 소스 | URL | 데이터 범위 |
|-----|-----|-----------|
| 국립암센터 | cancer.go.kr | 1999년~ 암 발생률, 생존율 |
| 중앙암등록본부 | ncc.re.kr | 5년 상대생존율 |
| 통계청 사망원인통계 | kostat.go.kr | 암 사망률 추이 |
| KOSIS 국가통계포털 | kosis.kr | 종합 통계 |

### 2.2 데이터 정제

**JSON 형식 예시**:
```json
{
  "title": "한국 암환자 5년 상대생존율",
  "unit": "%",
  "source": "국립암센터",
  "lastUpdated": "2024-12-20",
  "data": [
    { "period": "1993-1995", "all": 41.2, "stomach": 42.8, "lung": 11.3, "liver": 10.2, "colorectal": 54.8 },
    { "period": "1996-2000", "all": 44.0, "stomach": 46.5, "lung": 12.5, "liver": 12.8, "colorectal": 58.0 },
    { "period": "2001-2005", "all": 53.8, "stomach": 57.2, "lung": 16.3, "liver": 18.3, "colorectal": 66.6 },
    { "period": "2006-2010", "all": 62.0, "stomach": 67.0, "lung": 21.4, "liver": 26.0, "colorectal": 72.6 },
    { "period": "2011-2015", "all": 69.4, "stomach": 74.4, "lung": 28.2, "liver": 33.6, "colorectal": 76.3 },
    { "period": "2017-2021", "all": 72.1, "stomach": 78.0, "lung": 36.8, "liver": 38.7, "colorectal": 74.3 }
  ]
}
```

### 2.3 출처 명시 규칙

- 차트 하단에 출처 표기 필수
- 데이터 수집일 명시
- 원본 링크 제공

**예시**:
```
출처: 국립암센터 중앙암등록본부, 2024년 암등록통계
데이터 기준: 2017-2021년 진단 환자
```

---

## 3단계: 인터랙션 방향 설정

### 3.1 스크롤리텔링 유형 선택

| 유형 | 설명 | 사용 시점 |
|-----|-----|----------|
| **Steps** | 단계별 이산적 전환 | 연도별 데이터 변화 |
| **Continuous** | 부드러운 연속 전환 | 시간 축 슬라이딩 |
| **Triggers** | 특정 지점에서 활성화 | 주요 이벤트 하이라이트 |

### 3.2 NYT 스타일 적용 (70%)

**적용 요소**:
- 스크롤 진행률에 따른 차트 업데이트
- 텍스트 설명과 시각화 동기화
- 고정된(sticky) 시각화 영역 + 스크롤되는 텍스트

**레이아웃**:
```
┌─────────────────────────────────────────────┐
│                                             │
│  [스크롤되는 텍스트]    │    [고정 차트]     │
│                        │                   │
│  Step 1: 1970년대      │       📊          │
│  암 생존율은 20%...    │                   │
│                        │                   │
│  Step 2: 1990년대      │                   │
│  검진 확대로...        │                   │
│                        │                   │
│  Step 3: 2000년대      │                   │
│  표적치료제 도입...    │                   │
│                        │                   │
└─────────────────────────────────────────────┘
```

### 3.3 The Pudding 스타일 적용 (30%)

**적용 요소**:
- 암 종류 필터 버튼 (위암, 폐암, 간암, 대장암 등)
- 특정 데이터 포인트 호버 시 상세 정보 툴팁
- "당신의 선택" 인터랙션 (선택한 암 종류 하이라이트)

**예시 UI**:
```
┌─────────────────────────────────────────────┐
│  암 종류를 선택하세요:                       │
│                                             │
│  [전체] [위암] [폐암] [간암] [대장암] [유방암] │
│                                             │
│  선택된 암: 폐암                             │
│  1993년: 11.3% → 2021년: 36.8%              │
│  변화율: +225%                               │
└─────────────────────────────────────────────┘
```

---

## 4단계: 기술 스택 준비

### 4.1 필수 라이브러리

```bash
npm install scrollama gsap d3 framer-motion
```

| 라이브러리 | 버전 | 역할 |
|-----------|-----|------|
| scrollama | ^3.2.0 | 스크롤 이벤트 감지 |
| gsap | ^3.12.0 | 애니메이션 |
| d3 | ^7.8.0 | 데이터 시각화 |
| framer-motion | ^11.0.0 | React 인터랙션 |

### 4.2 컴포넌트 구조

```
src/components/interactive/
├── ScrollyContainer.tsx      # 스크롤리텔링 래퍼
├── StickyChart.tsx           # 고정 차트 영역
├── ScrollStep.tsx            # 각 스크롤 단계
├── CancerSurvivalChart.tsx   # 암 생존율 전용 차트
├── FilterButtons.tsx         # The Pudding 스타일 필터
└── Tooltip.tsx               # 데이터 포인트 툴팁
```

### 4.3 데이터 바인딩

```typescript
// types/survival.ts
interface SurvivalData {
  period: string;
  all: number;
  cancerTypes: Record<string, number>;
}

// hooks/useScrollProgress.ts
const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const scroller = scrollama();
    scroller
      .setup({ step: '.scroll-step', offset: 0.5, progress: true })
      .onStepProgress(({ progress }) => setProgress(progress));

    return () => scroller.destroy();
  }, []);

  return progress;
};

// 스크롤 진행률에 따른 데이터 선택
const currentData = useMemo(() => {
  const index = Math.floor(progress * data.length);
  return data[Math.min(index, data.length - 1)];
}, [progress, data]);
```

---

## 5단계: 개발

### 5.1 스크롤 섹션 구현

```tsx
// components/interactive/ScrollyContainer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import scrollama from 'scrollama';

interface ScrollyContainerProps {
  children: React.ReactNode;
  onProgress: (progress: number, step: number) => void;
}

export default function ScrollyContainer({ children, onProgress }: ScrollyContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollama();

    scroller
      .setup({
        step: '.scroll-step',
        offset: 0.5,
        progress: true,
      })
      .onStepProgress(({ progress, index }) => {
        onProgress(progress, index);
      });

    return () => scroller.destroy();
  }, [onProgress]);

  return (
    <div ref={containerRef} className="scrolly-container">
      {children}
    </div>
  );
}
```

### 5.2 차트 구현 (D3.js)

```tsx
// components/interactive/CancerSurvivalChart.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ChartProps {
  data: SurvivalData[];
  currentStep: number;
  selectedCancer: string;
}

export default function CancerSurvivalChart({ data, currentStep, selectedCancer }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    // 스케일 설정
    const xScale = d3.scalePoint()
      .domain(data.map(d => d.period))
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    // 라인 생성기
    const line = d3.line<SurvivalData>()
      .x(d => xScale(d.period)!)
      .y(d => yScale(d[selectedCancer] || d.all))
      .curve(d3.curveMonotoneX);

    // 현재 스텝까지의 데이터만 표시
    const visibleData = data.slice(0, currentStep + 1);

    // 라인 업데이트 (트랜지션)
    svg.select('.line-path')
      .datum(visibleData)
      .transition()
      .duration(300)
      .attr('d', line);

  }, [data, currentStep, selectedCancer]);

  return (
    <svg ref={svgRef} viewBox="0 0 600 400" className="w-full h-auto">
      <path className="line-path" fill="none" stroke="#3b82f6" strokeWidth="3" />
      {/* 축, 레이블 등 */}
    </svg>
  );
}
```

### 5.3 반응형 대응

**브레이크포인트**:
- **Desktop (1024px+)**: 2열 레이아웃 (텍스트 50% | 차트 50%)
- **Tablet (768px-1023px)**: 1열, 차트 상단 고정 (sticky)
- **Mobile (767px 이하)**: 1열, 차트 인라인 (각 스텝 사이에 배치)

```css
/* styles/scrolly.css */
.scrolly-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.sticky-chart {
  position: sticky;
  top: 10vh;
  height: 80vh;
}

@media (max-width: 1023px) {
  .scrolly-container {
    grid-template-columns: 1fr;
  }

  .sticky-chart {
    height: 50vh;
  }
}

@media (max-width: 767px) {
  .sticky-chart {
    position: relative;
    top: auto;
    height: auto;
  }
}
```

---

## 6단계: 테스트

### 6.1 테스트 체크리스트

**기능 테스트**:
- [ ] 스크롤 진행률 0~100% 정상 작동
- [ ] 모든 단계(Step) 트리거 정상
- [ ] 필터 버튼 클릭 시 차트 업데이트
- [ ] 호버 툴팁 정상 표시
- [ ] 뒤로 스크롤 시 애니메이션 역재생

**크로스 브라우저**:
- [ ] Chrome (최신)
- [ ] Safari (최신)
- [ ] Firefox (최신)
- [ ] Edge (최신)

**모바일**:
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] 터치 스크롤 정상
- [ ] 터치 인터랙션 정상 (탭으로 필터 선택)

**성능**:
- [ ] Lighthouse Performance > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1

**접근성**:
- [ ] 키보드 네비게이션 가능
- [ ] 스크린 리더 호환
- [ ] 색각 이상자 대응 (패턴/텍스처 추가)
- [ ] 모션 감소 설정 존중 (prefers-reduced-motion)

---

## 7단계: 디버깅

### 7.1 일반적인 이슈와 해결책

| 이슈 | 원인 | 해결책 |
|-----|-----|-------|
| 스크롤 끊김 | IntersectionObserver 미지원 | polyfill 추가 (`intersection-observer`) |
| 차트 리렌더링 과다 | useEffect 의존성 문제 | useMemo/useCallback으로 최적화 |
| 모바일 성능 저하 | 복잡한 애니메이션 | will-change, GPU 가속, 애니메이션 단순화 |
| 메모리 누수 | 이벤트 리스너 미정리 | cleanup 함수에서 scroller.destroy() 호출 |
| SSR 오류 | 서버에서 window 접근 | 'use client' 및 dynamic import 사용 |

### 7.2 디버깅 도구

```typescript
// hooks/useDebugScroll.ts (개발 환경 전용)
export function useDebugScroll(progress: number, step: number) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Scroll Debug - Progress: ${(progress * 100).toFixed(1)}%, Step: ${step}`);
    }
  }, [progress, step]);
}
```

### 7.3 성능 최적화 체크리스트

- [ ] 이미지 lazy loading 적용
- [ ] 차트 SVG 최적화 (불필요한 요소 제거)
- [ ] requestAnimationFrame 사용
- [ ] Debounce/Throttle 적용 (스크롤 이벤트)
- [ ] 코드 스플리팅 (dynamic import)

---

## 부록 A: 첫 콘텐츠 체크리스트

**"50년간 한국 암환자 생존율 변화" 제작 체크리스트**:

### 1단계 완료 조건
- [ ] 핵심 질문 정의 완료
- [ ] 3막 구조 스토리보드 작성
- [ ] 인터랙션 영역 vs 정적 영역 구분

### 2단계 완료 조건
- [ ] 국립암센터 데이터 수집
- [ ] JSON 형식으로 정제
- [ ] 출처 및 라이선스 확인

### 3단계 완료 조건
- [ ] NYT 스타일 적용 범위 확정 (각 스텝 정의)
- [ ] The Pudding 스타일 적용 범위 확정 (필터 목록)
- [ ] 와이어프레임 작성

### 4단계 완료 조건
- [ ] 라이브러리 설치 (`npm install scrollama gsap d3 framer-motion`)
- [ ] 컴포넌트 파일 생성
- [ ] 타입 정의 완료

### 5단계 완료 조건
- [ ] ScrollyContainer 구현
- [ ] CancerSurvivalChart 구현
- [ ] FilterButtons 구현
- [ ] 반응형 스타일 적용

### 6단계 완료 조건
- [ ] 기능 테스트 통과
- [ ] 크로스 브라우저 테스트 통과
- [ ] 모바일 테스트 통과
- [ ] Lighthouse 90+ 달성

### 7단계 완료 조건
- [ ] 모든 버그 수정
- [ ] 성능 최적화 완료
- [ ] 최종 QA 통과

---

## 부록 B: 참고 자료

### 스크롤리텔링 레퍼런스
- [The Pudding - How to Implement Scrollytelling](https://pudding.cool/process/how-to-implement-scrollytelling/)
- [The Pudding - Responsive Scrollytelling Best Practices](https://pudding.cool/process/responsive-scrollytelling/)
- [GSAP ScrollTrigger Documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Framer Motion Scroll Animations](https://motion.dev/docs/react-scroll-animations)

### 데이터 시각화 레퍼런스
- [D3.js Graph Gallery](https://d3-graph-gallery.com/)
- [Observable D3 Examples](https://observablehq.com/@d3)
- [Our World in Data - Cancer](https://ourworldindata.org/cancer)

### 수상작 레퍼런스
- [Information is Beautiful Awards 2024](https://www.informationisbeautifulawards.com/news/680-announcing-the-2024-winners)
- [FlowingData Best of 2024](https://flowingdata.com/2024/12/30/best-data-visualization-projects-of-2024/)
- [NYT 2024 Year in Graphics](https://www.nytimes.com/interactive/2024/12/20/us/2024-year-in-graphics.html)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|-----|-----|----------|
| 1.0 | 2024-12-20 | 최초 작성 |
