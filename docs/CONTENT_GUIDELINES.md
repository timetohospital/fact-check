# VitalFlow 콘텐츠 생성 가이드라인

> SEO, AEO, 벡터 검색, 리랭킹 최적화를 위한 AI 콘텐츠 생성 전략

---

## 1. 콘텐츠 구조 원칙

### 1.1 EEAT 신호 강화 (Experience, Expertise, Authoritativeness, Trustworthiness)

```yaml
# 모든 아티클의 frontmatter에 필수 포함
author: "Dr. Sarah Kim, MD"           # 실제 전문가 또는 가상 전문가 프로필
medicalReviewer: "Dr. James Park, PhD" # 검토자 정보
reviewedAt: "2025-01-15"              # 검토 날짜
sources:                               # 신뢰할 수 있는 출처 3개 이상
  - "https://pubmed.ncbi.nlm.nih.gov/..."
  - "https://www.who.int/..."
  - "https://www.mayoclinic.org/..."
```

### 1.2 의미적 구조화 (Semantic Structure)

```markdown
# [Primary Keyword] - [Benefit/Outcome]
<!-- H1: 검색 의도 + 가치 제안 -->

## What is [Topic]?
<!-- 정의 섹션: AI 요약에 자주 인용됨 -->

## Key Benefits of [Topic]
<!-- 리스트 형태: Featured Snippet 최적화 -->

## How [Topic] Works
<!-- 설명 섹션: 벡터 검색 시 컨텍스트 제공 -->

## [Topic] vs [Alternative]
<!-- 비교 섹션: 검색 의도 다양화 -->

## Frequently Asked Questions
<!-- FAQ: AEO + People Also Ask 최적화 -->

## The Bottom Line
<!-- 결론: AI 요약 시 핵심 인용 -->
```

---

## 2. AEO (Answer Engine Optimization) 전략

### 2.1 직접 답변 패턴

AI 검색 엔진(ChatGPT, Perplexity, Google AI Overview)은 **명확하고 직접적인 답변**을 선호합니다.

**권장 패턴:**
```markdown
## What is intermittent fasting?

**Intermittent fasting is an eating pattern that cycles between periods
of fasting and eating.** Unlike traditional diets that focus on *what*
you eat, intermittent fasting focuses on *when* you eat.

The most popular methods include:
- **16/8 method**: Fast for 16 hours, eat within an 8-hour window
- **5:2 diet**: Eat normally 5 days, restrict calories 2 days
- **Eat-Stop-Eat**: 24-hour fasts once or twice per week
```

**핵심 원칙:**
1. 첫 문장에 핵심 정의 (볼드 처리)
2. 두 번째 문장에 차별화 포인트
3. 구체적인 예시/방법 리스트

### 2.2 질문-답변 구조화

```markdown
## How much water should I drink daily?

**Most adults need about 8 glasses (64 ounces or 2 liters) of water
per day**, though individual needs vary based on activity level,
climate, and health conditions.

| Factor | Adjustment |
|--------|------------|
| Exercise | +16-24 oz per hour of activity |
| Hot climate | +16-32 oz daily |
| Pregnancy | +10 oz daily |
| Breastfeeding | +32 oz daily |
```

### 2.3 "People Also Ask" 최적화

각 아티클에 관련 질문 5-7개를 FAQ 섹션으로 포함:

```markdown
## Frequently Asked Questions

### Is intermittent fasting safe for everyone?
Intermittent fasting is generally safe for healthy adults. However,
it's not recommended for pregnant women, people with eating disorders,
or those with certain medical conditions. Always consult your doctor
before starting any fasting regimen.

### Can I drink coffee while fasting?
Yes, black coffee is allowed during fasting periods. It contains
minimal calories and may even enhance some benefits of fasting.
Avoid adding sugar, milk, or cream as these break your fast.
```

---

## 3. 벡터 검색 최적화

### 3.1 의미적 밀도 (Semantic Density)

벡터 검색은 텍스트의 **의미적 유사성**을 기반으로 작동합니다.

**최적화 전략:**

