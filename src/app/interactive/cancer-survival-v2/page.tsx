'use client';

import { useState, useCallback, useMemo } from 'react';
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

// Story data
const storyData = {
  title: "30년간의 기적",
  subtitle: "한국 암 치료의 놀라운 발전을 데이터로 확인하세요.",
  steps: [
    {
      index: 0,
      title: "1993년, 암은 사형선고",
      content: "암 진단을 받은 환자 10명 중 6명은 5년을 넘기지 못했습니다. 생존율은 겨우 41.2%였습니다.",
      highlight: "41.2%",
      emotion: "shocking",
      chartState: {
        focusYear: "1993-1995",
        highlightCategory: "overall",
        animation: "reveal",
        opacity: { overall: 1.0, others: 0.2 }
      }
    },
    {
      index: 1,
      title: "가장 치명적이었던 암",
      content: "폐암은 12.5%, 간암은 11.8%의 생존율을 기록했습니다. 대부분의 환자가 1년을 넘기기 어려웠습니다.",
      highlight: "12.5%",
      highlightLabel: "폐암 생존율",
      emotion: "shocking",
      chartState: {
        focusYear: "1993-1995",
        highlightCategory: ["lung", "liver", "pancreas"],
        animation: "highlight",
        opacity: { lung: 1.0, liver: 1.0, pancreas: 1.0, others: 0.3 }
      }
    },
    {
      index: 2,
      title: "1996년, 희망의 시작",
      content: "국가암관리사업이 출범하며 체계적인 암 관리가 시작되었습니다. 생존율은 44.0%로 상승했습니다.",
      highlight: "+2.8%p",
      highlightLabel: "3년만에",
      emotion: "hopeful",
      chartState: {
        focusYear: "1996-2000",
        highlightCategory: "overall",
        animation: "transition",
        showComparison: { from: "1993-1995", to: "1996-2000" }
      }
    },
    {
      index: 3,
      title: "2005년, 50% 돌파",
      content: "처음으로 절반 이상의 환자가 5년을 생존하게 되었습니다. 암은 더 이상 사형선고가 아니었습니다.",
      highlight: "54.2%",
      emotion: "hopeful",
      chartState: {
        focusYear: "2001-2005",
        highlightCategory: "overall",
        animation: "milestone",
        showThreshold: 50,
        thresholdLabel: "생존율 50% 돌파"
      }
    },
    {
      index: 4,
      title: "위암의 극적 개선",
      content: "한국인에게 흔한 위암은 43.9%에서 58.0%로 크게 개선되었습니다. 조기검진의 힘이었습니다.",
      highlight: "+14.1%p",
      highlightLabel: "10년간",
      emotion: "hopeful",
      chartState: {
        focusYear: "2001-2005",
        highlightCategory: "stomach",
        animation: "compare",
        showComparison: { from: "1993-1995", to: "2001-2005", category: "stomach" }
      }
    },
    {
      index: 5,
      title: "2015년, 70% 시대",
      content: "생존율이 70.3%를 기록하며 선진국 수준에 도달했습니다. 의료기술의 발전과 조기검진이 만든 성과였습니다.",
      highlight: "70.3%",
      emotion: "triumphant",
      chartState: {
        focusYear: "2011-2015",
        highlightCategory: "overall",
        animation: "milestone",
        showThreshold: 70,
        thresholdLabel: "생존율 70% 돌파"
      }
    },
    {
      index: 6,
      title: "폐암의 기적",
      content: "가장 치명적이었던 폐암은 12.5%에서 40.6%로 3배 이상 향상되었습니다. 표적치료제와 면역항암제의 혁신이었습니다.",
      highlight: "3.2배",
      highlightLabel: "생존율 증가",
      emotion: "triumphant",
      chartState: {
        focusYear: "2018-2022",
        highlightCategory: "lung",
        animation: "dramatic",
        showComparison: { from: "1993-1995", to: "2018-2022", category: "lung" }
      }
    },
    {
      index: 7,
      title: "2022년, 10명 중 7명",
      content: "이제 암 환자 10명 중 7명은 5년 이상 생존합니다. 30년 전과 비교하면 31.7%p나 향상되었습니다.",
      highlight: "72.9%",
      emotion: "triumphant",
      chartState: {
        focusYear: "2018-2022",
        highlightCategory: "overall",
        animation: "finale",
        showAllCategories: true,
        showComparison: { from: "1993-1995", to: "2018-2022" }
      }
    }
  ]
};

