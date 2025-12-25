'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface PolypData {
  type: string;
  value: number;
  color: string;
}

interface PolypRiskChartProps {
  data: PolypData[];
  currentStep: number;
  highlightType?: string;
  title?: string;
  width?: number;
  height?: number;
}

export default function PolypRiskChart({
  data,
  currentStep,
  highlightType,
  title = '용종 종류별 10년 암 발생률 (%)',
  width = 600,
  height = 400,
}: PolypRiskChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const margin = { top: 60, right: 30, bottom: 80, left: 180 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value);
  }, [data]);

  const yScale = useMemo(() => {
    return d3.scaleBand()
      .domain(sortedData.map(d => d.type))
      .range([0, innerHeight])
      .padding(0.3);
  }, [sortedData, innerHeight]);

  const xScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 10])
      .range([0, innerWidth]);
  }, [innerWidth]);

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
        d3.axisBottom(xScale)
          .ticks(5)
          .tickSize(innerHeight)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .style('stroke', '#E5E7EB')
      .style('stroke-dasharray', '3,3');

    g.select('.grid .domain').remove();

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6B7280');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '13px')
      .style('fill', '#374151')
      .style('font-weight', '500');

    g.select('.domain').style('stroke', '#E5E7EB');

    // Bars
    g.selectAll('.bar')
      .data(sortedData)
      .join('rect')
      .attr('class', 'bar')
      .attr('y', d => yScale(d.type) ?? 0)
      .attr('height', yScale.bandwidth())
      .attr('x', 0)
      .attr('fill', d => d.color)
      .attr('opacity', d => {
        if (!highlightType) return 0.85;
        return d.type.includes(highlightType) ? 1 : 0.3;
      })
      .attr('rx', 4)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('width', d => {
        const progressByStep = Math.min(1, (currentStep + 1) / 4);
        return xScale(d.value * progressByStep);
      });

    // Value labels
    g.selectAll('.value-label')
      .data(sortedData)
      .join('text')
      .attr('class', 'value-label')
      .attr('y', d => (yScale(d.type) ?? 0) + yScale.bandwidth() / 2 + 5)
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#111827')
      .transition()
      .duration(800)
      .attr('x', d => {
        const progressByStep = Math.min(1, (currentStep + 1) / 4);
        return xScale(d.value * progressByStep) + 8;
      })
      .tween('text', function(d) {
        const progressByStep = Math.min(1, (currentStep + 1) / 4);
        const targetValue = d.value * progressByStep;
        const i = d3.interpolateNumber(0, targetValue);
        return function(t) {
          d3.select(this).text(`${i(t).toFixed(1)}%`);
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
      .text(title);

    // X axis label
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6B7280')
      .text('10년 내 대장암 발생률');

  }, [sortedData, currentStep, highlightType, xScale, yScale, innerWidth, innerHeight, margin, width, title]);

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