```markdown
<!-- 나쁜 예: 의미가 희박함 -->
This is really good for you. Many people like it. It can help with things.

<!-- 좋은 예: 의미적으로 풍부함 -->
Omega-3 fatty acids reduce inflammation, lower blood triglycerides,
and support brain health. Studies show EPA and DHA—the primary omega-3s
in fish oil—decrease cardiovascular disease risk by 25%.
```

### 3.2 엔티티 명확화

```markdown
<!-- 모호한 참조 피하기 -->
❌ "It helps with this condition and improves that."

<!-- 명확한 엔티티 사용 -->
✅ "Vitamin D supplementation helps prevent osteoporosis and improves
calcium absorption in the intestines."
```

### 3.3 청크 최적화 (Chunk-Friendly Writing)

RAG(Retrieval-Augmented Generation) 시스템은 문서를 청크로 분할합니다.
각 섹션이 **독립적으로 의미를 가지도록** 작성:

```markdown
## Benefits of Green Tea for Weight Loss

Green tea contains catechins and caffeine, compounds that boost
metabolism and increase fat burning. Research shows that green tea
extract can increase calorie burning by 4% and fat oxidation by 17%.

The most potent catechin in green tea is EGCG (epigallocatechin gallate).
EGCG inhibits an enzyme that breaks down norepinephrine, allowing this
fat-burning hormone to remain active longer in your body.

<!-- 각 단락이 독립적으로 검색 가능한 완전한 정보 단위 -->
```

### 3.4 동의어 및 관련어 포함

벡터 검색은 유사한 의미의 단어를 연결합니다:

```markdown
## Understanding Hypertension (High Blood Pressure)

High blood pressure, medically known as **hypertension**, occurs when
the force of blood against artery walls is consistently too high.
This cardiovascular condition affects nearly half of American adults
and is a leading risk factor for heart disease and stroke.

<!-- "high blood pressure", "hypertension", "cardiovascular condition",
"heart disease", "stroke" 등 관련 용어 자연스럽게 포함 -->
```

---

## 4. 리랭킹 최적화

### 4.1 검색 의도 매칭

검색 쿼리의 의도(Intent)와 콘텐츠가 정확히 일치해야 합니다:

| 검색 의도 | 콘텐츠 유형 | 예시 |
|-----------|-------------|------|
| Informational | 가이드, 설명 | "what is keto diet" |
| Navigational | 브랜드/제품 페이지 | "Mayo Clinic diabetes" |
| Transactional | 제품 리뷰, 비교 | "best vitamin D supplements" |
| Commercial | 구매 가이드 | "vitamin D supplement buying guide" |

### 4.2 콘텐츠 신선도 (Freshness)

```yaml
# frontmatter에 날짜 정보 필수
publishedAt: "2025-01-10"
updatedAt: "2025-01-15"   # 업데이트 시 반드시 갱신
```

콘텐츠 내에도 시의성 표시:
```markdown
*Last updated: January 2025*

According to the latest 2024-2025 Dietary Guidelines for Americans...
```

### 4.3 포괄성 점수 (Comprehensiveness)

리랭커는 **쿼리의 모든 측면을 다루는 콘텐츠**를 선호합니다:

```markdown
# Complete Guide to Vitamin D

## What is Vitamin D?
## Types of Vitamin D (D2 vs D3)
## Health Benefits
## Recommended Daily Intake
## Best Food Sources
## Supplementation Guidelines
## Deficiency Symptoms
## Risk Factors for Deficiency
## Testing and Diagnosis
## Potential Side Effects
## Drug Interactions
## Special Considerations (Pregnancy, Children, Elderly)
## Frequently Asked Questions
## References
```

### 4.4 사용자 참여 신호

```markdown
<!-- 인터랙티브 요소 제안 -->
**Quick Assessment:** Do you get enough Vitamin D?
- [ ] I spend 15+ minutes in sunlight daily
- [ ] I eat fatty fish 2-3 times per week
- [ ] I take a vitamin D supplement
- [ ] I consume fortified foods regularly

*If you checked fewer than 2 boxes, you may be at risk for deficiency.*
```

