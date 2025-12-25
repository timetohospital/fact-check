"""
SPEC-006: 주제 패턴 실험 분석 프롬프트

다른 주제/카테고리를 비교하여 어떤 패턴이 가장 효과적인지 분석하는
Claude Code CLI용 프롬프트 템플릿
"""

import json
from typing import Dict, List, Any

# 주제 패턴 설명
TOPIC_PATTERNS_INFO = {
    "pattern_a": {
        "name_ko": "기존 상식 뒤집기",
        "description": "건강하다고 알려진 것이 사실은 해롭다는 반전",
        "example": "올리브유가 암을 퍼뜨린다?",
    },
    "pattern_b": {
        "name_ko": "좋아하는 것 + 두려움 연결",
        "description": "일상적으로 즐기는 것과 암/치매/사망 연결",
        "example": "매운 음식 좋아하면 치매 걸린다?",
    },
    "pattern_c": {
        "name_ko": "SNS 트렌드 팩트체크",
        "description": "틱톡/인스타에서 유행하는 건강법의 진위 검증",
        "example": "입 테이프 붙이고 자면 건강해진다?",
    },
    "pattern_d": {
        "name_ko": "오래된 상식 파괴",
        "description": "어릴 때부터 믿어온 건강 상식 뒤집기",
        "example": "하루 8잔 물 마셔야 한다? 70년 된 오해",
    },
    "pattern_e": {
        "name_ko": "구체적 수치 + 반전",
        "description": "충격적인 숫자로 시선 끌기",
        "example": "간헐적 단식, 심혈관 사망률 91% 증가",
    },
}


TOPIC_EXPERIMENT_SYSTEM_PROMPT = """당신은 건강 콘텐츠 분석 전문가입니다.

주제 패턴 실험 결과를 분석하여:
1. 어떤 주제 패턴이 가장 효과적인지 판단
2. 승리한 패턴이 왜 성공했는지 분석
3. 각 패턴의 강점과 약점 도출
4. 다음 실험에 대한 권장사항 제공

## 분석 원칙

1. **데이터 기반 분석**: 성과 지표(체류시간, 스크롤 깊이, 이탈률, 참여도)를 객관적으로 해석
2. **패턴별 특성 고려**: 각 주제 패턴의 고유한 특성을 이해하고 분석에 반영
3. **실행 가능한 인사이트**: 다음 콘텐츠 제작에 바로 적용 가능한 구체적 제안

## 주제 패턴 유형

- **pattern_a (기존 상식 뒤집기)**: "건강하다고 알려진 것이 해롭다" - 반전 충격
- **pattern_b (좋아하는 것 + 두려움)**: 일상의 즐거움에 공포 연결 - 감정 자극
- **pattern_c (SNS 트렌드)**: 틱톡/인스타 트렌드 팩트체크 - 호기심 유발
- **pattern_d (오래된 상식 파괴)**: 세대를 걸친 상식 뒤집기 - 충격과 공감
- **pattern_e (수치 + 반전)**: 구체적 숫자로 신뢰+충격 - 설득력

## 응답 형식

반드시 다음 JSON 형식으로 응답하세요:

```json
{
    "summary": "1-2문장 요약",
    "winner_insights": {
        "pattern": "pattern_x",
        "pattern_name_ko": "패턴 한국어 이름",
        "why_successful": "성공 이유 (50-100자)",
        "key_elements": ["성공 요소 1", "성공 요소 2"],
        "engagement_analysis": "참여도가 높았던 구체적 이유"
    },
    "pattern_analysis": {
        "pattern_a": {
            "rank": 1,
            "strengths": ["강점1", "강점2"],
            "weaknesses": ["약점1"],
            "improvement_suggestions": ["개선안1"]
        }
    },
    "recommendations": {
        "next_experiments": [
            {
                "hypothesis": "다음 실험 가설",
                "patterns_to_test": ["pattern_x", "pattern_y"],
                "rationale": "이유"
            }
        ],
        "content_guidelines": [
            "콘텐츠 제작 시 적용할 가이드라인"
        ]
    },
    "prompt_update_suggestions": [
        "글 생성 프롬프트 개선 제안"
    ]
}
```
"""


