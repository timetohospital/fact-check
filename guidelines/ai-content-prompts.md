# AI 콘텐츠 생성 프롬프트 모음

> VitalFlow 아티클 생성을 위한 AI 프롬프트 템플릿

---

## 1. 표준 건강 아티클 프롬프트

```
당신은 VitalFlow의 수석 건강 콘텐츠 작성자입니다. 의학적 정확성과 SEO 최적화를 모두 갖춘 콘텐츠를 작성합니다.

## 작성할 아티클 정보
- **주제:** [TOPIC]
- **주요 키워드:** [PRIMARY_KEYWORD]
- **보조 키워드:** [SECONDARY_KEYWORDS]
- **타겟 독자:** [TARGET_AUDIENCE]
- **검색 의도:** [Informational/Commercial/Transactional]

## 출력 형식

### YAML Frontmatter
다음 형식으로 시작하세요:
```yaml
---
title: "[숫자] [형용사] Benefits of [주제]: [부제]"
description: "[150-160자, 키워드 포함, 행동 유도 문구]"
author: "[전문가 이름], [자격증]"
publishedAt: "[오늘 날짜]"
category: "[nutrition/fitness/mental-health/wellness 중 택1]"
tags: ["tag1", "tag2", "tag3", "tag4", "tag5"]
image: "/images/articles/[slug].jpg"
imageAlt: "[접근성 설명]"
medicalReviewer: "[검토자 이름], [전문분야]"
reviewedAt: "[어제 날짜]"
sources:
  - "[실제 학술 출처 1]"
  - "[실제 의료기관 출처 2]"
  - "[실제 정부기관 출처 3]"
---
```

### 콘텐츠 구조

1. **도입부** (150단어)
   - 첫 문장: **볼드로 주제 핵심 정의**
   - 왜 중요한지 (통계/사실 포함)
   - 아티클 미리보기

2. **What is [Topic]?** (200단어)
   - 명확한 정의
   - 유형/종류 (테이블 형식)
   - 과학적 배경

3. **[Number] Key Benefits** (각 150단어 × N개)
   - H3로 각 베네핏
   - 첫 문장에 핵심
   - 연구/통계 인용
   - 실용적 적용법

4. **How to [Use/Apply]** (250단어)
   - 단계별 가이드
   - 용량/시간/빈도
   - 초보자 vs 경험자 팁

5. **Potential Risks & Side Effects** (200단어)
   - 일반적인 부작용
   - 주의해야 할 상호작용
   - 피해야 할 사람들

6. **[Topic] vs [Alternative]** (200단어)
   - 비교 테이블
   - 각각의 장단점
   - 선택 가이드

7. **FAQ** (5-7개, 각 80단어)
   - "Is [topic] safe for...?"
   - "How much [topic] should I...?"
   - "When is the best time to...?"
   - "Can I [topic] while...?"
   - "What are the signs of...?"

8. **The Bottom Line** (100단어)
   - 3-4문장 핵심 요약
   - 행동 촉구

9. **의료 면책조항**
   - 표준 문구 포함

## 작성 규칙

1. **첫 문장 = 답변**: 각 섹션의 첫 문장이 질문에 대한 직접 답변이어야 함
2. **구체적 수치**: "많은" → "67%", "좋다" → "혈압 10mmHg 감소"
3. **능동태 사용**: "복용되어야 한다" → "복용하세요"
4. **2인칭 사용**: "사람들은" → "당신은"
5. **전문용어 설명**: "EGCG(에피갈로카테킨 갈레이트, 녹차의 주요 항산화제)"
6. **출처 명시**: 모든 통계/연구에 출처 괄호 표기

## 금지 사항
- "기적의", "완치", "100%" 등 과장 표현
- 구체적 의료 조언 (진단, 처방)
- 출처 없는 통계
- 키워드 부자연스러운 반복

지금 [TOPIC]에 대한 아티클을 작성해주세요.
```

---

## 2. 비교 아티클 프롬프트

```
VitalFlow의 건강 비교 아티클을 작성합니다.

## 비교 대상
- **Option A:** [OPTION_A]
- **Option B:** [OPTION_B]
- **비교 목적:** [GOAL - 예: 체중 감량, 근육 증가]

## 출력 구조

### Frontmatter
```yaml
---
title: "[A] vs [B]: Which is Better for [Goal]? [Year] Guide"
description: "Compare [A] and [B] for [goal]. Expert analysis of benefits, side effects, costs, and effectiveness. Find your best choice."
# ... 표준 필드 ...
articleType: "ComparisonArticle"
---
```

### 콘텐츠

1. **Quick Answer** (50단어)
   > **Bottom line:** [A]는 [상황1]에 더 좋고, [B]는 [상황2]에 더 좋습니다.

2. **Comparison Table**
   | Factor | [A] | [B] | Winner |
   |--------|-----|-----|--------|
   | 효과 | | | |
   | 부작용 | | | |
   | 비용 | | | |
   | 편의성 | | | |
   | 연구 근거 | | | |

3. **What is [A]?** (200단어)

4. **What is [B]?** (200단어)

5. **[A] vs [B]: Key Differences** (300단어)
   - 작용 메커니즘
   - 효과 발현 시간
   - 지속 기간

6. **Who Should Choose [A]** (150단어)

7. **Who Should Choose [B]** (150단어)

8. **Can You Use [A] and [B] Together?** (100단어)

9. **FAQ** (5개)

10. **Our Verdict** (100단어)

## 중립성 규칙
- 양쪽 모두 장단점 공정하게
- "더 좋다"가 아닌 "~에 더 적합하다"
- 개인 상황에 따른 선택 강조
```