---

## 5. MDX 프론트매터 템플릿

### 5.1 표준 아티클 템플릿

```yaml
---
title: "10 Science-Based Benefits of [Topic]: A Complete Guide"
description: "Discover the proven health benefits of [topic]. Learn how [topic] can [primary benefit], [secondary benefit], and more, backed by scientific research."
author: "Dr. [Name], [Credentials]"
publishedAt: "2025-01-15"
updatedAt: "2025-01-15"
category: "nutrition"  # nutrition, fitness, mental-health, wellness
tags:
  - "[primary-topic]"
  - "[related-topic-1]"
  - "[related-topic-2]"
  - "[symptom-or-condition]"
  - "[demographic-if-relevant]"
image: "/images/articles/[slug]-hero.jpg"
imageAlt: "[Descriptive alt text for accessibility and SEO]"

# SEO 메타 (선택사항 - 자동 생성과 다를 경우)
metaTitle: "[Keyword] Benefits: [Number] Proven Effects [Year]"
metaDescription: "[Action verb] the [number] science-backed benefits of [topic]. [Specific benefit] and [specific benefit]. Updated [Month Year]."

# EEAT 신호
medicalReviewer: "Dr. [Name], [Specialty]"
reviewedAt: "2025-01-14"
sources:
  - "Author, A. (Year). Title. Journal. DOI/URL"
  - "Organization. (Year). Report Title. URL"
  - "Research Institution. Study findings. URL"

# AI/벡터 검색 최적화
keywords:
  - "[exact-match-keyword]"
  - "[semantic-variation-1]"
  - "[semantic-variation-2]"
  - "[long-tail-keyword]"
  - "[question-format-keyword]"

# 구조화 데이터 힌트
articleType: "MedicalWebPage"  # Article, MedicalWebPage, HowTo, FAQ
speakable: true  # Google 음성 검색 최적화
---
```

### 5.2 비교 아티클 템플릿

```yaml
---
title: "[Option A] vs [Option B]: Which is Better for [Goal]?"
description: "Compare [A] and [B] for [use case]. Learn the key differences, benefits, side effects, and which one is right for you."
# ... 나머지 동일
articleType: "ComparisonArticle"
comparisonItems:
  - name: "[Option A]"
    pros: ["pro1", "pro2"]
    cons: ["con1", "con2"]
  - name: "[Option B]"
    pros: ["pro1", "pro2"]
    cons: ["con1", "con2"]
---
```

### 5.3 How-To 아티클 템플릿

```yaml
---
title: "How to [Action]: [Number] Steps to [Desired Outcome]"
description: "Learn how to [action] with our step-by-step guide. [Benefit statement] in [timeframe]."
# ... 나머지 동일
articleType: "HowTo"
estimatedTime: "PT15M"  # ISO 8601 duration
difficulty: "Beginner"  # Beginner, Intermediate, Advanced
tools: ["tool1", "tool2"]  # 필요한 도구/재료
---
```

---

## 6. 콘텐츠 품질 체크리스트

### 발행 전 검증

```markdown
## SEO 체크리스트
- [ ] 타이틀에 주요 키워드 포함 (앞쪽 배치)
- [ ] 메타 설명 150-160자, CTA 포함
- [ ] H1 하나만 사용, H2-H4 계층 구조 준수
- [ ] 이미지 alt 텍스트 작성
- [ ] 내부 링크 3개 이상
- [ ] 외부 권위 사이트 링크 2개 이상

## AEO 체크리스트
- [ ] 첫 단락에 핵심 답변 (50단어 이내)
- [ ] FAQ 섹션 5-7개 질문
- [ ] 정의/설명 문장 볼드 처리
- [ ] 테이블/리스트로 정보 구조화
- [ ] "The Bottom Line" 요약 섹션

## 벡터 검색 체크리스트
- [ ] 각 섹션이 독립적으로 의미 완결
- [ ] 동의어/관련어 자연스럽게 포함
- [ ] 모호한 대명사 최소화
- [ ] 전문 용어 + 일반 용어 병기
- [ ] 숫자/통계 구체적으로 명시

## EEAT 체크리스트
- [ ] 저자 정보 완전히 기재
- [ ] 의료 검토자 정보 (건강 콘텐츠)
- [ ] 출처 3개 이상 (학술/정부/의료기관)
- [ ] 발행일/업데이트일 명시
- [ ] 의료 면책조항 포함
```

