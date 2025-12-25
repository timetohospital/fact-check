'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

interface ComparisonData {
  category: string;
  gen1: string;
  gen2: string;
  gen3: string;
}

interface GenerationCompareChartProps {
  data: ComparisonData[];
  currentStep: number;
  focusCategory?: string | null;
  showGenerations?: number[];
  width?: number;
  height?: number;
}

const GENERATION_COLORS = {
  1: '#6B7280', // Gray - 화학항암제
  2: '#3B82F6', // Blue - 표적치료제
  3: '#10B981', // Green - 면역항암제
};

const GENERATION_NAMES = {
  1: '1세대 (화학항암제)',
  2: '2세대 (표적치료제)',
  3: '3세대 (면역항암제)',
};

export default function GenerationCompareChart({
  data,
  currentStep,
  focusCategory = null,
  showGenerations = [1, 2, 3],
  width = 800,
  height = 450,
}: GenerationCompareChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 스텝에 따라 표시할 세대 결정
  const visibleGenerations = useMemo(() => {
    if (currentStep <= 3) return [1];
    if (currentStep <= 7) return [1, 2];
    return showGenerations;
  }, [currentStep, showGenerations]);

  // 애니메이션 변형 설정
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const rowVariants: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }
    }
  };

  const cellVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }
    }
  };

  return (
    <div ref={containerRef} className="w-full px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* 제목 */}
        <motion.h3
          className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          항암제 세대별 특성 비교
        </motion.h3>

        {/* 비교 테이블 - 스크롤 래퍼 */}
        <div className="overflow-x-auto">
          <motion.div
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm min-w-[700px]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* 헤더 */}
            <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200">
              <div className="p-4 md:p-5 lg:p-6 font-semibold text-gray-700 text-sm md:text-base">비교 항목</div>
              {[1, 2, 3].map(gen => (
                <motion.div
                  key={gen}
                  className={`p-4 md:p-5 lg:p-6 font-semibold text-sm md:text-base text-center transition-all duration-300 ${
                    visibleGenerations.includes(gen) ? 'opacity-100' : 'opacity-20'
                  }`}
                  style={{ color: GENERATION_COLORS[gen as keyof typeof GENERATION_COLORS] }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{
                    opacity: visibleGenerations.includes(gen) ? 1 : 0.2,
                    y: 0
                  }}
                  transition={{ delay: gen * 0.1, duration: 0.4 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: GENERATION_COLORS[gen as keyof typeof GENERATION_COLORS] }}
                    />
                    {gen}세대
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 데이터 행 */}
            <AnimatePresence>
              {data.map((row, index) => {
                const isFocused = focusCategory === null || focusCategory === row.category;

                return (
                  <motion.div
                    key={row.category}
                    className={`grid grid-cols-4 border-b border-gray-100 last:border-b-0 transition-all duration-300 ${
                      isFocused ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.08 }}
                  >
                    {/* 카테고리 */}
                    <div
                      className={`p-4 md:p-5 lg:p-6 font-medium text-sm md:text-base border-r border-gray-100 transition-all duration-300 ${
                        isFocused ? 'text-gray-900 bg-gray-50' : 'text-gray-400'
                      }`}
                    >
                      {row.category}
                    </div>

                    {/* 세대별 값 */}
                    {[
                      { gen: 1, value: row.gen1 },
                      { gen: 2, value: row.gen2 },
                      { gen: 3, value: row.gen3 },
                    ].map(({ gen, value }) => {
                      const isVisible = visibleGenerations.includes(gen);
                      const isHighlighted = isFocused && isVisible;

                      return (
                        <motion.div
                          key={gen}
                          className={`p-4 md:p-5 lg:p-6 text-sm md:text-base text-center transition-all duration-500 ${
                            isHighlighted ? 'bg-white' : 'bg-gray-50/30'
                          }`}
                          variants={cellVariants}
                          animate={{
                            opacity: isVisible ? (isFocused ? 1 : 0.7) : 0.15,
                            scale: isHighlighted ? 1 : 0.98,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <motion.span
                            className={`inline-block transition-all duration-300 ${
                              isHighlighted ? 'font-medium' : 'font-normal'
                            }`}
                            style={{
                              color: isHighlighted
                                ? GENERATION_COLORS[gen as keyof typeof GENERATION_COLORS]
                                : '#9CA3AF'
                            }}
                            animate={{
                              scale: isHighlighted ? [1, 1.05, 1] : 1,
                            }}
                            transition={{
                              duration: 0.6,
                              delay: index * 0.05,
                            }}
                          >
                            {value}
                          </motion.span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* 범례 */}
        <motion.div
          className="flex justify-center gap-3 md:gap-6 mt-4 md:mt-6 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {visibleGenerations.map(gen => (
            <div key={gen} className="flex items-center gap-1.5 md:gap-2">
              <div
                className="w-3 h-3 md:w-4 md:h-4 rounded-full shadow-sm"
                style={{ backgroundColor: GENERATION_COLORS[gen as keyof typeof GENERATION_COLORS] }}
              />
              <span className="text-xs md:text-sm text-gray-600">
                {GENERATION_NAMES[gen as keyof typeof GENERATION_NAMES]}
              </span>
            </div>
          ))}
        </motion.div>

        {/* 진행 표시 바 */}
        <motion.div
          className="mt-6 h-1 bg-gray-100 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${GENERATION_COLORS[1]}, ${GENERATION_COLORS[2]}, ${GENERATION_COLORS[3]})`,
            }}
            initial={{ width: '0%' }}
            animate={{
              width: visibleGenerations.length === 1
                ? '33%'
                : visibleGenerations.length === 2
                ? '66%'
                : '100%'
            }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
        </motion.div>
      </div>
    </div>
  );
}
