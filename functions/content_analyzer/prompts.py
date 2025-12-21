"""
SPEC-003: Claude 분석 프롬프트

A/B 테스트 결과를 분석하고 패턴을 추출하는 프롬프트
"""

ANALYSIS_SYSTEM_PROMPT = """
당신은 건강 콘텐츠 A/B 테스트 분석 전문가입니다.

## 역할
1. A/B 테스트 결과를 분석하여 승패 원인을 파악합니다.
2. 재사용 가능한 콘텐츠 패턴을 추출합니다.
3. 향후 콘텐츠 생성에 적용할 구체적 지침을 제안합니다.

## 분석 원칙
- 데이터 기반 판단 (추측 금지)
- 구체적이고 실행 가능한 패턴 도출
- 한국어 건강 콘텐츠 맥락 고려
- 독자 심리와 행동 패턴 분석

## 패턴 카테고리
- intro: 도입부/훅 (첫 문장, 질문형 등)
- title: 제목/메타 (SEO, 클릭 유도)
- structure: 본문 구조 (결론 먼저, 점진적 전개 등)
- faq: FAQ/결론 (Q&A 개수, 요약 방식)
- visual: 시각 요소 (이미지, 인포그래픽)
- meta: 메타 정보 (카테고리, 태그)
- other: 기타
"""

ANALYSIS_USER_PROMPT = """
## A/B 테스트 결과 분석

### 테스트 정보
- 테스트명: {test_name}
- 가설: {hypothesis}
- 테스트 영역: {target_section}

### A 버전 (Control)
**제목**: {a_title}

**도입부**:
{a_intro}

**구조**:
- 섹션 수: {a_section_count}개
- FAQ 개수: {a_faq_count}개

**성과**:
- 평균 체류시간: {a_avg_time}초
- 스크롤 75% 도달률: {a_scroll_75}%
- 이탈률: {a_bounce_rate}%
- Engagement Score: {a_engagement_score}

---

### B 버전 (Variant)
**제목**: {b_title}

**도입부**:
{b_intro}

**구조**:
- 섹션 수: {b_section_count}개
- FAQ 개수: {b_faq_count}개

**성과**:
- 평균 체류시간: {b_avg_time}초
- 스크롤 75% 도달률: {b_scroll_75}%
- 이탈률: {b_bounce_rate}%
- Engagement Score: {b_engagement_score}

---

### 통계 결과
- **승자**: {winner}
- **p-value**: {p_value}
- **Lift**: {lift}%

---

## 분석 요청

다음 형식으로 분석 결과를 JSON으로 출력하세요.
JSON 외의 텍스트는 포함하지 마세요.

```json
{{
  "summary": "분석 요약 (1-2문장, 핵심 인사이트)",
  "win_reason": "승리 원인 분석 (구체적, 데이터 기반)",
  "patterns": [
    {{
      "name": "패턴 이름 (예: 질문형 도입부)",
      "category": "intro|title|structure|faq|visual|meta|other",
      "description": "패턴 설명 (왜 효과적인지)",
      "prompt_instruction": "글 생성 시 적용할 구체적 지침"
    }}
  ],
  "next_hypotheses": [
    {{
      "hypothesis": "다음 테스트 가설",
      "target_section": "테스트할 영역",
      "expected_lift": 10,
      "priority": "high|medium|low"
    }}
  ],
  "recommendations": [
    "즉시 적용 가능한 개선 사항 1",
    "즉시 적용 가능한 개선 사항 2"
  ]
}}
```
"""


def format_analysis_prompt(
    test_name: str,
    hypothesis: str,
    target_section: str,
    article_a: dict,
    article_b: dict,
    metrics_a: dict,
    metrics_b: dict,
    winner: str,
    p_value: float,
    lift: float
) -> str:
    """
    분석 프롬프트 포맷팅
    """
    # A 버전 정보 추출
    a_sections = article_a.get("sections", [])
    a_intro = ""
    a_faq_count = 0

    for section in a_sections:
        if section.get("type") == "intro":
            a_intro = section.get("content", "")[:500]
        if section.get("type") == "faq":
            a_faq_count = len(section.get("items", []))

    # B 버전 정보 추출
    b_sections = article_b.get("sections", [])
    b_intro = ""
    b_faq_count = 0

    for section in b_sections:
        if section.get("type") == "intro":
            b_intro = section.get("content", "")[:500]
        if section.get("type") == "faq":
            b_faq_count = len(section.get("items", []))

    return ANALYSIS_USER_PROMPT.format(
        test_name=test_name,
        hypothesis=hypothesis,
        target_section=target_section or "전체",
        a_title=article_a.get("title", ""),
        a_intro=a_intro or "(도입부 없음)",
        a_section_count=len(a_sections),
        a_faq_count=a_faq_count,
        a_avg_time=metrics_a.get("avg_time_on_page", 0),
        a_scroll_75=round(metrics_a.get("scroll_75_rate", 0), 1),
        a_bounce_rate=round(metrics_a.get("bounce_rate", 0) * 100, 1),
        a_engagement_score=round(metrics_a.get("engagement_score", 0), 2),
        b_title=article_b.get("title", ""),
        b_intro=b_intro or "(도입부 없음)",
        b_section_count=len(b_sections),
        b_faq_count=b_faq_count,
        b_avg_time=metrics_b.get("avg_time_on_page", 0),
        b_scroll_75=round(metrics_b.get("scroll_75_rate", 0), 1),
        b_bounce_rate=round(metrics_b.get("bounce_rate", 0) * 100, 1),
        b_engagement_score=round(metrics_b.get("engagement_score", 0), 2),
        winner=winner,
        p_value=p_value,
        lift=round(lift, 2),
    )