---

## 7. 콘텐츠 생성 워크플로우

### 7.1 AI 프롬프트 템플릿

```markdown
## 콘텐츠 생성 프롬프트

당신은 VitalFlow의 건강 콘텐츠 작성자입니다.

**주제:** [TOPIC]
**타겟 키워드:** [PRIMARY_KEYWORD]
**검색 의도:** [Informational/Commercial/etc.]
**타겟 독자:** [AUDIENCE]
**단어 수:** [1500-2500]

다음 구조로 작성해주세요:

1. **도입부** (100-150단어)
   - 첫 문장: 주제 정의 (볼드)
   - 왜 중요한지 설명
   - 아티클에서 다룰 내용 미리보기

2. **본문 섹션** (각 200-300단어)
   - H2: What is [Topic]?
   - H2: [Number] Key Benefits
   - H2: How to [Action/Use]
   - H2: Potential Risks/Side Effects
   - H2: [Topic] vs [Alternative]

3. **FAQ 섹션** (5-7개 질문)
   - 각 답변 50-100단어
   - "People Also Ask" 스타일

4. **결론** (100-150단어)
   - 핵심 포인트 요약
   - 행동 촉구 (CTA)

**작성 규칙:**
- 전문 용어는 괄호 안에 일반 설명 추가
- 모든 주장에 통계/연구 인용
- 각 단락 첫 문장에 핵심 내용
- 능동태 사용, 2인칭(you) 직접 호칭
```

### 7.2 MDX 파일 생성 자동화

```bash
# 새 아티클 생성 스크립트 (예시)
npm run create-article -- \
  --title "10 Benefits of Green Tea" \
  --category "nutrition" \
  --author "Dr. Sarah Kim, MD" \
  --keywords "green tea, catechins, EGCG, weight loss"
```

---

## 8. 성과 측정

### 8.1 추적 지표

| 지표 | 목표 | 측정 도구 |
|------|------|-----------|
| 유기적 트래픽 | 월 10% 성장 | Google Analytics |
| 검색 노출 | 타겟 키워드 상위 10위 | Google Search Console |
| AI 인용 | Perplexity/ChatGPT 언급 | 수동 모니터링 |
| 체류 시간 | 3분 이상 | Google Analytics |
| 스크롤 깊이 | 75% 이상 | Hotjar/GA4 |
| Featured Snippet | 월 5개 이상 획득 | SEMrush/Ahrefs |

### 8.2 A/B 테스트 항목

- 타이틀 포맷 (숫자 vs 질문 vs How-to)
- 메타 설명 길이/스타일
- 콘텐츠 길이 (1500 vs 2500 vs 3500단어)
- FAQ 섹션 위치 (중간 vs 하단)
- CTA 문구 및 배치

---

## 9. 카테고리별 특화 전략

### Nutrition (영양)
- 과학적 근거 필수 (PubMed 인용)
- 영양소 함량 테이블 포함
- "하루 권장량" 정보 명시
- 음식 사진/인포그래픽

### Fitness (운동)
- 단계별 가이드 (How-To 스키마)
- 운동 시간/세트/반복 횟수 명시
- 초급/중급/고급 난이도 구분
- 부상 예방 주의사항

### Mental Health (정신건강)
- 공감적 톤 유지
- 전문 상담 권유 문구 필수
- 위기 상황 핫라인 정보
- 익명성/프라이버시 강조

### Wellness (웰니스)
- 라이프스타일 통합 접근
- 실행 가능한 팁 중심
- 개인화 가능성 언급
- 장기적 관점 강조

---

## 10. 금지 사항

### 절대 하지 말 것

1. **의료 조언 제공**
   - "이 약을 복용하세요" ❌
   - "의사와 상담하세요" ✅

