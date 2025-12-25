'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

interface CancerData {
  period: string;
  rate: number;
}

interface CancerType {
  name: string;
  nameEn: string;
  color: string;
  data: CancerData[];
}

interface ComparisonChartProps {
  cancerTypes: Record<string, CancerType>;
  selected: string[];
  width?: number;
  height?: number;
  onHover?: (key: string | null, data?: CancerData) => void;
}

export default function ComparisonChart({
  cancerTypes,
  selected,
  width = 700,
  height = 450,
  onHover,
}: ComparisonChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const margin = { top: 40, right: 120, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Get all periods
  const periods = useMemo(() => {
    const firstType = Object.values(cancerTypes)[0];
    return firstType?.data.map(d => d.period) || [];
  }, [cancerTypes]);

  // Scales
  const xScale = useMemo(() => {
    return d3.scalePoint<string>()
      .domain(periods)
      .range([0, innerWidth])
      .padding(0.5);
  }, [periods, innerWidth]);

  const yScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 110])
      .range([innerHeight, 0]);
  }, [innerHeight]);

  // Line generator
  const lineGenerator = useMemo(() => {
    return d3.line<CancerData>()
      .x(d => xScale(d.period) ?? 0)
      .y(d => yScale(d.rate))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('.chart-content').remove();

    const g = svg.append('g')
      .attr('class', 'chart-content')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#6B7280');

    // Y Axis
    g.append('g')
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

    // Draw lines for each cancer type
    const showAll = selected.length === 0;

    Object.entries(cancerTypes).forEach(([key, type]) => {
      const isSelected = showAll || selected.includes(key);
      const opacity = isSelected ? 1 : 0.15;

      // Line
      g.append('path')
        .datum(type.data)
        .attr('fill', 'none')
        .attr('stroke', type.color)
        .attr('stroke-width', isSelected ? 3 : 1.5)
        .attr('stroke-opacity', opacity)
        .attr('d', lineGenerator)
        .style('cursor', 'pointer')
        .on('mouseenter', () => {
          if (onHover) onHover(key);
        })
        .on('mouseleave', () => {
          if (onHover) onHover(null);
        });

      // Data points
      g.selectAll(`.point-${key}`)
        .data(type.data)
        .join('circle')
        .attr('class', `point-${key}`)
        .attr('cx', d => xScale(d.period) ?? 0)
        .attr('cy', d => yScale(d.rate))
        .attr('r', isSelected ? 5 : 3)
        .attr('fill', type.color)
        .attr('fill-opacity', opacity)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          if (onHover) onHover(key, d);
        })
        .on('mouseleave', () => {
          if (onHover) onHover(null);
        });

      // Legend label at end of line
      if (isSelected) {
        const lastPoint = type.data[type.data.length - 1];
        g.append('text')
          .attr('x', (xScale(lastPoint.period) ?? 0) + 10)
          .attr('y', yScale(lastPoint.rate) + 4)
          .style('font-size', '12px')
          .style('font-weight', '500')
          .style('fill', type.color)
          .text(`${type.name} ${lastPoint.rate}%`);
      }
    });

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#111827')
      .text('암 종류별 5년 생존율 변화');

  }, [cancerTypes, selected, xScale, yScale, lineGenerator, innerWidth, innerHeight, margin, width, onHover]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      style={{ maxHeight: '60vh' }}
    />
  );
}
