'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Scale, AlertTriangle, Clock, Calendar, ChevronDown, ExternalLink } from 'lucide-react';
import ScrollyContainer from '@/components/interactive/ScrollyContainer';
import StickyChart from '@/components/interactive/StickyChart';
import ScrollStep from '@/components/interactive/ScrollStep';
import AnimatedNumber from '@/components/interactive/AnimatedNumber';
import PolypRiskChart from './components/PolypRiskChart';
import SizeRiskChart from './components/SizeRiskChart';
import TimelineRiskChart from './components/TimelineRiskChart';
import PolypClassificationTree from './components/PolypClassificationTree';

// Design System Colors - 절제된 3색 팔레트 (anticancer-generations 기반)
// Gray → Blue → Green 그라데이션으로 위험도 표현
const COLORS = {
  // 3-Color Palette (절제된 톤)
  safe: '#10B981',         // Green-500 - 안전/저위험
  neutral: '#6B7280',      // Gray-500 - 중립/보통
  caution: '#3B82F6',      // Blue-500 - 주의/중위험 (신뢰감 있는 톤)
  warning: '#1E40AF',      // Blue-800 - 경고/고위험 (진한 블루)

  // Primary (informational)
  primary: '#3B82F6',      // Blue-500
  primaryDark: '#2563EB',  // Blue-600
};

// Data - 절제된 Blue-Gray-Green 그라데이션
// 위험도가 높을수록 Blue 계열로 강조 (빨강 대신)
const polypRiskData = [
  { type: '대조군 (용종 없음)', value: 2.1, color: '#10B981' },  // Green-500 (가장 안전)
  { type: '과형성 용종', value: 1.6, color: '#34D399' },        // Green-400 (안전)
  { type: '무경성 톱니모양 병변', value: 2.5, color: '#6B7280' }, // Gray-500 (중립)
  { type: '관상 선종', value: 2.7, color: '#64748B' },          // Slate-500 (약간 주의)
  { type: '관융모 선종', value: 5.1, color: '#3B82F6' },        // Blue-500 (주의)
  { type: '융모 선종', value: 8.6, color: '#1E40AF' },          // Blue-800 (고위험)
];

const sizeRiskData = [
  { sizeLabel: '1cm 미만', cancerRisk: 1 },
  { sizeLabel: '1-2cm', cancerRisk: 10 },
  { sizeLabel: '2cm 이상', cancerRisk: 40 },
];

const timelineRiskData = [
  { years: 5, cumulativeRisk: 4 },
  { years: 10, cumulativeRisk: 14 },
  { years: 20, cumulativeRisk: 37 },
];

const insights = [
  {
    id: 1,
    title: '모든 선종이 암이 되는 건 아닙니다',
    content: '선종의 약 5-10%만 실제로 대장암으로 진행합니다.',
    actionable: '과도한 걱정은 불필요합니다.',
    icon: Shield,
    color: 'success',  // Green - positive/safe message
  },
  {
    id: 2,
    title: '용종 유형을 확인하세요',
    content: '융모 선종은 관상 선종보다 3배 이상 위험합니다.',
    actionable: '조직검사 결과를 의사에게 확인하세요.',
    icon: AlertTriangle,
    color: 'warning',  // Amber - caution message
  },
  {
    id: 3,
    title: '크기가 핵심입니다',
    content: '1cm 미만은 저위험, 2cm 이상은 고위험입니다.',
    actionable: '용종 크기에 따른 추적 검사 스케줄을 따르세요.',
    icon: Scale,
    color: 'primary',  // Blue - informational
  },
  {
    id: 4,
    title: '정기 검진을 받으세요',
    content: '10-15년의 예방 시간이 있습니다.',
    actionable: '50세부터 대장내시경을 시작하세요.',
    icon: Calendar,
    color: 'primary',  // Blue - informational (was purple, now unified)
  },
];

const sources = [
  {
    name: '서울대학교병원',
    url: 'https://www.snuh.org/health/nMedInfo/nView.do?category=DIS&medid=AA000303',
  },
  {
    name: '서울아산병원',
    url: 'https://www.amc.seoul.kr/asan/healthinfo/disease/diseaseDetail.do?contentId=31776',
  },
  {
    name: 'Cleveland Clinic',
    url: 'https://my.clevelandclinic.org/health/diseases/15370-colon-polyps',
  },
  {
    name: 'PMC/NCBI Research',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6954345/',
  },
  {
    name: 'American Cancer Society',
    url: 'https://www.cancer.org/cancer/diagnosis-staging/tests/biopsy-and-cytology-tests/understanding-your-pathology-report/colon-pathology/colon-polyps-sessile-or-traditional-serrated-adenomas.html',
  },
];

export default function ColonPolypCancerRiskPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleStepEnter = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, []);

  // Determine which chart to show based on current step
  const renderChart = () => {
    if (currentStep <= 2) {
      // Steps 0-2: Show pie/intro visualization
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="relative w-64 h-64 mx-auto mb-8">
              {/* Donut chart visualization */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="20"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="20"
                  strokeDasharray={`${90 * 2.51} ${100 * 2.51}`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                  initial={{ strokeDasharray: '0 251' }}
                  animate={{ strokeDasharray: `${(currentStep >= 1 ? 90 : 0) * 2.51} 251` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="20"
                  strokeDasharray={`${10 * 2.51} ${100 * 2.51}`}
                  strokeDashoffset={`${-90 * 2.51}`}
                  transform="rotate(-90 50 50)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: currentStep >= 2 ? 1 : 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">
                  {currentStep >= 2 ? '5-10%' : currentStep >= 1 ? '30%' : '—'}
                </span>
                <span className="text-sm text-gray-600">
                  {currentStep >= 2 ? '암 진행률' : currentStep >= 1 ? '50세 선종 발견율' : ''}
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-lg">
              {currentStep >= 2
                ? '대부분의 선종은 암으로 발전하지 않습니다'
                : currentStep >= 1
                ? '50세 이상 성인의 30%에서 발견'
                : '대장 용종의 진실'}
            </p>
          </motion.div>
        </div>
      );
    }

    if (currentStep === 3) {
      return <PolypClassificationTree currentStep={currentStep} />;
    }

    if (currentStep >= 4 && currentStep <= 5) {
      const highlightType = currentStep === 5 ? '융모' : currentStep === 4 ? '관상' : undefined;
      return (
        <PolypRiskChart
          data={polypRiskData}
          currentStep={currentStep}
          highlightType={highlightType}
        />
      );
    }

    if (currentStep === 6) {
      return <SizeRiskChart data={sizeRiskData} currentStep={currentStep} />;
    }

    if (currentStep === 7) {
      // Serrated warning
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 0 0 rgba(251, 191, 36, 0)',
                  '0 0 0 20px rgba(251, 191, 36, 0.2)',
                  '0 0 0 0 rgba(251, 191, 36, 0)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 mx-auto mb-8 bg-amber-100 rounded-full flex items-center justify-center"
            >
              <Clock className="w-16 h-16 text-amber-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              톱니모양 병변 주의
            </h3>
            <p className="text-gray-600 mb-6">
              작은 크기에서도 빠르게 암으로 진행할 수 있습니다.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 font-semibold">
                최단 <span className="text-2xl">13개월</span> 만에 암 전환 사례 보고
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    if (currentStep === 8) {
      return <TimelineRiskChart data={timelineRiskData} currentStep={currentStep} />;
    }

    // Steps 9-10: Prevention message
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="w-32 h-32 mx-auto mb-8 bg-green-100 rounded-full flex items-center justify-center"
          >
            <Shield className="w-16 h-16 text-green-600" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            정기 검진으로 예방 가능
          </h3>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800">
                <span className="text-3xl font-bold">10-15년</span>
                <br />
                <span className="text-sm">용종이 암으로 진행하는 기간</span>
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800">
                <span className="text-3xl font-bold">90%+</span>
                <br />
                <span className="text-sm">정기 검진으로 예방 가능한 대장암</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Design System semantic color classes
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      // Semantic colors from design system
      success: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      warning: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
      primary: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      danger: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
      muted: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
    };
    return colors[color] || colors.primary;
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section - Dark Medical Abstract Background */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
          {/* Animated Blob 1 - Top Right */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          {/* Animated Blob 2 - Bottom Left */}
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          {/* Animated Blob 3 - Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-800/10 rounded-full blur-3xl" />
          {/* Hexagonal Grid Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15L30 0z' fill='none' stroke='%233B82F6' stroke-width='1'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            대장 용종 종류별<br />
            <span className="text-blue-400">대장암으로의 발전 가능성</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12">
            모든 용종이 암이 되는 건 아닙니다.<br />
            하지만 어떤 용종은 주의가 필요합니다.
          </p>

          {/* Hero stats - Glassmorphism */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/20 shadow-lg">
              <AnimatedNumber
                value={5}
                suffix="-10%"
                decimals={0}
                className="text-2xl md:text-4xl font-bold text-green-400"
              />
              <p className="text-sm md:text-base text-gray-300 mt-2">선종 → 암 진행률</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/20 shadow-lg">
              <AnimatedNumber
                value={40}
                suffix="%"
                decimals={0}
                className="text-2xl md:text-4xl font-bold text-red-400"
              />
              <p className="text-sm md:text-base text-gray-300 mt-2">2cm+ 용종 암 위험</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/20 shadow-lg">
              <AnimatedNumber
                value={8.6}
                suffix="%"
                decimals={1}
                className="text-2xl md:text-4xl font-bold text-amber-400"
              />
              <p className="text-sm md:text-base text-gray-300 mt-2">융모선종 10년 암 발생률</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/20 shadow-lg">
              <span className="text-2xl md:text-4xl font-bold text-blue-400">10-15년</span>
              <p className="text-sm md:text-base text-gray-300 mt-2">예방 가능 시간</p>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center text-gray-400"
          >
            <p className="text-sm mb-2">스크롤하여 자세히 알아보기</p>
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* Scrollytelling Section */}
      <ScrollyContainer onStepEnter={handleStepEnter} offset={0.5}>
        <div className="flex flex-col lg:flex-row">
          {/* Text steps - Left side */}
          <div className="lg:w-1/2 lg:pr-8">
            <ScrollStep index={0} isActive={currentStep === 0}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  대장내시경에서 용종이 발견되었습니다
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  50세 이상 성인의 <strong className="text-blue-600">30%</strong>에서 선종이 발견됩니다.
                </p>
                <p className="text-gray-500">
                  70세가 되면 이 비율은 50%까지 올라갑니다. 흔한 일입니다.
                </p>
              </div>
            </ScrollStep>

            <ScrollStep index={1} isActive={currentStep === 1}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  하지만 모든 용종이 암이 되는 건 아닙니다
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  발견된 선종 중 실제로 암으로 진행하는 것은
                  <strong className="text-green-600"> 5-10%</strong>에 불과합니다.
                </p>
                <p className="text-gray-500">
                  대부분은 제거하면 문제없습니다.
                </p>
              </div>
            </ScrollStep>

            <ScrollStep index={2} isActive={currentStep === 2}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                  안심하세요
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  90% 이상은 암이 되지 않습니다
                </h2>
                <p className="text-gray-600 text-lg">
                  하지만 위험한 용종을 구별하는 것이 중요합니다.
                  용종의 <strong>종류</strong>와 <strong>크기</strong>에 따라 위험도가 크게 다릅니다.
                </p>
              </div>
            </ScrollStep>

            <ScrollStep index={3} isActive={currentStep === 3}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  종양성 vs 비종양성
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  용종은 크게 두 가지로 나뉩니다.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                    <span className="text-gray-700">
                      <strong>종양성 용종</strong>: 암 가능성 있음
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span className="text-gray-700">
                      <strong>비종양성 용종</strong>: 암 가능성 없음
                    </span>
                  </div>
                </div>
              </div>
            </ScrollStep>

            <ScrollStep index={4} isActive={currentStep === 4}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
                  가장 흔한 유형
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  관상 선종 (Tubular Adenoma)
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  전체 선종의 <strong>80%</strong>를 차지하는 가장 흔한 유형입니다.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800">
                    10년 내 암 발생률: <strong className="text-2xl">2.7%</strong>
                  </p>
                  <p className="text-orange-600 text-sm mt-1">상대적으로 낮은 위험</p>
                </div>
              </div>
            </ScrollStep>

            <ScrollStep index={5} isActive={currentStep === 5}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-4">
                  주의 필요
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  융모 선종 (Villous Adenoma)
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  전체의 5%에 불과하지만, 암 위험이 가장 높습니다.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">
                    10년 내 암 발생률: <strong className="text-2xl">8.6%</strong>
                  </p>
                  <p className="text-red-600 text-sm mt-1">
                    관상 선종의 <strong>3배 이상</strong> 위험
                  </p>
                </div>
              </div>
            </ScrollStep>

            <ScrollStep index={6} isActive={currentStep === 6}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                  핵심 포인트
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  크기가 중요합니다
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  1cm 미만 용종의 암 위험은 <strong className="text-green-600">1% 이하</strong>지만,
                </p>
                <p className="text-gray-600 text-lg">
                  2cm 이상이면 <strong className="text-red-600">35-50%</strong>로 급증합니다.
                </p>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm font-medium">
                    ⚠️ 크기가 커질수록 위험이 기하급수적으로 증가
                  </p>
                </div>
              </div>
            </ScrollStep>

            <ScrollStep index={7} isActive={currentStep === 7}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
                  특별 주의
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  빠르게 진행하는 톱니모양 병변
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  톱니모양 병변(Serrated Lesion)은 작아도 빠르게 암으로 진행할 수 있습니다.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800">
                    <strong>13개월</strong> 만에 암으로 전환된 사례가 보고되었습니다.
                  </p>
                </div>
              </div>
            </ScrollStep>

            <ScrollStep index={8} isActive={currentStep === 8}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  시간이 지날수록 위험은 커집니다
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  1cm 이상 용종을 방치하면:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">5년 후</span>
                    <span className="font-semibold text-orange-600">4%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">10년 후</span>
                    <span className="font-semibold text-orange-600">14%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">20년 후</span>
                    <span className="font-semibold text-red-600">37%</span>
                  </div>
                </div>
              </div>
            </ScrollStep>

            <ScrollStep index={9} isActive={currentStep === 9}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                  희망의 메시지
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  정기 검진으로 예방 가능
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  용종이 암으로 진행하는 데는 보통
                  <strong className="text-blue-600"> 10-15년</strong>이 걸립니다.
                </p>
                <p className="text-gray-500">
                  이 시간 동안 정기 검진으로 발견하고 제거하면 대장암을 예방할 수 있습니다.
                </p>
              </div>
            </ScrollStep>

            <ScrollStep index={10} isActive={currentStep === 10}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  추적 검사 스케줄
                </h2>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-800">고위험군: 3년마다</p>
                    <p className="text-red-600 text-sm mt-1">
                      선종 3개 이상 / 10mm 이상 / 융모 선종 / 고도이형성
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-800">저위험군: 5-10년마다</p>
                    <p className="text-green-600 text-sm mt-1">
                      1-2개의 작은 관상 선종
                    </p>
                  </div>
                </div>
                <p className="text-gray-500 mt-4 text-sm">
                  의사와 상담하여 본인에게 맞는 스케줄을 정하세요.
                </p>
              </div>
            </ScrollStep>
          </div>

          {/* Sticky chart - Right side */}
          <div className="hidden lg:block lg:w-1/2">
            <StickyChart>
              {renderChart()}
            </StickyChart>
          </div>
        </div>
      </ScrollyContainer>

      {/* Mobile chart (shown below text on mobile) */}
      <div className="lg:hidden px-4 py-8 bg-gray-50">
        <div className="max-w-lg mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            현재 차트
          </h3>
          {renderChart()}
        </div>
      </div>

      {/* Insights Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12"
          >
            핵심 인사이트
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {insights.map((insight, index) => {
              const colorClasses = getColorClasses(insight.color);
              const Icon = insight.icon;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`${colorClasses.bg} border ${colorClasses.border} rounded-xl p-6`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${colorClasses.bg}`}>
                      <Icon className={`w-6 h-6 ${colorClasses.text}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {insight.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{insight.content}</p>
                      <p className={`text-sm font-medium ${colorClasses.text}`}>
                        → {insight.actionable}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sources Section */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6">참고 자료</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 text-sm">{source.name}</span>
              </a>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-500">
            이 아티클은 위 참고 자료를 바탕으로 작성되었습니다.
            개인의 건강 상태에 따라 다를 수 있으므로, 반드시 전문 의료진과 상담하세요.
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            대장내시경, 미루지 마세요
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            50세 이상이라면 지금 바로 대장내시경 검사를 예약하세요.
            <br />
            대장암의 90% 이상을 예방할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.cancer.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              국가암정보센터 방문
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
