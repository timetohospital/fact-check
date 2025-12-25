'use client';

import { motion } from 'framer-motion';

interface PolypClassificationTreeProps {
  currentStep: number;
}

// 절제된 3색 팔레트 (anticancer-generations 기반)
// Blue 계열로 위험도 표현, Green은 안전
export default function PolypClassificationTree({ currentStep }: PolypClassificationTreeProps) {
  const showNeoplastic = currentStep >= 3;
  const showNonNeoplastic = currentStep >= 3;

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h3 className="text-xl font-bold text-center text-gray-900 mb-8">
        대장 용종의 분류
      </h3>

      {/* Root */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center mb-4"
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg">
          <span className="text-lg font-bold">대장 용종</span>
        </div>
      </motion.div>

      {/* Connection line */}
      <div className="flex justify-center mb-4">
        <div className="w-px h-8 bg-gray-300" />
      </div>

      {/* Branches */}
      <div className="flex justify-center gap-4 md:gap-16">
        {/* Left branch - Neoplastic (Blue 계열) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: showNeoplastic ? 1 : 0.3, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 max-w-xs"
        >
          <div className="flex flex-col items-center">
            <div className="w-px h-8 bg-gray-300" />
            <div className="bg-blue-100 border-2 border-blue-400 px-4 py-3 rounded-lg mb-4 w-full">
              <p className="text-blue-700 font-bold text-center text-sm md:text-base">종양성 용종</p>
              <p className="text-blue-600 text-xs text-center mt-1">암 가능성 있음</p>
            </div>

            {/* Subtypes - Gray → Blue 그라데이션 */}
            <div className="space-y-2 w-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: currentStep >= 4 ? 1 : 0.5 }}
                className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg"
              >
                <p className="text-gray-700 font-semibold text-sm">관상 선종 (80%)</p>
                <p className="text-gray-500 text-xs">10년 암 발생률 2.7%</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: currentStep >= 4 ? 1 : 0.5 }}
                className="bg-slate-100 border border-slate-300 px-3 py-2 rounded-lg"
              >
                <p className="text-slate-700 font-semibold text-sm">관융모 선종 (15%)</p>
                <p className="text-slate-500 text-xs">10년 암 발생률 5.1%</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: currentStep >= 5 ? 1 : 0.5 }}
                className="bg-blue-100 border border-blue-300 px-3 py-2 rounded-lg"
              >
                <p className="text-blue-800 font-semibold text-sm">융모 선종 (5%)</p>
                <p className="text-blue-600 text-xs">10년 암 발생률 8.6%</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-200 text-blue-700 text-xs rounded-full">
                  가장 위험
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: currentStep >= 7 ? 1 : 0.5 }}
                className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg"
              >
                <p className="text-blue-700 font-semibold text-sm">톱니모양 병변</p>
                <p className="text-blue-500 text-xs">빠른 암 진행 가능</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                  주의 필요
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Right branch - Non-neoplastic (Green 계열) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: showNonNeoplastic ? 1 : 0.3, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex-1 max-w-xs"
        >
          <div className="flex flex-col items-center">
            <div className="w-px h-8 bg-gray-300" />
            <div className="bg-green-100 border-2 border-green-400 px-4 py-3 rounded-lg mb-4 w-full">
              <p className="text-green-700 font-bold text-center text-sm md:text-base">비종양성 용종</p>
              <p className="text-green-600 text-xs text-center mt-1">암 가능성 없음</p>
            </div>

            {/* Subtypes */}
            <div className="space-y-2 w-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: currentStep >= 3 ? 1 : 0.5 }}
                className="bg-green-50 border border-green-200 px-3 py-2 rounded-lg"
              >
                <p className="text-green-800 font-semibold text-sm">과형성 용종</p>
                <p className="text-green-600 text-xs">암 위험 거의 0%</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-green-200 text-green-700 text-xs rounded-full">
                  제거 불필요
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: currentStep >= 3 ? 1 : 0.5 }}
                className="bg-green-50 border border-green-200 px-3 py-2 rounded-lg"
              >
                <p className="text-green-800 font-semibold text-sm">염증성 용종</p>
                <p className="text-green-600 text-xs">암 위험 0%</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: currentStep >= 3 ? 1 : 0.5 }}
                className="bg-green-50 border border-green-200 px-3 py-2 rounded-lg"
              >
                <p className="text-green-800 font-semibold text-sm">과오종</p>
                <p className="text-green-600 text-xs">암 위험 0%</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: currentStep >= 3 ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 p-4 bg-gray-50 rounded-lg"
      >
        <p className="text-sm text-gray-600 text-center">
          <strong className="text-blue-600">종양성 용종</strong>만 암으로 발전할 가능성이 있습니다.
          <br />
          <span className="text-green-600 font-medium">비종양성 용종</span>은 암으로 발전하지 않으므로 제거할 필요가 없습니다.
        </p>
      </motion.div>
    </div>
  );
}
