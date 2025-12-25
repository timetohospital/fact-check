# D3 Charts Examples

완전한 차트 컴포넌트 코드 예제

---

## Line Chart

시계열 데이터 표시용 라인 차트

```tsx
'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  period: string;
  value: number;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  currentStep: number;
  width?: number;
  height?: number;
  color?: string;
}

export default function LineChart({
  data,
  currentStep,
  width = 600,
  height = 400,
  color = '#3B82F6',
}: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const visibleData = useMemo(() => {
    const endIndex = Math.min(currentStep + 1, data.length);
    return data.slice(0, endIndex);
  }, [data, currentStep]);

  useEffect(() => {
    if (!svgRef.current || visibleData.length === 0) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous
    svg.selectAll('*').remove();

    // Create group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scalePoint<string>()
      .domain(data.map(d => d.period))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 100])
      .nice()
      .range([innerHeight, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('font-size', '12px')
      .attr('fill', '#6B7280');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))
      .selectAll('text')
      .attr('font-size', '12px')
      .attr('fill', '#6B7280');

    // Line generator
    const line = d3.line<DataPoint>()
      .x(d => xScale(d.period)!)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw line
    const path = g.append('path')
      .datum(visibleData)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('d', line);

    // Animate line drawing
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(500)
      .attr('stroke-dashoffset', 0);

    // Draw points
    g.selectAll('.point')
      .data(visibleData)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => xScale(d.period)!)
      .attr('cy', d => yScale(d.value))
      .attr('r', 0)
      .attr('fill', color)
      .transition()
      .delay((_, i) => i * 50)
      .duration(300)
      .attr('r', 6);

    // Value labels
    g.selectAll('.label')
      .data(visibleData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.period)!)
      .attr('y', d => yScale(d.value) - 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', color)
      .attr('opacity', 0)
      .text(d => d.label || `${d.value}%`)
      .transition()
      .delay((_, i) => i * 50 + 200)
      .duration(300)
      .attr('opacity', 1);

  }, [visibleData, data, width, height, color]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label="시계열 라인 차트"
    />
  );
}
```

---

## Multi-Line Chart

여러 카테고리 비교용 멀티 라인 차트

```tsx
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CategoryData {
  name: string;
  color: string;
  data: { period: string; value: number }[];
}

interface MultiLineChartProps {
  categories: Record<string, CategoryData>;
  selected: string[];
  width?: number;
  height?: number;
}

export default function MultiLineChart({
  categories,
  selected,
  width = 600,
  height = 400,
}: MultiLineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 20, right: 120, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get all periods
    const allPeriods = Object.values(categories)[0]?.data.map(d => d.period) || [];

    // Scales
    const xScale = d3.scalePoint<string>()
      .domain(allPeriods)
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`));

    // Line generator
    const line = d3.line<{ period: string; value: number }>()
      .x(d => xScale(d.period)!)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw lines for each category
    Object.entries(categories).forEach(([key, category]) => {
      const isSelected = selected.length === 0 || selected.includes(key);

      g.append('path')
        .datum(category.data)
        .attr('fill', 'none')
        .attr('stroke', category.color)
        .attr('stroke-width', isSelected ? 3 : 1)
        .attr('opacity', isSelected ? 1 : 0.2)
        .attr('d', line)
        .attr('class', `line-${key}`)
        .transition()
        .duration(300);
    });

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth + 20}, 0)`);

    Object.entries(categories).forEach(([key, category], i) => {
      const isSelected = selected.length === 0 || selected.includes(key);

      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendItem.append('rect')
        .attr('width', 16)
        .attr('height', 16)
        .attr('fill', category.color)
        .attr('opacity', isSelected ? 1 : 0.3);

      legendItem.append('text')
        .attr('x', 24)
        .attr('y', 12)
        .attr('font-size', '12px')
        .attr('fill', isSelected ? '#1F2937' : '#9CA3AF')
        .text(category.name);
    });

  }, [categories, selected, width, height]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label="카테고리별 비교 차트"
    />
  );
}
```

---

## Bar Chart

단일 시점 카테고리 비교용 막대 차트

```tsx
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface BarData {
  category: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarData[];
  width?: number;
  height?: number;
  horizontal?: boolean;
}

export default function BarChart({
  data,
  width = 600,
  height = 400,
  horizontal = false,
}: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 20, right: 30, bottom: 60, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (horizontal) {
      // Horizontal bar chart
      const yScale = d3.scaleBand()
        .domain(data.map(d => d.category))
        .range([0, innerHeight])
        .padding(0.3);

      const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, innerWidth]);

      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('y', d => yScale(d.category)!)
        .attr('height', yScale.bandwidth())
        .attr('fill', d => d.color)
        .attr('x', 0)
        .attr('width', 0)
        .transition()
        .duration(500)
        .delay((_, i) => i * 50)
        .attr('width', d => xScale(d.value));

      // Labels
      g.selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('y', d => yScale(d.category)! + yScale.bandwidth() / 2 + 4)
        .attr('x', d => xScale(d.value) + 8)
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', d => d.color)
        .text(d => `${d.value}%`);

      // Y axis
      g.append('g')
        .call(d3.axisLeft(yScale));

    } else {
      // Vertical bar chart
      const xScale = d3.scaleBand()
        .domain(data.map(d => d.category))
        .range([0, innerWidth])
        .padding(0.3);

      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);

      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.category)!)
        .attr('width', xScale.bandwidth())
        .attr('fill', d => d.color)
        .attr('y', innerHeight)
        .attr('height', 0)
        .transition()
        .duration(500)
        .delay((_, i) => i * 50)
        .attr('y', d => yScale(d.value))
        .attr('height', d => innerHeight - yScale(d.value));

      // X axis
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

      // Y axis
      g.append('g')
        .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`));
    }

  }, [data, width, height, horizontal]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

---

## Step-Based Chart State

스크롤 Step에 따른 차트 상태 관리

```typescript
interface ChartState {
  focusYear?: string;
  highlightCategory?: string;
  zoomLevel?: number;
  animation?: 'reveal' | 'highlight' | 'compare';
}

interface StoryStep {
  title: string;
  content: string;
  chartState: ChartState;
}

function getChartState(step: number, story: StoryStep[]): ChartState {
  return story[step]?.chartState || {};
}

// 사용 예시
const story: StoryStep[] = [
  {
    title: "1993년",
    content: "암은 사형선고였다",
    chartState: { focusYear: "1993-1995", animation: "reveal" }
  },
  {
    title: "2000년대",
    content: "국가암조기검진사업 시작",
    chartState: { focusYear: "1999-2001", animation: "highlight" }
  },
  {
    title: "현재",
    content: "10명 중 7명이 생존",
    chartState: { animation: "compare" }
  }
];
```

---

**Examples Version:** 1.0.0
**Related:** skill-d3-charts/SKILL.md
