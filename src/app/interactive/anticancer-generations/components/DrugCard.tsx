'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

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
  color: string;
  mechanism: string;
  sideEffects: string;
  survivalImpact: string;
  keyDrugs: Drug[];
  limitations: string;
}

interface DrugCardProps {
  drug: Drug;
  generation: Generation;
  isHighlighted?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  delay?: number;
}

export function DrugCard({
  drug,
  generation,
  isHighlighted = false,
  isExpanded = false,
  onToggle,
  delay = 0,
}: DrugCardProps) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer ${
        isHighlighted
          ? 'shadow-lg scale-105'
          : 'shadow-sm hover:shadow-md'
      }`}
      style={{
        borderColor: isHighlighted ? generation.color : '#E5E7EB',
        backgroundColor: isHighlighted ? `${generation.color}08` : '#FFFFFF',
      }}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: isHighlighted ? 1.02 : 1 }}
      transition={{
        delay,
        duration: 0.5,
        type: 'spring',
        stiffness: 100,
      }}
      onClick={onToggle}
      whileHover={{ scale: isHighlighted ? 1.02 : 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 마일스톤 배지 */}
      {drug.milestone && (
        <motion.div
          className="absolute top-2 right-2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3, type: 'spring' }}
        >
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: generation.color }}
          >
            ★ 마일스톤
          </span>
        </motion.div>
      )}

      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-start gap-3">
          {/* 세대 표시 */}
          <motion.div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: generation.color }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
          >
            {generation.generation}세대
          </motion.div>

          {/* 약물 정보 */}
          <div className="flex-1 min-w-0">
            <motion.h3
              className="font-bold text-lg text-gray-900 truncate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 }}
            >
              {drug.name}
            </motion.h3>
            <motion.p
              className="text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.15 }}
            >
              {drug.nameEn}
            </motion.p>
          </div>

          {/* 연도 배지 */}
          <motion.div
            className="flex-shrink-0 px-3 py-1 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.25 }}
          >
            {drug.approvalYear}년
          </motion.div>
        </div>

        {/* 타입 */}
        <motion.div
          className="mt-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.3 }}
        >
          <span
            className="inline-block px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: `${generation.color}15`,
              color: generation.color,
            }}
          >
            {drug.type}
          </span>
        </motion.div>

        {/* 확장된 정보 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="mt-5 pt-5 border-t border-gray-100 space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {drug.milestone && (
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500">★</span>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">마일스톤</div>
                    <div className="text-sm text-gray-700">{drug.milestone}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <span className="text-blue-500">⚙</span>
                <div>
                  <div className="text-xs text-gray-500 font-medium">작용 기전</div>
                  <div className="text-sm text-gray-700">{generation.mechanism}</div>
                </div>
              </div>

              {drug.note && (
                <div className="flex items-start gap-2">
                  <span className="text-green-500">📝</span>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">참고</div>
                    <div className="text-sm text-gray-700">{drug.note}</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단 진행 바 */}
      <motion.div
        className="h-1"
        style={{ backgroundColor: `${generation.color}20` }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.4, duration: 0.5 }}
      >
        <motion.div
          className="h-full"
          style={{ backgroundColor: generation.color }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHighlighted ? 1 : 0.6 }}
          transition={{ delay: delay + 0.5, duration: 0.4 }}
        />
      </motion.div>
    </motion.div>
  );
}

// 드러그 카드 그리드 컴포넌트
interface DrugCardGridProps {
  generations: Generation[];
  currentStep: number;
  focusDrug?: string | null;
  focusGeneration?: number | null;
}

export default function DrugCardGrid({
  generations,
  currentStep,
  focusDrug = null,
  focusGeneration = null,
}: DrugCardGridProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // 현재 스텝에 따라 표시할 약물
  const visibleDrugs = generations.flatMap(gen => {
    // 스텝에 따라 세대 필터링
    if (currentStep <= 3 && gen.generation > 1) return [];
    if (currentStep <= 7 && gen.generation > 2) return [];

    return gen.keyDrugs.map(drug => ({
      drug,
      generation: gen,
    }));
  });

  return (
    <div className="px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* 제목 */}
        <motion.h3
          className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          주요 항암제
        </motion.h3>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          <AnimatePresence mode="popLayout">
            {visibleDrugs.map(({ drug, generation }, index) => {
              const isHighlighted =
                focusDrug === drug.name ||
                focusDrug === drug.nameEn ||
                (focusGeneration !== null && generation.generation === focusGeneration);

              return (
                <DrugCard
                  key={drug.nameEn}
                  drug={drug}
                  generation={generation}
                  isHighlighted={isHighlighted}
                  isExpanded={expandedCard === drug.nameEn}
                  onToggle={() =>
                    setExpandedCard(expandedCard === drug.nameEn ? null : drug.nameEn)
                  }
                  delay={index * 0.1}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* 빈 상태 */}
        {visibleDrugs.length === 0 && (
          <motion.div
            className="text-center py-12 text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            스크롤하여 항암제 정보를 확인하세요
          </motion.div>
        )}

        {/* 세대별 범례 */}
        <motion.div
          className="flex justify-center gap-3 md:gap-6 mt-6 md:mt-8 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {generations
            .filter(gen => {
              if (currentStep <= 3) return gen.generation === 1;
              if (currentStep <= 7) return gen.generation <= 2;
              return true;
            })
            .map(gen => (
              <div
                key={gen.generation}
                className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                style={{ opacity: focusGeneration === null || focusGeneration === gen.generation ? 1 : 0.3 }}
              >
                <div
                  className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
                  style={{ backgroundColor: gen.color }}
                />
                <span className="text-gray-600">{gen.name}</span>
              </div>
            ))}
        </motion.div>
      </div>
    </div>
  );
}