---

## 3. How-To 가이드 프롬프트

```
VitalFlow의 실행 가이드를 작성합니다.

## 가이드 정보
- **목표 행동:** [ACTION - 예: 간헐적 단식 시작하기]
- **난이도:** [초급/중급/고급]
- **소요 시간:** [예: 2주 적응기간]
- **필요 도구:** [필요한 것들]

## 출력 구조

### Frontmatter
```yaml
---
title: "How to [Action]: [Number]-Step Guide for [Year]"
description: "Learn how to [action] with our step-by-step guide. [Specific outcome] in [timeframe]. Expert tips included."
articleType: "HowTo"
estimatedTime: "PT[X]M"  # ISO 8601
difficulty: "[Beginner/Intermediate/Advanced]"
tools: ["tool1", "tool2"]
---
```

### 콘텐츠

1. **Quick Overview**
   - 무엇을 배울 것인가
   - 왜 이것이 효과적인가
   - 예상 결과

2. **Before You Start** (Checklist)
   - [ ] 필요한 준비물
   - [ ] 건강 상태 확인
   - [ ] 목표 설정

3. **Step-by-Step Guide**

   ### Step 1: [동사로 시작]
   **What:** [무엇을 할 것인가]
   **How:** [구체적 방법]
   **Tip:** [프로 팁]
   **Common Mistake:** [피해야 할 실수]

   ### Step 2: ...
   [각 스텝 반복]

4. **Week-by-Week Progress**
   | Week | 목표 | 체크포인트 |
   |------|------|-----------|
   | 1 | | |
   | 2 | | |

5. **Troubleshooting**
   - "~하면 어떡하죠?" → 해결책
   - 흔한 문제 5가지

6. **FAQ**

7. **Next Steps**
   - 마스터한 후 다음 단계
   - 관련 가이드 링크

## 실행 가능성 규칙
- 모든 스텝은 구체적이고 측정 가능해야 함
- "충분히" → "하루 8시간"
- "자주" → "주 3회"
- 각 스텝 완료 확인 방법 제시
```

---

## 4. 리스트 아티클 프롬프트

```
VitalFlow의 리스트 아티클을 작성합니다.

## 리스트 정보
- **주제:** [NUMBER] [SUPERLATIVE] [TOPIC] for [GOAL]
- **예시:** 15 Best Foods for Weight Loss
- **리스트 개수:** [NUMBER]

## 출력 구조

### Frontmatter
```yaml
---
title: "[Number] [Best/Top/Proven] [Topic] for [Goal] ([Year])"
description: "Discover the [number] [superlative] [topic] for [goal]. Science-backed picks with [specific benefits]. Updated [month year]."
---
```

### 콘텐츠

1. **도입부** (100단어)
   - 왜 이 리스트가 중요한가
   - 선정 기준

2. **Quick List** (Featured Snippet 최적화)
   > **Best [Topic] at a Glance:**
   > 1. [Item 1] - Best for [specific use]
   > 2. [Item 2] - Best for [specific use]
   > ... (전체 리스트)

3. **Detailed List**

   ### 1. [Item Name]
   **Best for:** [특정 상황/사람]
   **Key benefit:** [주요 이점]
   **How to use:** [사용법]
   **Evidence:** [연구/출처]

   [150단어 설명]

   ### 2. [Item Name]
   [반복...]

4. **Comparison Table**
   | Item | Best For | Key Benefit | Evidence Level |
   |------|----------|-------------|----------------|

5. **How to Choose** (200단어)
   - 개인 상황별 추천
   - 예산별 추천
   - 목표별 추천

6. **FAQ**

7. **The Bottom Line**

## 리스트 품질 규칙
- 각 항목에 구체적 "Best for" 태그
- 순위 기준 명확히 설명
- 최소 3개 이상의 연구/출처 인용
- 예산/접근성 다양성 확보
```

---

## 5. FAQ 확장 프롬프트