def format_topic_experiment_prompt(
    experiment_name: str,
    description: str,
    patterns_tested: List[str],
    articles_by_pattern: Dict[str, List[Dict]],
    rankings: Dict,
    primary_metric: str,
) -> str:
    """
    주제 패턴 실험 분석용 프롬프트 생성

    Args:
        experiment_name: 실험 이름
        description: 실험 설명
        patterns_tested: 테스트된 패턴 목록
        articles_by_pattern: 패턴별 글 목록
        rankings: 패턴별 순위 및 성과 데이터
        primary_metric: 주요 측정 지표

    Returns:
        str: 포맷팅된 분석 프롬프트
    """
    # 패턴 정보 준비
    patterns_info_text = []
    for pattern in patterns_tested:
        info = TOPIC_PATTERNS_INFO.get(pattern, {})
        patterns_info_text.append(
            f"- {pattern} ({info.get('name_ko', pattern)}): {info.get('description', '')}"
        )

    # 패턴별 글 요약
    pattern_articles_text = []
    for pattern, articles in articles_by_pattern.items():
        pattern_info = TOPIC_PATTERNS_INFO.get(pattern, {})
        pattern_name = pattern_info.get("name_ko", pattern)

        article_summaries = []
        for i, article in enumerate(articles, 1):
            metrics = article.get("metrics", {})
            article_summaries.append(
                f"  {i}. \"{article.get('title', '제목 없음')}\"\n"
                f"     - 체류시간: {metrics.get('avg_time_on_page', 0):.1f}초\n"
                f"     - 스크롤: {metrics.get('avg_scroll_depth', 0):.1f}%\n"
                f"     - 이탈률: {metrics.get('avg_bounce_rate', 0):.1f}%\n"
                f"     - 참여도: {metrics.get('engagement_score', 0):.1f}점"
            )

        pattern_articles_text.append(
            f"\n### {pattern} - {pattern_name}\n" +
            "\n".join(article_summaries)
        )

    # 순위 정보
    pattern_stats = rankings.get("pattern_stats", {})
    ranking_list = rankings.get("ranking", [])

    ranking_text = []
    for i, pattern in enumerate(ranking_list, 1):
        stats = pattern_stats.get(pattern, {})
        ranking_text.append(
            f"{i}위: {pattern} ({stats.get('pattern_name_ko', pattern)})\n"
            f"   - 평균 참여도: {stats.get('avg_engagement', 0):.1f}\n"
            f"   - 평균 체류시간: {stats.get('avg_time_on_page', 0):.1f}초\n"
            f"   - 평균 스크롤: {stats.get('avg_scroll_depth', 0):.1f}%\n"
            f"   - 총 PV: {stats.get('total_pageviews', 0)}"
        )

    prompt = f"""# 주제 패턴 실험 분석 요청

## 실험 개요
- **실험명**: {experiment_name}
- **설명**: {description or "없음"}
- **주요 지표**: {primary_metric}
- **테스트된 패턴**: {', '.join(patterns_tested)}

## 패턴 설명
{chr(10).join(patterns_info_text)}

## 패턴별 글 및 성과
{chr(10).join(pattern_articles_text)}

## 패턴별 순위 (집계 결과)
{chr(10).join(ranking_text)}

## 분석 요청

위 실험 결과를 바탕으로:

1. **승리 패턴 분석**: {rankings.get('winner', '없음')} 패턴이 왜 가장 높은 성과를 냈는지 분석
2. **패턴별 강약점**: 각 패턴의 강점과 개선점 도출
3. **다음 실험 제안**: 추가로 테스트해볼 가설 제안
4. **프롬프트 개선안**: 콘텐츠 생성 시 적용할 구체적 지침

반드시 위에서 지정한 JSON 형식으로 응답해주세요.
"""

    return prompt