// Cancer data
const cancerData = {
  metadata: {
    title: "한국 암환자 5년 상대생존율 30년 변화 (1993-2022)",
    source: "국립암센터 중앙암등록본부, 보건복지부",
    sourceUrl: "https://www.cancer.go.kr/lay1/S1T648C650/contents.do",
    lastUpdated: "2024-12-20"
  },
  timeline: [
    { period: "1993-1995", periodLabel: "1993", year: 1993, all: 41.2, milestone: "암등록통계 시작", description: "암 생존율 40% 시대" },
    { period: "1996-2000", periodLabel: "1998", year: 1998, all: 44.0, milestone: "국가암관리사업", description: "국가암관리사업 시작" },
    { period: "2001-2005", periodLabel: "2003", year: 2003, all: 54.2, milestone: "50% 돌파", description: "50% 돌파" },
    { period: "2006-2010", periodLabel: "2008", year: 2008, all: 65.5, milestone: "60% 시대", description: "암 생존율 60% 시대" },
    { period: "2011-2015", periodLabel: "2013", year: 2013, all: 70.3, milestone: "70% 돌파", description: "70% 돌파" },
    { period: "2018-2022", periodLabel: "2020", year: 2020, all: 72.9, milestone: "현재", description: "10명 중 7명 생존" }
  ],
  cancerTypes: {
    overall: {
      name: "전체 암",
      nameEn: "overall",
      color: "#000000",
      data: [
        { period: "1993-1995", rate: 41.2 },
        { period: "1996-2000", rate: 44.0 },
        { period: "2001-2005", rate: 54.2 },
        { period: "2006-2010", rate: 65.5 },
        { period: "2011-2015", rate: 70.3 },
        { period: "2018-2022", rate: 72.9 }
      ]
    },
    thyroid: {
      name: "갑상선암",
      nameEn: "thyroid",
      color: "#8B5CF6",
      data: [
        { period: "1993-1995", rate: 94.5 },
        { period: "2001-2005", rate: 98.3 },
        { period: "2006-2010", rate: 99.8 },
        { period: "2018-2022", rate: 100.1 }
      ]
    },
    prostate: {
      name: "전립선암",
      nameEn: "prostate",
      color: "#3B82F6",
      data: [
        { period: "1993-1995", rate: 59.2 },
        { period: "2001-2005", rate: 81.0 },
        { period: "2006-2010", rate: 80.2 },
        { period: "2018-2022", rate: 96.4 }
      ]
    },
    breast: {
      name: "유방암",
      nameEn: "breast",
      color: "#EC4899",
      data: [
        { period: "1993-1995", rate: 79.3 },
        { period: "2001-2005", rate: 88.7 },
        { period: "2006-2010", rate: 91.0 },
        { period: "2018-2022", rate: 94.3 }
      ]
    },
    stomach: {
      name: "위암",
      nameEn: "stomach",
      color: "#10B981",
      data: [
        { period: "1993-1995", rate: 43.9 },
        { period: "2001-2005", rate: 58.0 },
        { period: "2006-2010", rate: 67.0 },
        { period: "2018-2022", rate: 78.4 }
      ]
    },
    colorectal: {
      name: "대장암",
      nameEn: "colorectal",
      color: "#F59E0B",
      data: [
        { period: "1993-1995", rate: 56.2 },
        { period: "2001-2005", rate: 67.0 },
        { period: "2006-2010", rate: 72.6 },
        { period: "2018-2022", rate: 74.6 }
      ]
    },
    lung: {
      name: "폐암",
      nameEn: "lung",
      color: "#EF4444",
      data: [
        { period: "1993-1995", rate: 12.5 },
        { period: "2001-2005", rate: 16.6 },
        { period: "2006-2010", rate: 19.7 },
        { period: "2018-2022", rate: 40.6 }
      ]
    },
    liver: {
      name: "간암",
      nameEn: "liver",
      color: "#F97316",
      data: [
        { period: "1993-1995", rate: 11.8 },
        { period: "2001-2005", rate: 20.6 },
        { period: "2006-2010", rate: 26.7 },
        { period: "2018-2022", rate: 39.4 }
      ]
    },
    pancreas: {
      name: "췌장암",
      nameEn: "pancreas",
      color: "#6B7280",
      data: [
        { period: "1993-1995", rate: 10.7 },
        { period: "2001-2005", rate: 8.5 },
        { period: "2006-2010", rate: 8.0 },
        { period: "2018-2022", rate: 16.5 }
      ]
    },
    kidney: {
      name: "신장암",
      nameEn: "kidney",
      color: "#14B8A6",
      data: [
        { period: "1993-1995", rate: 64.3 },
        { period: "2001-2005", rate: 73.6 },
        { period: "2006-2010", rate: 78.5 },
        { period: "2018-2022", rate: 87.3 }
      ]
    }
  },
  highlights: {
    biggestImprovement: {
      category: "전립선암",
      from: 59.2,
      to: 96.4,
      change: 37.2,
      changePercent: 62.8,
      description: "1993-1995년 59.2%에서 2018-2022년 96.4%로 37.2%p 향상. 조기검진 확대와 치료기술 발전으로 세계적 수준의 생존율 달성"
    },
    mostDramatic: {
      category: "폐암",
      from: 12.5,
      to: 40.6,
      change: 28.1,
      changeMultiple: 3.2,
      description: "1993-1995년 12.5%에서 2018-2022년 40.6%로 3.2배 이상 향상. 표적치료제와 면역항암제 도입으로 극적인 개선"
    },
    stillChallenging: {
      category: "췌장암",
      from: 10.7,
      to: 16.5,
      rate: 16.5,
      description: "2018-2022년 기준 16.5%로 여전히 낮은 생존율. 조기발견이 어렵고 공격적인 특성으로 치료가 어려움"
    },
    overallProgress: {
      from: 41.2,
      to: 72.9,
      change: 31.7,
      description: "전체 암 5년 생존율이 30년간 31.7%p 향상되어 10명 중 7명이 5년 이상 생존"
    }
  },
  keyInsights: [
    {
      icon: "TrendingUp",
      title: "30년간 31.7%p 생존율 향상",
      description: "1993-1995년 41.2%에서 2018-2022년 72.9%로 지속적 개선. 국가암관리사업과 의료기술 발전의 성과"
    },
    {
      icon: "Award",
      title: "세계적 수준의 암 생존율",
      description: "갑상선암 100.1%, 전립선암 96.4%, 유방암 94.3%로 선진국 수준 달성"
    },
    {
      icon: "Zap",
      title: "난치성 암의 극적 개선",
      description: "폐암 28.1%p, 위암 34.5%p, 간암 27.6%p 향상. 표적치료제와 면역항암제의 혁신"
    },
    {
      icon: "Users",
      title: "암 유병자 259만 명 시대",
      description: "2022년 기준 전국민의 5%가 암 유병자. 61.3%는 5년 이상 생존한 장기 생존자"
    },
    {
      icon: "Eye",
      title: "조기검진의 중요성",
      description: "국소 단계 발견시 92.1% 생존, 원격전이시 27.1% 생존. 조기발견이 생존율의 핵심"
    },
    {
      icon: "AlertCircle",
      title: "여전한 도전과제",
      description: "췌장암(16.5%), 담낭암(29.4%), 간암(39.4%), 폐암(40.6%)은 지속적 연구 필요"
    }
  ]
};