2. **근거 없는 주장**
   - "암을 치료합니다" ❌
   - "연구에 따르면 [출처]..." ✅

3. **과장된 표현**
   - "기적의", "100%", "완치" ❌
   - "도움이 될 수 있습니다" ✅

4. **표절/중복 콘텐츠**
   - 다른 사이트 복사 ❌
   - 고유한 관점 + 인용 ✅

5. **키워드 스터핑**
   - 부자연스러운 키워드 반복 ❌
   - 자연스러운 문맥 내 사용 ✅

---

## 부록: 샘플 아티클 구조

```markdown
---
title: "10 Science-Based Benefits of Omega-3 Fatty Acids"
description: "Discover the proven health benefits of omega-3s for heart, brain, and overall health. Learn optimal dosages, food sources, and supplement tips."
author: "Dr. Emily Chen, MD, PhD"
publishedAt: "2025-01-15"
category: "nutrition"
tags: ["omega-3", "fish oil", "EPA", "DHA", "heart health", "brain health"]
medicalReviewer: "Dr. Michael Park, Cardiologist"
reviewedAt: "2025-01-14"
sources:
  - "Mozaffarian D, Wu JH. (2011). Omega-3 fatty acids and cardiovascular disease. JACC."
  - "American Heart Association. Fish and Omega-3 Fatty Acids."
  - "National Institutes of Health. Omega-3 Fatty Acids Fact Sheet."
---

# 10 Science-Based Benefits of Omega-3 Fatty Acids

**Omega-3 fatty acids are essential fats that your body cannot produce on its own.** Found primarily in fatty fish, flaxseeds, and walnuts, these polyunsaturated fats play crucial roles in brain function, heart health, and inflammation reduction.

In this comprehensive guide, you'll learn:
- The proven health benefits of omega-3s
- How much you need daily
- The best food sources and supplements
- Potential side effects and interactions

## What Are Omega-3 Fatty Acids?

**Omega-3 fatty acids are a type of polyunsaturated fat essential for human health.** The three main types are:

| Type | Full Name | Primary Source |
|------|-----------|----------------|
| EPA | Eicosapentaenoic acid | Fatty fish |
| DHA | Docosahexaenoic acid | Fatty fish |
| ALA | Alpha-linolenic acid | Plant oils |

Your body can convert ALA to EPA and DHA, but the conversion rate is low (less than 15%). That's why consuming EPA and DHA directly through fish or supplements is recommended.

## 10 Proven Benefits of Omega-3s

### 1. Supports Heart Health

Omega-3s reduce triglycerides by 15-30%, lower blood pressure, and prevent arterial plaque buildup. The American Heart Association recommends eating fish twice weekly for cardiovascular protection.

### 2. Improves Brain Function

DHA comprises 40% of polyunsaturated fats in your brain. Studies link higher omega-3 intake to reduced cognitive decline and lower Alzheimer's risk.

[... 섹션 계속 ...]

## Frequently Asked Questions

### How much omega-3 should I take daily?

**Most health organizations recommend 250-500mg of combined EPA and DHA daily for healthy adults.** For specific conditions like high triglycerides, doses of 2-4 grams may be prescribed under medical supervision.

### Can I get enough omega-3 from plants alone?

While plant sources like flaxseed provide ALA, your body converts only 5-15% to EPA and DHA. Vegans should consider algae-based EPA/DHA supplements for optimal intake.

[... FAQ 계속 ...]

## The Bottom Line

**Omega-3 fatty acids are among the most well-researched nutrients, with proven benefits for heart, brain, and overall health.** Aim for two servings of fatty fish weekly, or consider a quality fish oil or algae supplement.

If you have a medical condition or take medications, consult your healthcare provider before starting omega-3 supplements.

---

*This article was medically reviewed by Dr. Michael Park, Cardiologist, on January 14, 2025.*

**Medical Disclaimer:** This content is for informational purposes only and should not replace professional medical advice. Always consult a qualified healthcare provider for diagnosis and treatment.
```

---

*Version: 1.0*
*Last Updated: January 2025*
*Author: VitalFlow Content Team*
