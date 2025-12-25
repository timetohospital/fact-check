'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

interface TimelineData {
  period: string;
  periodLabel: string;
  year: number;
  all: number;
  milestone: string;
  description: string;
}

interface SurvivalLineChartProps {
  data: TimelineData[];
  currentStep: number;
  width?: number;
  height?: number;
}

export default function SurvivalLineChart({
  data,
  currentStep,
  width = 600,
  height = 400,
}: SurvivalLineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Visible data based on current step
  const visibleData = useMemo(() => {
    if (currentStep <= 0) return [];
    return data.slice(0, Math.min(currentStep, data.length));
  }, [data, currentStep]);

  // Scales
  const xScale = useMemo(() => {
    return d3.scalePoint<string>()
      .domain(data.map(d => d.periodLabel))
      .range([0, innerWidth])
      .padding(0.5);
  }, [data, innerWidth]);

  const yScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);
  }, [innerHeight]);

  // Line generator
  const lineGenerator = useMemo(() => {
    return d3.line<TimelineData>()
      .x(d => xScale(d.periodLabel) ?? 0)
      .y(d => yScale(d.all))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll('.chart-content').remove();

    const g = svg.append('g')
      .attr('class', 'chart-content')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Axis
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6B7280');

    // Y Axis
    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6B7280');

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

    // Y Axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#374151')
      .text('5년 상대생존율 (%)');

    // Line path
    if (visibleData.length > 0) {
      const path = g.append('path')
        .datum(visibleData)
        .attr('fill', 'none')
        .attr('stroke', '#3B82F6')
        .attr('stroke-width', 3)
        .attr('d', lineGenerator);

      // Animate line drawing
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(500)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);

      // Data points
      g.selectAll('.data-point')
        .data(visibleData)
        .join('circle')
        .attr('class', 'data-point')
        .attr('cx', d => xScale(d.periodLabel) ?? 0)
        .attr('cy', d => yScale(d.all))
        .attr('r', 0)
        .attr('fill', '#3B82F6')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .transition()
        .delay((_, i) => i * 100)
        .duration(300)
        .attr('r', 6);

      // Labels for current point
      if (visibleData.length > 0) {
        const lastPoint = visibleData[visibleData.length - 1];
        g.append('text')
          .attr('class', 'value-label')
          .attr('x', xScale(lastPoint.periodLabel) ?? 0)
          .attr('y', yScale(lastPoint.all) - 15)
          .attr('text-anchor', 'middle')
          .style('font-size', '16px')
          .style('font-weight', 'bold')
          .style('fill', '#3B82F6')
          .text(`${lastPoint.all}%`)
          .style('opacity', 0)
          .transition()
          .delay(visibleData.length * 100)
          .duration(300)
          .style('opacity', 1);
      }
    }

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#111827')
      .text('한국 암환자 5년 상대생존율 변화');

  }, [visibleData, xScale, yScale, lineGenerator, innerWidth, innerHeight, margin, width]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      style={{ maxHeight: '70vh' }}
    />
  );
}
