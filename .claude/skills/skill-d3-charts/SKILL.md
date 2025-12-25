---
name: skill-d3-charts
description: D3.js 기반 인터랙티브 차트 구현. 스크롤 연동 시각화, React 통합, 애니메이션 패턴 제공. expert-chart-builder에서 사용.
tools: Read, Write, Edit, Glob, Grep
---

# Skill: D3 Charts

D3.js 기반 인터랙티브 차트 구현 전문 Skill

## Quick Reference

### Dependencies

```json
{
  "d3": "^7.8.0",
  "framer-motion": "^11.0.0",
  "react": "^19.0.0"
}
```

### 차트 유형

| 유형 | 용도 | 파일 |
|-----|------|------|
| LineChart | 시계열 변화 | `examples.md#line-chart` |
| MultiLineChart | 카테고리 비교 | `examples.md#multi-line-chart` |
| BarChart | 단일 시점 비교 | `examples.md#bar-chart` |

### currentStep 연동 패턴

```tsx
interface ScrollAwareChartProps {
  data: DataPoint[];
  currentStep: number;  // Scrollama에서 전달
}

// 현재 Step에 따라 표시할 데이터 범위 결정
const visibleData = useMemo(() => {
  return data.slice(0, currentStep + 1);
}, [data, currentStep]);
```

---

## Implementation Guide

### 1. 기본 차트 구조

```tsx
'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  period: string;
  value: number;
  label?: string;
}

interface ChartProps {
  data: DataPoint[];
  currentStep: number;
  width?: number;
  height?: number;
}

export default function Chart({ data, currentStep, width = 600, height = 400 }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const visibleData = useMemo(() => {
    return data.slice(0, currentStep + 1);
  }, [data, currentStep]);

  useEffect(() => {
    if (!svgRef.current || visibleData.length === 0) return;
    // D3 렌더링 로직
  }, [visibleData]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

### 2. 스케일 설정

```tsx
const margin = { top: 20, right: 30, bottom: 40, left: 50 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// X축: 카테고리
const xScale = d3.scalePoint<string>()
  .domain(data.map(d => d.period))
  .range([0, innerWidth]);

// Y축: 값 (0-100%)
const yScale = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value) || 100])
  .nice()
  .range([innerHeight, 0]);
```

### 3. 라인 그리기

```tsx
const line = d3.line<DataPoint>()
  .x(d => xScale(d.period)!)
  .y(d => yScale(d.value))
  .curve(d3.curveMonotoneX);  // 부드러운 곡선

g.append('path')
  .datum(visibleData)
  .attr('fill', 'none')
  .attr('stroke', '#3B82F6')
  .attr('stroke-width', 3)
  .attr('d', line);
```

---

## Animation Patterns

### Line Reveal (선 그리기 애니메이션)

```tsx
const totalLength = path.node()?.getTotalLength() || 0;
path
  .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
  .attr('stroke-dashoffset', totalLength)
  .transition()
  .duration(1000)
  .ease(d3.easeQuadInOut)
  .attr('stroke-dashoffset', 0);
```

### Point Pop (포인트 등장)

```tsx
circles
  .attr('r', 0)
  .transition()
  .delay((_, i) => i * 100)
  .duration(300)
  .ease(d3.easeBackOut.overshoot(1.5))
  .attr('r', 6);
```

### Highlight Pulse (강조 효과)

```tsx
function pulse(selection: d3.Selection<any, any, any, any>) {
  selection
    .transition().duration(500).attr('r', 10)
    .transition().duration(500).attr('r', 6)
    .on('end', () => pulse(selection));
}
```

---

## Responsive Design

### useResizeObserver Hook

```tsx
function useResizeObserver<T extends HTMLElement>(): [
  React.RefObject<T>,
  { width: number; height: number }
] {
  const ref = useRef<T>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, dimensions];
}
```

### 반응형 차트 사용

```tsx
function ResponsiveChart({ data, currentStep }: Props) {
  const [containerRef, { width, height }] = useResizeObserver<HTMLDivElement>();

  return (
    <div ref={containerRef} className="w-full h-full">
      {width > 0 && (
        <LineChart data={data} currentStep={currentStep} width={width} height={height} />
      )}
    </div>
  );
}
```

---

## Accessibility

### ARIA 속성

```tsx
<svg
  ref={svgRef}
  width={width}
  height={height}
  role="img"
  aria-label="2023년 암 종류별 5년 생존율 비교 차트"
  aria-describedby="chart-desc"
>
  <desc id="chart-desc">
    갑상선암 100%, 유방암 93.8%, 폐암 36.8%, 췌장암 15.2%
  </desc>
</svg>
```

### 접근성 색상 팔레트

```typescript
const accessibleColors = {
  blue: '#2563EB',    // 4.5:1 대비
  green: '#059669',   // 4.5:1 대비
  red: '#DC2626',     // 4.5:1 대비
  purple: '#7C3AED',  // 4.5:1 대비
  orange: '#EA580C',  // 4.5:1 대비
};
```

---

## Performance Optimization

### useMemo 활용

```tsx
// 스케일 메모이제이션
const xScale = useMemo(
  () => d3.scalePoint<string>()
    .domain(data.map(d => d.period))
    .range([0, innerWidth]),
  [data, innerWidth]
);

// 라인 제너레이터 메모이제이션
const line = useMemo(
  () => d3.line<DataPoint>()
    .x(d => xScale(d.period)!)
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX),
  [xScale, yScale]
);
```

### 부분 업데이트

```tsx
// 전체 재생성 대신 트랜지션으로 업데이트
svg.select('.line-path')
  .datum(visibleData)
  .transition()
  .duration(500)
  .attr('d', line);
```

---

## Best Practices

### DO

- `currentStep` prop으로 스크롤 연동
- `useMemo`로 스케일/라인 메모이제이션
- ARIA 속성으로 접근성 확보
- 부분 업데이트로 성능 최적화

### DON'T

- useEffect 내에서 매번 전체 재생성
- 하드코딩된 크기 사용
- 색상 대비 무시
- cleanup 함수 누락

---

## Related Files

- `examples.md` - 전체 차트 컴포넌트 코드
- `skill-scrollytelling` - Scrollama 연동 패턴
- `skill-storytelling` - 스토리 구조 설계

---

**Skill Version:** 1.0.0
**Created:** 2025-12-20
