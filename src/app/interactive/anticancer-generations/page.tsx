'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// 클라이언트 사이드 감지를 위한 store
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

// 동적 import로 클라이언트 사이드에서만 로드
const ScrollyContainer = dynamic(
  () => import('@/components/interactive/ScrollyContainer'),
  { ssr: false }
);

import DrugTimelineChart from './components/DrugTimelineChart';
import GenerationCompareChart from './components/GenerationCompareChart';
import SurvivalProgressChart from './components/SurvivalProgressChart';
import DrugCardGrid from './components/DrugCard';

// ===== 데이터 정의 =====

const GENERATIONS = [
  {
    generation: 1,
    name: '세포독성 항암제',
    nameEn: 'Cytotoxic Chemotherapy',
    period: '1940s-현재',
    peakYear: 1990,
    color: '#6B7280',
    mechanism: '빠르게 분열하는 모든 세포를 공격',
    sideEffects: '구토, 탈모, 백혈구 감소, 면역력 저하',
    survivalImpact: '10-15%',
    keyDrugs: [
      { name: '시스플라틴', nameEn: 'Cisplatin', approvalYear: 1978, type: '알킬화제' },
      { name: '카보플라틴', nameEn: 'Carboplatin', approvalYear: 1989, type: '알킬화제' },
      { name: '탁솔', nameEn: 'Paclitaxel', approvalYear: 1992, type: '식물 유도체' },
      { name: '젬자', nameEn: 'Gemcitabine', approvalYear: 1996, type: '대사길항제' },
    ],
    limitations: '정상 세포도 공격, 심각한 부작용',
  },
  {
    generation: 2,
    name: '표적 항암제',
    nameEn: 'Targeted Therapy',
    period: '1999-현재',
    peakYear: 2010,
    color: '#3B82F6',
    mechanism: '암세포의 특정 유전자/단백질만 선택적 공격',
    sideEffects: '피부발진, 설사 (상대적으로 경미)',
    survivalImpact: '25-35%',
    keyDrugs: [
      { name: '이레사', nameEn: 'Gefitinib', approvalYear: 2003, type: '1세대 EGFR-TKI', milestone: '세계 최초 폐암 표적치료제' },
      { name: '타세바', nameEn: 'Erlotinib', approvalYear: 2004, type: '1세대 EGFR-TKI' },
      { name: '지오트립', nameEn: 'Afatinib', approvalYear: 2013, type: '2세대 EGFR-TKI' },
      { name: '타그리소', nameEn: 'Osimertinib', approvalYear: 2015, type: '3세대 EGFR-TKI', milestone: 'T790M 내성 돌파' },
    ],
    limitations: '특정 유전자 변이 필수, 내성 발생',
  },
  {
    generation: 3,
    name: '면역 항암제',
    nameEn: 'Immunotherapy',
    period: '2014-현재',
    peakYear: 2020,
    color: '#10B981',
    mechanism: '면역 시스템을 활성화하여 암세포 공격',
    sideEffects: '자가면역 반응 (상대적으로 경미)',
    survivalImpact: '35-40%+',
    keyDrugs: [
      { name: '키트루다', nameEn: 'Pembrolizumab', approvalYear: 2014, type: 'PD-1 억제제', milestone: '최초 PD-1 억제제' },
      { name: '옵디보', nameEn: 'Nivolumab', approvalYear: 2015, type: 'PD-1 억제제' },
      { name: '티센트릭', nameEn: 'Atezolizumab', approvalYear: 2016, type: 'PD-L1 억제제' },
      { name: '임핀지', nameEn: 'Durvalumab', approvalYear: 2017, type: 'PD-L1 억제제' },
    ],
    limitations: '모든 환자에게 효과 X, PD-L1 발현율에 따라 다름',
  },
];

