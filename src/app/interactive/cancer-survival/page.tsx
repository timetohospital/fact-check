'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ScrollyContainer,
  ScrollStep,
  StickyChart,
  SurvivalLineChart,
  FilterButtons,
  ComparisonChart,
  AnimatedNumber,
  HighlightCard,
} from '@/components/interactive';
import cancerData from '@/data/cancer-survival-rates.json';

export default function CancerSurvivalPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCancers, setSelectedCancers] = useState<string[]>([]);

  const handleStepEnter = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, []);

  const handleSelectCancer = useCallback((key: string) => {
    setSelectedCancers(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedCancers([]);
  }, []);

  const handleHighlightClick = useCallback((cancerKey: string) => {
    setSelectedCancers([cancerKey]);
    // Scroll to comparison section
    document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const steps = [
    {
      title: '30년간의 기적',
      content: '한국 의료의 놀라운 발전을 데이터로 확인하세요.',
    },
    {
      title: '1993년, 암은 사형선고였다',
      content: '암 진단을 받은 환자 10명 중 6명은 5년을 넘기지 못했습니다. 5년 생존율은 단 42.9%에 불과했습니다.',
      highlight: '42.9%',
    },
    {
      title: '1999년, 변화의 시작',
      content: '국가암조기검진사업이 시작되었습니다. 위암, 유방암, 자궁경부암 검진이 확대되며 조기 발견율이 높아졌습니다.',
      highlight: '45.3%',
    },
    {
      title: '2000년대, 표적치료의 등장',
      content: '건강보험 통합으로 의료 접근성이 높아지고, 글리벡 같은 표적치료제가 도입되기 시작했습니다.',
      highlight: '54.2%',
    },
    {
      title: '암검진 확대',
      content: '대장암, 간암 검진이 추가되고 표적치료제가 보편화되며 생존율이 급등했습니다.',
      highlight: '65.5%',
    },
    {
      title: '면역항암제의 혁명',
      content: '키트루다, 옵디보 등 면역관문억제제가 등장하며 치료 패러다임이 완전히 바뀌었습니다.',
      highlight: '70.7%',
    },
    {
      title: '정밀의학 시대',
      content: '유전자 분석 기반 맞춤 치료가 확산되고, AI 진단 보조 기술이 도입되었습니다.',
      highlight: '71.5%',
    },
    {
      title: '이제 10명 중 7명이 생존합니다',
      content: '2022년 현재, 암환자 5년 생존율은 72.9%에 달합니다. 암은 더 이상 사형선고가 아닙니다.',
      highlight: '72.9%',
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-blue-600 font-medium mb-4">움직이는 글</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            30년간의 기적
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            한국 암환자 5년 생존율이 어떻게 변화했는지,<br />
            스크롤을 내리며 확인하세요.
          </p>

          <div className="flex items-center justify-center gap-8 mt-12">
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-2">1993년</p>
              <AnimatedNumber
                value={42.9}
                className="text-5xl font-bold text-gray-400"
                duration={1.5}
              />
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="w-24 h-0.5 bg-gradient-to-r from-gray-300 to-blue-500"
            />
            <div className="text-center">
              <p className="text-blue-600 text-sm mb-2">2022년</p>
              <AnimatedNumber
                value={72.9}
                className="text-5xl font-bold text-blue-600"
                duration={2}
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="mt-16 animate-bounce"
          >
            <p className="text-gray-400 text-sm">스크롤을 내려주세요</p>
            <svg className="w-6 h-6 mx-auto mt-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* Scrollytelling Section */}
      <section className="relative">
        <ScrollyContainer onStepEnter={handleStepEnter}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Steps (Left) */}
            <div className="relative z-10">
              {steps.map((step, index) => (
                <ScrollStep key={index} index={index} isActive={currentStep === index}>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {step.content}
                    </p>
                    {step.highlight && (
                      <p className="text-4xl font-bold text-blue-600 mt-6">
                        {step.highlight}
                      </p>
                    )}
                  </div>
                </ScrollStep>
              ))}
            </div>

            {/* Chart (Right - Sticky) */}
            <div className="hidden lg:block">
              <StickyChart>
                <SurvivalLineChart
                  data={cancerData.timeline}
                  currentStep={currentStep}
                />
              </StickyChart>
            </div>
          </div>
        </ScrollyContainer>
      </section>

      {/* Mobile Chart (visible only on mobile) */}
      <section className="lg:hidden px-4 py-8 bg-gray-50">
        <SurvivalLineChart
          data={cancerData.timeline}
          currentStep={cancerData.timeline.length}
        />
      </section>

      {/* Comparison Section (The Pudding Style) */}
      <section id="comparison-section" className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              모든 암이 같지 않습니다
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              암 종류를 선택해서 각각의 변화를 비교해보세요.
            </p>
          </motion.div>

          <FilterButtons
            cancerTypes={cancerData.cancerTypes}
            selected={selectedCancers}
            onSelect={handleSelectCancer}
            onClear={handleClearSelection}
          />

          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <ComparisonChart
              cancerTypes={cancerData.cancerTypes}
              selected={selectedCancers}
            />
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-gray-900 mb-12"
          >
            주목할 만한 변화
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <HighlightCard
                type="improvement"
                cancer={cancerData.highlights.biggestImprovement.cancer}
                from={cancerData.highlights.biggestImprovement.from}
                to={cancerData.highlights.biggestImprovement.to}
                change={cancerData.highlights.biggestImprovement.change}
                description={cancerData.highlights.biggestImprovement.description}
                onClick={() => handleHighlightClick('prostate')}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <HighlightCard
                type="dramatic"
                cancer={cancerData.highlights.mostDramatic.cancer}
                from={cancerData.highlights.mostDramatic.from}
                to={cancerData.highlights.mostDramatic.to}
                change={cancerData.highlights.mostDramatic.change}
                description={cancerData.highlights.mostDramatic.description}
                onClick={() => handleHighlightClick('lung')}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <HighlightCard
                type="challenge"
                cancer={cancerData.highlights.stillChallenging.cancer}
                rate={cancerData.highlights.stillChallenging.rate}
                description={cancerData.highlights.stillChallenging.description}
                onClick={() => handleHighlightClick('pancreas')}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Insights */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            핵심 인사이트
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cancerData.keyInsights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 text-center shadow-sm"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {insight.icon === 'trending-up' && (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  {insight.icon === 'heart' && (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                  {insight.icon === 'search' && (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {insight.title}
                </h3>
                <p className="text-gray-600">
                  {insight.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Source Section */}
      <section className="py-12 px-4 bg-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-2">데이터 출처</p>
          <p className="text-gray-700">
            {cancerData.metadata.source}
          </p>
          <a
            href={cancerData.metadata.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm mt-2 inline-block"
          >
            원본 데이터 확인하기 →
          </a>
          <p className="text-xs text-gray-400 mt-4">
            마지막 업데이트: {cancerData.metadata.lastUpdated}
          </p>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="py-8 px-4 bg-gray-50 border-t">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-500 text-center">
            본 콘텐츠는 정보 제공 목적으로 작성되었으며, 의료적 조언을 대체하지 않습니다.
            건강 관련 결정은 반드시 전문 의료인과 상담하시기 바랍니다.
          </p>
        </div>
      </section>
    </main>
  );
}