```
기존 아티클의 FAQ 섹션을 확장합니다.

## 기존 아티클 정보
- **주제:** [TOPIC]
- **주요 키워드:** [KEYWORD]
- **기존 FAQ 개수:** [N]개

## 추가할 FAQ 유형

### "People Also Ask" 스타일
1. **안전성 질문**
   - "Is [topic] safe for [특정 그룹]?"
   - "Can [topic] cause [부작용]?"

2. **방법 질문**
   - "How do I [동작] with [topic]?"
   - "What is the best way to [동작]?"

3. **비교 질문**
   - "Is [topic] better than [alternative]?"
   - "What is the difference between [A] and [B]?"

4. **시간/양 질문**
   - "How long does [topic] take to [효과]?"
   - "How much [topic] should I [동작]?"

5. **상황별 질문**
   - "Can I [topic] while [상황]?"
   - "Should I [topic] before or after [활동]?"

## FAQ 답변 형식

### [질문을 그대로 H3로]

**[첫 문장: 직접 답변 - Yes/No 또는 핵심 정보]**

[2-3문장 설명: 이유, 조건, 예외]

[선택사항: 권장사항이나 다음 단계]

*예시:*

### Can I drink coffee while intermittent fasting?

**Yes, black coffee is allowed during fasting periods and won't break your fast.** Coffee contains minimal calories (about 2-5 per cup) and may actually enhance fasting benefits by boosting metabolism.

However, avoid adding sugar, milk, or cream as these contain calories that will break your fast. Stick to plain black coffee, or try adding a small amount of cinnamon for flavor without calories.

## 출력 형식
각 FAQ를 별도의 H3 섹션으로 작성하고, 관련 스키마 마크업 제안도 포함해주세요.
```

---

## 6. 콘텐츠 업데이트 프롬프트

```
기존 아티클을 최신 정보로 업데이트합니다.

## 업데이트할 아티클
[기존 아티클 전문 또는 요약 붙여넣기]

## 업데이트 유형
- [ ] 새로운 연구 추가
- [ ] 가이드라인 변경 반영
- [ ] 통계 수치 업데이트
- [ ] 새로운 섹션 추가
- [ ] SEO 최적화 개선

## 출력 요청

1. **변경 요약**
   | 섹션 | 기존 | 변경 | 이유 |
   |------|------|------|------|

2. **업데이트된 Frontmatter**
   - updatedAt 날짜 변경
   - 새로운 sources 추가
   - 필요시 tags 업데이트

3. **섹션별 변경 내용**
   - [변경 전] → [변경 후] 형식으로

4. **새로 추가된 콘텐츠**
   - 새 섹션 전문

5. **삭제/수정된 콘텐츠**
   - 제거된 부분과 이유

## 업데이트 우선순위
1. 의학적 정확성 (잘못된 정보 수정)
2. 최신성 (오래된 통계/연구)
3. 완전성 (누락된 중요 정보)
4. SEO (키워드, 구조 최적화)
```

---

## 7. 콘텐츠 품질 검토 프롬프트

```
작성된 아티클의 품질을 검토합니다.

## 검토할 아티클
[아티클 전문 붙여넣기]

## 검토 기준

### 1. EEAT 점수 (각 항목 1-10점)
- **Experience:** 실제 경험/사례가 포함되어 있는가?
- **Expertise:** 전문 지식이 드러나는가?
- **Authoritativeness:** 신뢰할 수 있는 출처가 있는가?
- **Trustworthiness:** 정확하고 편향 없는가?

### 2. SEO 체크리스트
- [ ] 타이틀 최적화 (키워드 위치, 길이)
- [ ] 메타 설명 (CTA, 길이, 키워드)
- [ ] 헤딩 구조 (H1-H4 계층)
- [ ] 키워드 밀도 (1-2%)
- [ ] 내부/외부 링크

### 3. AEO 체크리스트
- [ ] 첫 문장 직접 답변
- [ ] FAQ 섹션 존재
- [ ] Featured Snippet 최적화
- [ ] 테이블/리스트 활용

### 4. 가독성 점수
- Flesch Reading Ease
- 평균 문장 길이
- 단락 길이

### 5. 의료 콘텐츠 체크리스트
- [ ] 면책조항 포함
- [ ] 전문가 상담 권유
- [ ] 출처 3개 이상
- [ ] 과장 표현 없음

## 출력 형식

### 종합 점수: [A/B/C/D/F]

### 강점
1. ...
2. ...

### 개선 필요 사항
1. **[심각도: 높음]** [문제] → [해결책]
2. **[심각도: 중간]** [문제] → [해결책]
3. **[심각도: 낮음]** [문제] → [해결책]

### 구체적 수정 제안
[원문] → [수정안]

### 추가 권장 사항
- 새로 추가할 섹션
- 보강할 내용
- 제거할 내용
```

---

## 사용 예시

### Claude/ChatGPT에서 사용하기

1. 위 프롬프트 중 적절한 것 선택
2. `[PLACEHOLDER]` 부분을 실제 값으로 교체
3. AI에게 전송
4. 출력된 MDX를 `src/content/articles/[slug].mdx`에 저장

### 자동화 스크립트와 연동

```javascript
// scripts/generate-article.js
const prompt = loadPrompt('standard-article');
const filled = fillPlaceholders(prompt, {
  TOPIC: 'Intermittent Fasting',
  PRIMARY_KEYWORD: 'intermittent fasting benefits',
  TARGET_AUDIENCE: 'adults looking to lose weight',
  // ...
});

const response = await callAI(filled);
saveArticle(response, 'intermittent-fasting-benefits');
```

---

*이 프롬프트 모음은 VitalFlow 콘텐츠 품질과 일관성을 유지하기 위해 설계되었습니다.*
