'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface Drug {
  name: string;
  nameEn: string;
  approvalYear: number;
  type: string;
  milestone?: string;
  note?: string;
}

interface Generation {
  generation: number;
  name: string;
  nameEn: string;
  period: string;
  peakYear: number;
  color: string;
  mechanism: string;
  keyDrugs: Drug[];
}

interface DrugTimelineChartProps {
  generations: Generation[];
  currentStep: number;
  focusGeneration?: number | null;
  focusDrug?: string | null;
  width?: number;
  height?: number;
}

export default function DrugTimelineChart({
  generations,
  currentStep,
  focusGeneration = null,
  focusDrug = null,
  width = 800,
  height = 500,
}: DrugTimelineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const margin = { top: 20, right: 40, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // 컨테이너 크기 감지
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 좌우 스크롤 방식이므로 fontScale은 1로 고정 (원본 크기 유지)
  const fontScale = 1;

  // 모든 약물을 시간순으로 정렬
  const allDrugs = useMemo(() => {
    const drugs: (Drug & { generation: number; color: string })[] = [];
    generations.forEach(gen => {
      gen.keyDrugs.forEach(drug => {
        drugs.push({ ...drug, generation: gen.generation, color: gen.color });
      });
    });
    return drugs.sort((a, b) => a.approvalYear - b.approvalYear);
  }, [generations]);

  // 현재 스텝에 따라 보여줄 약물 결정
  const visibleDrugs = useMemo(() => {
    if (currentStep <= 2) return allDrugs.filter(d => d.generation === 1);
    if (currentStep <= 3) return allDrugs.filter(d => d.generation === 1);
    if (currentStep <= 7) return allDrugs.filter(d => d.generation <= 2);
    return allDrugs;
  }, [allDrugs, currentStep]);

  // X 스케일 (연도)
  const xScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([1975, 2025])
      .range([0, innerWidth]);
  }, [innerWidth]);

  // Y 스케일 (세대별 레인)
  const yScale = useMemo(() => {
    return d3.scaleBand<number>()
      .domain([1, 2, 3])
      .range([innerHeight, 0])
      .padding(0.3);
  }, [innerHeight]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('.chart-content').remove();

    const g = svg.append('g')
      .attr('class', 'chart-content')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 배경 레인 (세대별)
    generations.forEach(gen => {
      const isActive = focusGeneration === null || focusGeneration === gen.generation;
      const hasVisibleDrugs = visibleDrugs.some(d => d.generation === gen.generation);

      if (hasVisibleDrugs) {
        g.append('rect')
          .attr('x', 0)
          .attr('y', yScale(gen.generation) || 0)
          .attr('width', innerWidth)
          .attr('height', yScale.bandwidth())
          .attr('fill', gen.color)
          .attr('fill-opacity', isActive ? 0.08 : 0.02)
          .attr('rx', 8);

        // 세대 라벨
        g.append('text')
          .attr('x', -10)
          .attr('y', (yScale(gen.generation) || 0) + yScale.bandwidth() / 2)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .style('font-size', `${13 * fontScale}px`)
          .style('font-weight', '600')
          .style('fill', isActive ? gen.color : '#9CA3AF')
          .text(`${gen.generation}세대`);
      }
    });

    // X축 (연도)
    const xAxis = d3.axisBottom(xScale)
      .tickValues([1980, 1990, 2000, 2010, 2020])
      .tickFormat(d => `${d}년`);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight + 20})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', `${13 * fontScale}px`)
      .style('fill', '#6B7280');

    g.select('.x-axis .domain').attr('stroke', '#E5E7EB');
    g.selectAll('.x-axis .tick line').attr('stroke', '#E5E7EB');

    // 타임라인 기준선
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight + 20)
      .attr('y2', innerHeight + 20)
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 2);

    // 세대별로 약물을 그룹화하여 라벨 위치 계산
    const drugsByGeneration = new Map<number, typeof visibleDrugs>();
    visibleDrugs.forEach(drug => {
      const gen = drug.generation;
      if (!drugsByGeneration.has(gen)) {
        drugsByGeneration.set(gen, []);
      }
      drugsByGeneration.get(gen)!.push(drug);
    });

    // 각 세대 내에서 라벨 오프셋 계산 (겹침 방지)
    const labelOffsets = new Map<string, { y: number; xOffset: number }>();
    drugsByGeneration.forEach((drugs, gen) => {
      // 연도순 정렬 (이미 정렬되어 있지만 확실히)
      const sorted = [...drugs].sort((a, b) => a.approvalYear - b.approvalYear);

      sorted.forEach((drug, idx) => {
        // 기본 Y 오프셋: 번갈아 위/아래
        let labelY = (idx % 2 === 0) ? -30 : 35;
        let xOffset = 0;

        // 3세대 면역항암제 특별 처리 (2014-2017 연속)
        if (gen === 3) {
          // 4개 약물을 네 방향으로 분산
          const positions = [
            { y: -45, x: -15 },  // 키트루다: 왼쪽 위
            { y: 40, x: 10 },   // 옵디보: 오른쪽 아래
            { y: -30, x: 15 },  // 티센트릭: 오른쪽 위
            { y: 55, x: -10 },  // 임핀지: 왼쪽 아래
          ];
          const pos = positions[idx % 4];
          labelY = pos.y;
          xOffset = pos.x;
        }

        labelOffsets.set(drug.name, { y: labelY, xOffset });
      });
    });

    // 약물 포인트 및 라벨
    visibleDrugs.forEach((drug, i) => {
      const x = xScale(drug.approvalYear);
      const y = (yScale(drug.generation) || 0) + yScale.bandwidth() / 2;
      const isHighlighted = focusDrug === drug.name || focusDrug === drug.nameEn;
      const isGenerationFocused = focusGeneration === null || focusGeneration === drug.generation;
      const opacity = isGenerationFocused ? 1 : 0.2;

      // 라벨 오프셋 가져오기
      const offset = labelOffsets.get(drug.name) || { y: -25, xOffset: 0 };
      const labelY = offset.y;
      const labelXOffset = offset.xOffset;

      // 연결선 (타임라인에서 포인트까지)
      g.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', innerHeight + 20)
        .attr('y2', y)
        .attr('stroke', drug.color)
        .attr('stroke-width', isHighlighted ? 3 : 1.5)
        .attr('stroke-opacity', opacity * 0.5)
        .attr('stroke-dasharray', isHighlighted ? 'none' : '4,4');

      // 약물 포인트
      const pointGroup = g.append('g')
        .attr('class', `drug-point drug-${drug.nameEn}`)
        .attr('transform', `translate(${x},${y})`)
        .style('cursor', 'pointer');

      // 포인트 원
      pointGroup.append('circle')
        .attr('r', 0)
        .attr('fill', drug.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', isHighlighted ? 3 : 2)
        .attr('opacity', opacity)
        .transition()
        .delay(i * 80)
        .duration(400)
        .ease(d3.easeElastic.amplitude(1).period(0.5))
        .attr('r', isHighlighted ? 14 : 10);

      // 마일스톤 표시 (별)
      if (drug.milestone) {
        pointGroup.append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', `${12 * fontScale}px`)
          .style('fill', '#fff')
          .style('font-weight', 'bold')
          .style('pointer-events', 'none')
          .text('★')
          .style('opacity', 0)
          .transition()
          .delay(i * 80 + 400)
          .duration(200)
          .style('opacity', opacity);
      }

      // 약물 이름 라벨 - 오프셋 적용
      pointGroup.append('text')
        .attr('x', labelXOffset)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', labelY > 0 ? 'hanging' : 'auto')
        .style('font-size', `${(isHighlighted ? 15 : 13) * fontScale}px`)
        .style('font-weight', isHighlighted ? '700' : '500')
        .style('fill', isHighlighted ? drug.color : '#374151')
        .style('opacity', 0)
        .text(drug.name)
        .transition()
        .delay(i * 80 + 200)
        .duration(300)
        .style('opacity', opacity);

      // 연도 라벨
      pointGroup.append('text')
        .attr('x', labelXOffset)
        .attr('y', labelY + (labelY > 0 ? 18 : -16))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', labelY > 0 ? 'hanging' : 'auto')
        .style('font-size', `${13 * fontScale}px`)
        .style('fill', '#9CA3AF')
        .style('opacity', 0)
        .text(drug.approvalYear)
        .transition()
        .delay(i * 80 + 300)
        .duration(300)
        .style('opacity', opacity * 0.8);

      // 하이라이트 효과
      if (isHighlighted) {
        pointGroup.append('circle')
          .attr('r', 14)
          .attr('fill', 'none')
          .attr('stroke', drug.color)
          .attr('stroke-width', 2)
          .attr('opacity', 0)
          .transition()
          .delay(i * 80 + 400)
          .duration(600)
          .ease(d3.easeLinear)
          .attr('r', 30)
          .attr('opacity', 0)
          .on('end', function repeat() {
            d3.select(this)
              .attr('r', 14)
              .attr('opacity', 0.6)
              .transition()
              .duration(1200)
              .ease(d3.easeLinear)
              .attr('r', 35)
              .attr('opacity', 0)
              .on('end', repeat);
          });
      }
    });

  }, [visibleDrugs, generations, xScale, yScale, innerWidth, innerHeight, margin, width, focusGeneration, focusDrug, fontScale]);

  return (
    <div ref={containerRef} className="relative">
      {/* 차트 제목 - React로 렌더링하여 반응형 적용 */}
      <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 text-center mb-2 md:mb-4 break-keep">
        항암제 세대별 발전 타임라인
      </h3>
      {/* 모바일에서 좌우 스크롤 가능 */}
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto"
          style={{ minWidth: '700px', width: '100%', maxHeight: '55vh', minHeight: '280px' }}
        />
      </div>

      {/* 범례 - 스크롤 영역 밖에 배치 */}
      <motion.div
        className="flex justify-center gap-3 md:gap-6 mt-4 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {generations.map(gen => {
          const hasVisibleDrugs = visibleDrugs.some(d => d.generation === gen.generation);
          if (!hasVisibleDrugs) return null;

          return (
            <div
              key={gen.generation}
              className="flex items-center gap-1.5 md:gap-2"
              style={{ opacity: focusGeneration === null || focusGeneration === gen.generation ? 1 : 0.3 }}
            >
              <div
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
                style={{ backgroundColor: gen.color }}
              />
              <span className="text-xs md:text-sm text-gray-600">{gen.name}</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