const SURVIVAL_DATA = [
  { period: '1993-1995', periodLabel: '1993', year: 1993, rate: 12.5, generation: 1, milestone: '암등록통계 시작', description: '화학항암제 시대' },
  { period: '1996-2000', periodLabel: '1998', year: 1998, rate: 14.3, generation: 1, milestone: '국가암관리사업 시작' },
  { period: '2001-2005', periodLabel: '2003', year: 2003, rate: 16.6, generation: 2, milestone: '이레사 FDA 승인', description: '표적치료 시대 개막' },
  { period: '2006-2010', periodLabel: '2008', year: 2008, rate: 20.3, generation: 2, milestone: '표적치료제 보편화' },
  { period: '2011-2015', periodLabel: '2013', year: 2013, rate: 27.5, generation: 2, milestone: '면역항암제 연구 활발' },
  { period: '2016-2020', periodLabel: '2018', year: 2018, rate: 35.1, generation: 3, milestone: '면역항암제 급여 확대', description: '면역항암 시대' },
  { period: '2018-2022', periodLabel: '2020', year: 2020, rate: 40.6, generation: 3, milestone: '병용요법 표준화', description: '40% 돌파' },
];

const COMPARISON_DATA = [
  { category: '작용 기전', gen1: '모든 분열 세포 공격', gen2: '암세포 특정 표적 공격', gen3: '면역세포 활성화' },
  { category: '부작용', gen1: '심각 (탈모, 구토)', gen2: '경미~중등도', gen3: '경미 (자가면역)' },
  { category: '치료 반응률', gen1: '20-30%', gen2: '60-80% (변이 시)', gen3: '20-40% (단독)' },
  { category: '지속 기간', gen1: '수개월', gen2: '1-2년', gen3: '수년~장기' },
  { category: '대표 약물', gen1: '시스플라틴, 탁솔', gen2: '이레사, 타그리소', gen3: '키트루다, 옵디보' },
];

const STORY_STEPS = [
  { index: 1, title: '사형선고와 같았던 폐암', highlight: '12.5%', highlightLabel: '1993년 5년 생존율', content: '1990년대, 폐암 진단은 곧 사형선고였습니다. 5년 생존율 단 12.5%. 10명 중 9명은 5년을 넘기지 못했습니다.', chartType: 'survival' },
  { index: 2, title: '무차별 폭격, 화학항암제', highlight: '1세대', highlightLabel: '세포독성 항암제', content: '당시 유일한 무기는 시스플라틴, 탁솔 같은 화학항암제였습니다. 암세포뿐 아니라 정상 세포까지 공격해 탈모, 구토, 면역력 저하... 환자들은 치료 자체가 고통이었습니다.', chartType: 'timeline', focusGeneration: 1 },
  { index: 3, title: '한계에 부딪힌 1세대', highlight: '+1.8%p', highlightLabel: '7년간 개선', content: '10년간의 연구에도 불구하고 생존율 개선은 미미했습니다. 1993년 12.5%에서 2000년 14.3%로 고작 1.8%p 향상. 암과의 전쟁에서 인류는 고전하고 있었습니다.', chartType: 'survival' },
  { index: 4, title: '2003년, 게임 체인저의 등장', highlight: '이레사', highlightLabel: '최초의 폐암 표적치료제', content: "2003년 5월, 세계 최초의 폐암 표적치료제 '이레사(Gefitinib)'가 FDA 승인을 받았습니다. 암세포만 골라 공격하는 '스마트 미사일'의 시대가 열렸습니다.", chartType: 'timeline', focusDrug: '이레사', focusGeneration: 2 },
  { index: 5, title: 'EGFR 변이의 발견', highlight: '60-80%', highlightLabel: '변이 환자 반응률', content: "핵심은 EGFR 유전자 변이였습니다. 이 변이가 있는 환자에게 표적치료제는 60-80%의 높은 반응률을 보였습니다. '맞춤형 치료'의 시대가 시작된 것입니다.", chartType: 'compare' },
  { index: 6, title: '내성의 벽', highlight: 'T790M', highlightLabel: '내성 돌연변이', content: '하지만 표적치료제에도 한계가 있었습니다. 평균 1-2년이 지나면 암세포는 T790M이라는 새로운 돌연변이를 만들어 내성을 갖게 됩니다.', chartType: 'timeline', focusGeneration: 2 },
  { index: 7, title: '내성을 넘어서: 타그리소', highlight: '타그리소', highlightLabel: '3세대 EGFR-TKI', content: "2015년, 3세대 표적치료제 '타그리소(Osimertinib)'가 등장했습니다. T790M 돌연변이까지 공격할 수 있는 이 약물은 내성의 벽을 무너뜨렸습니다.", chartType: 'drugs', focusDrug: '타그리소' },
  { index: 8, title: '2013년, 사이언스가 주목한 혁신', highlight: '2013', highlightLabel: '올해의 연구', content: "2013년, 사이언스지는 '올해의 연구'로 면역항암제를 선정했습니다. 암세포를 직접 공격하는 대신, 우리 몸의 면역 시스템을 깨워 암과 싸우게 하는 완전히 새로운 접근이었습니다.", chartType: 'compare' },
  { index: 9, title: '면역항암제 시대의 개막', highlight: '3세대', highlightLabel: '면역항암제', content: '2014년 키트루다, 2015년 옵디보가 연이어 FDA 승인을 받았습니다. PD-1/PD-L1을 차단해 면역세포가 암을 인식하고 공격할 수 있게 하는 "면역관문억제제"입니다.', chartType: 'timeline', focusGeneration: 3 },
  { index: 10, title: '말기 환자에게도 희망을', highlight: '20%', highlightLabel: '4기 환자 5년 생존', content: '면역항암제의 가장 놀라운 점은 4기 말기 환자에게도 효과를 보인다는 것입니다. 기존 5% 미만이던 4기 환자의 5년 생존율이 20%까지 향상되었습니다. 4배의 기적입니다.', chartType: 'survival' },
  { index: 11, title: '40%를 돌파하다', highlight: '40.6%', highlightLabel: '2022년 5년 생존율', content: '2022년, 폐암 5년 생존율이 마침내 40%를 넘어섰습니다. 30년 전 12.5%에서 40.6%로, 무려 3.2배 향상. 한국 의학의 쾌거입니다.', chartType: 'survival' },
  { index: 12, title: '내일의 희망', highlight: '3.2배', highlightLabel: '30년간 생존율 향상', content: '항암제는 지금도 진화 중입니다. CAR-T 세포치료제, ADC 항체약물접합체... 4세대 항암제가 준비되고 있습니다. 폐암은 더 이상 "사형선고"가 아닙니다.', chartType: 'timeline' },
];

