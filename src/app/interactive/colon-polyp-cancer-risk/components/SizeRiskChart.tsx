'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface SizeData {
  sizeLabel: string;
  cancerRisk: number;
}

interface SizeRiskChartProps {
  data: SizeData[];
  currentStep: number;
  width?: number;
  height?: number;
}

export default function SizeRiskChart({
  data,
  currentStep,
  width = 600,
  height = 400,
}: SizeRiskChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const margin = { top: 60, right: 40, bottom: 80, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(() => {
    return d3.scaleBand()
      .domain(data.map(d => d.sizeLabel))
      .range([0, innerWidth])
      .padding(0.4);
  }, [data, innerWidth]);

  const yScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 50])
      .range([innerHeight, 0]);
  }, [innerHeight]);

  // Design System colors - 절제된 Green → Gray → Blue 그라데이션
  // anticancer-generations 스타일에 맞춤
  const colorScale = useMemo(() => {
    return d3.scaleLinear<string>()
      .domain([0, 20, 40])
      .range([
        '#10B981',  // Green-500 (저위험 - 안전)
        '#6B7280',  // Gray-500 (중위험 - 중립)
        '#1E40AF',  // Blue-800 (고위험 - 진한 블루)
      ]);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('.chart-content').remove();

    const g = svg.append('g')
      .attr('class', 'chart-content')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .style('stroke', '#E5E7EB')
      .style('stroke-dasharray', '3,3');

    g.select('.grid .domain').remove();

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '13px')
      .style('fill', '#374151')
      .style('font-weight', '500');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6B7280');

    // Bars with gradient
    const defs = svg.append('defs');

    data.forEach((d, i) => {
      const gradientId = `bar-gradient-${i}`;
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.rgb(colorScale(d.cancerRisk)).darker(0.3).toString());

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(d.cancerRisk));
    });

    // Animated bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.sizeLabel) ?? 0)
      .attr('width', xScale.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', (_, i) => `url(#bar-gradient-${i})`)
      .attr('rx', 6)
      .transition()
      .duration(800)
      .delay((_, i) => i * 150)
      .ease(d3.easeCubicOut)
      .attr('y', d => {
        const progress = Math.min(1, (currentStep - 5) / 2);
        if (progress <= 0) return innerHeight;
        return yScale(d.cancerRisk * progress);
      })
      .attr('height', d => {
        const progress = Math.min(1, (currentStep - 5) / 2);
        if (progress <= 0) return 0;
        return innerHeight - yScale(d.cancerRisk * progress);
      });

    // Value labels on top of bars
    g.selectAll('.value-label')
      .data(data)
      .join('text')
      .attr('class', 'value-label')
      .attr('x', d => (xScale(d.sizeLabel) ?? 0) + xScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#111827')
      .transition()
      .duration(800)
      .delay((_, i) => i * 150)
      .attr('y', d => {
        const progress = Math.min(1, (currentStep - 5) / 2);
        if (progress <= 0) return innerHeight - 10;
        return yScale(d.cancerRisk * progress) - 10;
      })
      .tween('text', function(d) {
        const progress = Math.min(1, (currentStep - 5) / 2);
        if (progress <= 0) return () => {};
        const targetValue = d.cancerRisk * progress;
        const i = d3.interpolateNumber(0, targetValue);
        return function(t) {
          d3.select(this).text(`${Math.round(i(t))}%`);
        };
      });

    // Title
    svg.selectAll('.chart-title').remove();
    svg.append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#111827')
      .text('용종 크기별 암 발생 위험');

    // X axis label
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6B7280')
      .text('용종 크기');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6B7280')
      .text('암 발생률 (%)');

    // Warning annotation for 2cm+
    if (currentStep >= 6) {
      const warningX = (xScale('2cm 이상') ?? 0) + xScale.bandwidth() / 2;
      const warningY = yScale(40) - 40;

      g.append('text')
        .attr('x', warningX)
        .attr('y', warningY)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#1E40AF')  // Blue-800 (고위험)
        .style('font-weight', '600')
        .text('40배 위험 증가!')
        .style('opacity', 0)
        .transition()
        .duration(500)
        .delay(1000)
        .style('opacity', 1);
    }

  }, [data, currentStep, xScale, yScale, colorScale, innerWidth, innerHeight, margin, width]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '55vh' }}
      />
    </motion.div>
  );
}
