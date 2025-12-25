'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface TimelineData {
  years: number;
  cumulativeRisk: number;
}

interface TimelineRiskChartProps {
  data: TimelineData[];
  currentStep: number;
  width?: number;
  height?: number;
}

export default function TimelineRiskChart({
  data,
  currentStep,
  width = 600,
  height = 400,
}: TimelineRiskChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const margin = { top: 60, right: 60, bottom: 80, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 25])
      .range([0, innerWidth]);
  }, [innerWidth]);

  const yScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 45])
      .range([innerHeight, 0]);
  }, [innerHeight]);

  const lineGenerator = useMemo(() => {
    return d3.line<TimelineData>()
      .x(d => xScale(d.years))
      .y(d => yScale(d.cumulativeRisk))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  const areaGenerator = useMemo(() => {
    return d3.area<TimelineData>()
      .x(d => xScale(d.years))
      .y0(innerHeight)
      .y1(d => yScale(d.cumulativeRisk))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale, innerHeight]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('.chart-content').remove();

    const g = svg.append('g')
      .attr('class', 'chart-content')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradient for area
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    // Design System: 절제된 Blue-800 (고위험)
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#1E40AF')  // Blue-800 (고위험)
      .attr('stop-opacity', 0.4);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1E40AF')  // Blue-800
      .attr('stop-opacity', 0.05);

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
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}년`))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6B7280');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6B7280');

    // Add origin point for complete line
    const fullData: TimelineData[] = [{ years: 0, cumulativeRisk: 0 }, ...data];

    // Animated progress
    const progress = Math.min(1, Math.max(0, (currentStep - 7) / 2));

    // Area
    const clipPath = defs.append('clipPath')
      .attr('id', 'area-clip');

    clipPath.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 0)
      .attr('height', innerHeight)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr('width', innerWidth * progress);

    g.append('path')
      .datum(fullData)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', areaGenerator)
      .attr('clip-path', 'url(#area-clip)');

    // Line - Design System: 절제된 Blue-800
    const path = g.append('path')
      .datum(fullData)
      .attr('fill', 'none')
      .attr('stroke', '#1E40AF')  // Blue-800 (고위험)
      .attr('stroke-width', 4)
      .attr('d', lineGenerator);

    // Animate line drawing
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', totalLength * (1 - progress));

    // Data points - Design System: 절제된 Blue-800
    g.selectAll('.point')
      .data(data)
      .join('circle')
      .attr('class', 'point')
      .attr('cx', d => xScale(d.years))
      .attr('cy', d => yScale(d.cumulativeRisk))
      .attr('r', 0)
      .attr('fill', '#1E40AF')  // Blue-800 (고위험)
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .transition()
      .duration(500)
      .delay((d) => {
        const pointProgress = d.years / 20;
        return pointProgress <= progress ? 1500 * pointProgress : 0;
      })
      .attr('r', (d) => {
        const pointProgress = d.years / 20;
        return pointProgress <= progress ? 8 : 0;
      });

    // Labels for each point
    g.selectAll('.point-label')
      .data(data)
      .join('text')
      .attr('class', 'point-label')
      .attr('x', d => xScale(d.years))
      .attr('y', d => yScale(d.cumulativeRisk) - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#1E40AF')  // Blue-800 (고위험)
      .style('opacity', 0)
      .text(d => `${d.cumulativeRisk}%`)
      .transition()
      .duration(500)
      .delay((d) => {
        const pointProgress = d.years / 20;
        return pointProgress <= progress ? 1500 * pointProgress + 200 : 0;
      })
      .style('opacity', (d) => {
        const pointProgress = d.years / 20;
        return pointProgress <= progress ? 1 : 0;
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
      .text('1cm 이상 용종의 시간별 암 발생 위험');

    // X axis label
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 50)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6B7280')
      .text('방치 기간');

    // Warning message
    if (progress >= 0.8) {
      g.append('text')
        .attr('x', xScale(20))
        .attr('y', yScale(37) + 40)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('fill', '#1E40AF')  // Blue-800 (고위험)
        .style('font-weight', '600')
        .text('20년 방치 시 3명 중 1명 이상 암 발생')
        .style('opacity', 0)
        .transition()
        .duration(500)
        .delay(1700)
        .style('opacity', 1);
    }

  }, [data, currentStep, xScale, yScale, lineGenerator, areaGenerator, innerWidth, innerHeight, margin, width]);

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
