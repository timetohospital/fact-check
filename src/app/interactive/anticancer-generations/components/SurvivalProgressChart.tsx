'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';

interface SurvivalData {
  period: string;
  periodLabel: string;
  year: number;
  rate: number;
  generation: number;
  milestone?: string;
  description?: string;
}

interface SurvivalProgressChartProps {
  data: SurvivalData[];
  currentStep: number;
  focusYear?: string | null;
  showAnnotations?: boolean;
  width?: number;
  height?: number;
}

const GENERATION_COLORS = {
  1: '#6B7280',
  2: '#3B82F6',
  3: '#10B981',
};

export default function SurvivalProgressChart({
  data,
  currentStep,
  focusYear = null,
  showAnnotations = true,
  width = 800,
  height = 480,
}: SurvivalProgressChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<SurvivalData | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const margin = { top: 15, right: 80, bottom: 60, left: 70 };

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
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // 현재 스텝에 따라 보여줄 데이터
  const visibleData = useMemo(() => {
    // 스텝 1-3: 1993-2000 데이터 (1세대)
    if (currentStep <= 3) {
      return data.filter(d => d.year <= 2000);
    }
    // 스텝 4-7: 2010년까지 (2세대)
    if (currentStep <= 7) {
      return data.filter(d => d.year <= 2015);
    }
    // 스텝 8-10: 2018년까지 (3세대)
    if (currentStep <= 10) {
      return data.filter(d => d.year <= 2018);
    }
    // 스텝 11+: 전체 데이터
    return data;
  }, [data, currentStep]);

  // 스케일
  const xScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([1990, 2025])
      .range([0, innerWidth]);
  }, [innerWidth]);

  const yScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 50])
      .range([innerHeight, 0]);
  }, [innerHeight]);

  // 라인 제너레이터
  const lineGenerator = useMemo(() => {
    return d3.line<SurvivalData>()
      .x(d => xScale(d.year))
      .y(d => yScale(d.rate))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  // 영역 제너레이터
  const areaGenerator = useMemo(() => {
    return d3.area<SurvivalData>()
      .x(d => xScale(d.year))
      .y0(innerHeight)
      .y1(d => yScale(d.rate))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale, innerHeight]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('.chart-content').remove();

    const g = svg.append('g')
      .attr('class', 'chart-content')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 배경 그라디언트 정의
    const defs = svg.append('defs');

    // 세대별 영역 그라디언트
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'survival-area-gradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3B82F6')
      .attr('stop-opacity', 0.3);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3B82F6')
      .attr('stop-opacity', 0.02);

    // 세대별 배경 영역
    const generationZones = [
      { gen: 1, start: 1990, end: 2003, label: '1세대\n화학항암제' },
      { gen: 2, start: 2003, end: 2015, label: '2세대\n표적치료제' },
      { gen: 3, start: 2015, end: 2025, label: '3세대\n면역항암제' },
    ];

    generationZones.forEach(zone => {
      const isVisible = visibleData.some(d => d.year >= zone.start && d.year <= zone.end);
      if (!isVisible && zone.start > (visibleData[visibleData.length - 1]?.year || 1990)) return;

      const zoneEnd = Math.min(zone.end, visibleData[visibleData.length - 1]?.year || zone.end);

      g.append('rect')
        .attr('x', xScale(zone.start))
        .attr('y', 0)
        .attr('width', xScale(zoneEnd) - xScale(zone.start))
        .attr('height', innerHeight)
        .attr('fill', GENERATION_COLORS[zone.gen as keyof typeof GENERATION_COLORS])
        .attr('fill-opacity', 0.04);

      // 세대 라벨
      if (showAnnotations) {
        g.append('text')
          .attr('x', xScale(zone.start) + (xScale(zoneEnd) - xScale(zone.start)) / 2)
          .attr('y', -15)
          .attr('text-anchor', 'middle')
          .style('font-size', `${13 * fontScale}px`)
          .style('font-weight', '500')
          .style('fill', GENERATION_COLORS[zone.gen as keyof typeof GENERATION_COLORS])
          .style('opacity', 0.8)
          .text(`${zone.gen}세대`);
      }
    });

    // 그리드 라인
    const yTicks = [10, 20, 30, 40];
    yTicks.forEach(tick => {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(tick))
        .attr('y2', yScale(tick))
        .attr('stroke', '#E5E7EB')
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-opacity', 0.8);

      g.append('text')
        .attr('x', -10)
        .attr('y', yScale(tick))
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-size', `${13 * fontScale}px`)
        .style('fill', '#9CA3AF')
        .text(`${tick}%`);
    });

    // X축
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(xScale)
          .tickValues([1993, 2000, 2005, 2010, 2015, 2020])
          .tickFormat(d => `${d}`)
      )
      .selectAll('text')
      .style('font-size', `${13 * fontScale}px`)
      .style('fill', '#6B7280');

    // Y축 라벨
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .style('font-size', `${14 * fontScale}px`)
      .style('fill', '#374151')
      .style('font-weight', '500')
      .text('5년 생존율 (%)');

    // 영역 채우기
    if (visibleData.length > 1) {
      g.append('path')
        .datum(visibleData)
        .attr('fill', 'url(#survival-area-gradient)')
        .attr('d', areaGenerator)
        .style('opacity', 0)
        .transition()
        .duration(800)
        .style('opacity', 1);
    }

    // 메인 라인
    if (visibleData.length > 1) {
      // 세대별로 라인 색상 다르게
      let lastGen = visibleData[0].generation;
      let segmentStart = 0;

      visibleData.forEach((d, i) => {
        if (d.generation !== lastGen || i === visibleData.length - 1) {
          const segment = visibleData.slice(segmentStart, i === visibleData.length - 1 ? i + 1 : i + 1);

          const path = g.append('path')
            .datum(segment)
            .attr('fill', 'none')
            .attr('stroke', GENERATION_COLORS[lastGen as keyof typeof GENERATION_COLORS])
            .attr('stroke-width', 3.5)
            .attr('stroke-linecap', 'round')
            .attr('d', lineGenerator);

          const totalLength = path.node()?.getTotalLength() || 0;
          path
            .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .delay(segmentStart * 150)
            .duration(800)
            .ease(d3.easeQuadOut)
            .attr('stroke-dashoffset', 0);

          segmentStart = i;
          lastGen = d.generation;
        }
      });
    }

    // 데이터 포인트
    visibleData.forEach((d, i) => {
      const isFocused = focusYear === d.period;
      const pointGroup = g.append('g')
        .attr('class', 'data-point')
        .attr('transform', `translate(${xScale(d.year)},${yScale(d.rate)})`)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredPoint(d))
        .on('mouseleave', () => setHoveredPoint(null));

      // 외곽 원 (포커스 시)
      if (isFocused) {
        pointGroup.append('circle')
          .attr('r', 0)
          .attr('fill', 'none')
          .attr('stroke', GENERATION_COLORS[d.generation as keyof typeof GENERATION_COLORS])
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0.4)
          .transition()
          .delay(i * 100 + 500)
          .duration(600)
          .attr('r', 20);
      }

      // 메인 원
      pointGroup.append('circle')
        .attr('r', 0)
        .attr('fill', '#fff')
        .attr('stroke', GENERATION_COLORS[d.generation as keyof typeof GENERATION_COLORS])
        .attr('stroke-width', isFocused ? 4 : 3)
        .transition()
        .delay(i * 100)
        .duration(400)
        .ease(d3.easeElastic.amplitude(1).period(0.4))
        .attr('r', isFocused ? 10 : 7);

      // 값 라벨
      if (isFocused || i === visibleData.length - 1) {
        pointGroup.append('text')
          .attr('y', -20)
          .attr('text-anchor', 'middle')
          .style('font-size', `${(isFocused ? 18 : 15) * fontScale}px`)
          .style('font-weight', '700')
          .style('fill', GENERATION_COLORS[d.generation as keyof typeof GENERATION_COLORS])
          .style('opacity', 0)
          .text(`${d.rate}%`)
          .transition()
          .delay(i * 100 + 400)
          .duration(300)
          .style('opacity', 1);
      }

      // 마일스톤 어노테이션
      const shouldShowMilestone = d.milestone && showAnnotations && (isFocused || (i === 0 && !focusYear));
      if (shouldShowMilestone) {
        const annotationY = 50;

        pointGroup.append('line')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', 15)
          .attr('y2', annotationY - 5)
          .attr('stroke', '#CBD5E1')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2')
          .style('opacity', 0)
          .transition()
          .delay(i * 100 + 600)
          .duration(200)
          .style('opacity', 0.8);

        pointGroup.append('text')
          .attr('y', annotationY)
          .attr('text-anchor', 'middle')
          .style('font-size', `${13 * fontScale}px`)
          .style('fill', '#64748B')
          .style('opacity', 0)
          .text(d.milestone ?? "")
          .transition()
          .delay(i * 100 + 700)
          .duration(200)
          .style('opacity', 1);
      }
    });

  }, [visibleData, xScale, yScale, lineGenerator, areaGenerator, innerWidth, innerHeight, margin, width, height, focusYear, showAnnotations, fontScale]);

  return (
    <div ref={containerRef} className="relative">
      {/* 차트 제목 - React로 렌더링하여 반응형 적용 */}
      <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 text-center mb-2 md:mb-4 break-keep">
        폐암 5년 생존율 변화 (1993-2022)
      </h3>
      {/* 모바일에서 좌우 스크롤 가능 */}
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height - 80}`}
          className="h-auto"
          style={{ minWidth: '700px', width: '100%', maxHeight: '60vh', minHeight: '280px' }}
        />
      </div>

      {/* 호버 툴팁 */}
      <AnimatePresence>
        {hoveredPoint && (
          <motion.div
            className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 pointer-events-none z-10"
            style={{
              left: `calc(${((hoveredPoint.year - 1990) / 35) * 100}% + 70px)`,
              top: `calc(${((50 - hoveredPoint.rate) / 50) * 100}% + 40px)`,
              transform: 'translate(-50%, -100%) translateY(-20px)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm font-semibold text-gray-900">{hoveredPoint.period}</div>
            <div
              className="text-2xl font-bold mt-1"
              style={{ color: GENERATION_COLORS[hoveredPoint.generation as keyof typeof GENERATION_COLORS] }}
            >
              {hoveredPoint.rate}%
            </div>
            {hoveredPoint.milestone && (
              <div className="text-xs text-gray-500 mt-1">{hoveredPoint.milestone}</div>
            )}
            {hoveredPoint.description && (
              <div className="text-xs text-gray-600 mt-1 font-medium">{hoveredPoint.description}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 요약 통계 */}
      {visibleData.length > 1 && (
        <motion.div
          className="flex justify-center gap-4 md:gap-8 lg:gap-12 mt-4 md:mt-6 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="text-center">
            <div className="text-xs md:text-sm lg:text-base text-gray-500">시작</div>
            <div className="text-base md:text-xl lg:text-2xl font-bold text-gray-700">{visibleData[0].rate}%</div>
            <div className="text-[10px] md:text-xs lg:text-sm text-gray-400">{visibleData[0].period}</div>
          </div>
          <div className="text-center">
            <div className="text-xs md:text-sm lg:text-base text-gray-500">현재</div>
            <div className="text-base md:text-xl lg:text-2xl font-bold text-blue-600">
              {visibleData[visibleData.length - 1].rate}%
            </div>
            <div className="text-[10px] md:text-xs lg:text-sm text-gray-400">{visibleData[visibleData.length - 1].period}</div>
          </div>
          <div className="text-center">
            <div className="text-xs md:text-sm lg:text-base text-gray-500">향상</div>
            <div className="text-base md:text-xl lg:text-2xl font-bold text-green-600">
              +{(visibleData[visibleData.length - 1].rate - visibleData[0].rate).toFixed(1)}%p
            </div>
            <div className="text-[10px] md:text-xs lg:text-sm text-gray-400">
              {((visibleData[visibleData.length - 1].rate / visibleData[0].rate)).toFixed(1)}배
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