// ===== 컴포넌트 =====

export default function AnticancerGenerationsPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const handleStepEnter = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex + 1);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-white ">
      {/* 히어로 섹션 - 스냅 포인트 없음 */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        {/* 배경 효과 */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-4 md:px-6 lg:px-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
              항암제 <span className="text-blue-400">3세대</span> 혁명
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              30년간 폐암 생존율 <span className="text-green-400 font-bold">3.2배</span> 향상의 비밀
            </p>

            {/* 핵심 지표 */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-12">
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-sm text-gray-400 mb-1">1993년</div>
                <div className="text-4xl md:text-5xl font-bold text-gray-300">12.5%</div>
              </motion.div>

              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-2xl text-gray-500 mt-3">→</div>
              </motion.div>

              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="text-sm text-gray-400 mb-1">2022년</div>
                <div className="text-4xl md:text-5xl font-bold text-green-400">40.6%</div>
              </motion.div>
            </div>
          </motion.div>

        </div>

        {/* 스크롤 유도 - 콘텐츠 아래 배치 */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ delay: 1.5, y: { repeat: Infinity, duration: 1.5 } }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-gray-400">스크롤하여 시작</span>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* 스크롤리텔링 섹션 - 자유 스크롤 (강제 고정 없음) */}
      <ScrollyContainer onStepEnter={handleStepEnter} offset={0.5}>
        <div className="w-full">
          {STORY_STEPS.map((step, index) => (
            <div
              key={step.index}
              className="scroll-step min-h-[85vh] flex flex-col justify-center px-4 md:px-6 lg:px-8 py-12"
              data-step={index}
            >
              <motion.div
                className="w-full max-w-5xl mx-auto"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: currentStep === step.index ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
              >
                {/* 스텝 인디케이터 */}
                <div className="flex items-center gap-3 mb-6 max-w-2xl mx-auto">
                  <span className="text-sm text-gray-400 font-medium">Step {step.index}/12</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(step.index / 12) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* 텍스트 콘텐츠 - 중앙 정렬 */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                  {/* 하이라이트 숫자 - 설명을 위에, 숫자를 아래에 */}
                  <motion.div
                    className="mb-6"
                    key={`highlight-${step.index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                  >
                    <span className="block text-sm md:text-base text-gray-500 mb-2 font-medium">{step.highlightLabel}</span>
                    <span className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
                      {step.highlight}
                    </span>
                  </motion.div>

                  {/* 제목 */}
                  <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                    {step.title}
                  </h2>

                  {/* 내용 - 문장별로 줄바꿈 적용 (줄간격 축소) */}
                  <div className="text-base md:text-lg text-gray-600 leading-relaxed space-y-1">
                    {step.content.split('. ').map((sentence, idx, arr) => (
                      <p key={idx}>{sentence}{idx < arr.length - 1 ? '.' : ''}</p>
                    ))}
                  </div>
                </div>

                {/* 차트 영역 - 전체 폭 사용 */}
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    {/* 생존율 차트 */}
                    {step.chartType === 'survival' && currentStep === step.index && (
                      <motion.div
                        key={`survival-${step.index}`}
                        className="w-full"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4 }}
                      >
                        <SurvivalProgressChart
                          data={SURVIVAL_DATA}
                          currentStep={currentStep}
                          focusYear={currentStep === 1 ? '1993-1995' : currentStep === 11 ? '2018-2022' : null}
                        />
                      </motion.div>
                    )}

                    {/* 타임라인 차트 */}
                    {step.chartType === 'timeline' && currentStep === step.index && (
                      <motion.div
                        key={`timeline-${step.index}`}
                        className="w-full"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4 }}
                      >
                        <DrugTimelineChart
                          generations={GENERATIONS}
                          currentStep={currentStep}
                          focusGeneration={step.focusGeneration || null}
                          focusDrug={step.focusDrug || null}
                        />
                      </motion.div>
                    )}

                    {/* 비교 차트 */}
                    {step.chartType === 'compare' && currentStep === step.index && (
                      <motion.div
                        key={`compare-${step.index}`}
                        className="w-full"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4 }}
                      >
                        <GenerationCompareChart
                          data={COMPARISON_DATA}
                          currentStep={currentStep}
                        />
                      </motion.div>
                    )}

                    {/* 약물 카드 */}
                    {step.chartType === 'drugs' && currentStep === step.index && (
                      <motion.div
                        key={`drugs-${step.index}`}
                        className="w-full"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4 }}
                      >
                        <DrugCardGrid
                          generations={GENERATIONS}
                          currentStep={currentStep}
                          focusDrug={step.focusDrug || null}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </ScrollyContainer>

      {/* 하이라이트 섹션 */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            핵심 인사이트
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '🎯', title: '패러다임의 전환', value: '3번', desc: '무차별 공격 → 정밀 타격 → 면역 활성화' },
              { icon: '📈', title: '생존율 향상', value: '3.2배', desc: '12.5% → 40.6% (30년간)' },
              { icon: '💚', title: '4기 환자 희망', value: '4배', desc: '5% → 20% (5년 생존율)' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-4xl">{item.icon}</span>
                <h3 className="text-xl font-bold text-gray-900 mt-4">{item.title}</h3>
                <div className="text-4xl font-bold text-blue-600 mt-2">{item.value}</div>
                <p className="text-gray-600 mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 출처 섹션 */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">데이터 출처</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <a href="https://www.cancer.go.kr" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              국립암센터 중앙암등록본부
            </a>
            <span>•</span>
            <a href="https://www.fda.gov" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              미국 FDA
            </a>
            <span>•</span>
            <a href="https://lungca.or.kr" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              대한폐암학회
            </a>
            <span>•</span>
            <a href="https://www.mohw.go.kr" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              보건복지부
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-6">
            본 콘텐츠는 공공누리 제1유형 라이선스에 따라 공공데이터를 활용하여 제작되었습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