// Icon components mapping
const IconMap: Record<string, React.FC<{ className?: string }>> = {
  TrendingUp: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Award: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  Zap: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Users: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Eye: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  AlertCircle: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

export default function CancerSurvivalV2Page() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCancers, setSelectedCancers] = useState<string[]>(['overall', 'lung', 'stomach', 'liver']);

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

  // Map cancer key to Korean name for highlight cards
  const getCancerKeyByName = (name: string): string => {
    const mapping: Record<string, string> = {
      '전립선암': 'prostate',
      '폐암': 'lung',
      '췌장암': 'pancreas'
    };
    return mapping[name] || 'overall';
  };

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
            {storyData.title}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {storyData.subtitle}
          </p>

          <div className="flex items-center justify-center gap-8 mt-12">
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-2">1993년</p>
              <AnimatedNumber
                value={41.2}
                className="text-5xl font-bold text-gray-400"
                duration={1.5}
              />
              <span className="text-2xl font-bold text-gray-400">%</span>
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
              <span className="text-2xl font-bold text-blue-600">%</span>
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
              {storyData.steps.map((step) => (
                <ScrollStep key={step.index} index={step.index} isActive={currentStep === step.index}>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {step.content}
                    </p>
                    {step.highlight && (
                      <div className="mt-6">
                        <p className="text-4xl font-bold text-blue-600">
                          {step.highlight}
                        </p>
                        {step.highlightLabel && (
                          <p className="text-sm text-gray-500 mt-2">
                            {step.highlightLabel}
                          </p>
                        )}
                      </div>
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
                cancer={cancerData.highlights.biggestImprovement.category}
                from={cancerData.highlights.biggestImprovement.from}
                to={cancerData.highlights.biggestImprovement.to}
                change={cancerData.highlights.biggestImprovement.change}
                description={cancerData.highlights.biggestImprovement.description}
                onClick={() => handleHighlightClick(getCancerKeyByName(cancerData.highlights.biggestImprovement.category))}
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
                cancer={cancerData.highlights.mostDramatic.category}
                from={cancerData.highlights.mostDramatic.from}
                to={cancerData.highlights.mostDramatic.to}
                change={cancerData.highlights.mostDramatic.change}
                description={cancerData.highlights.mostDramatic.description}
                onClick={() => handleHighlightClick(getCancerKeyByName(cancerData.highlights.mostDramatic.category))}
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
                cancer={cancerData.highlights.stillChallenging.category}
                rate={cancerData.highlights.stillChallenging.rate}
                description={cancerData.highlights.stillChallenging.description}
                onClick={() => handleHighlightClick(getCancerKeyByName(cancerData.highlights.stillChallenging.category))}
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
            {cancerData.keyInsights.map((insight, index) => {
              const Icon = IconMap[insight.icon];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 text-center shadow-sm"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {Icon && <Icon className="w-6 h-6 text-blue-600" />}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {insight.title}
                  </h3>
                  <p className="text-gray-600">
                    {insight.description}
                  </p>
                </motion.div>
              );
            })}
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
