#!/usr/bin/env python3
"""
AI 기반 콘텐츠 성과 분석 및 A/B 테스트 생성

1. 성과 하위 20% 글 추출
2. AI로 원인 분석 + 가설 생성
3. B 버전 자동 생성
4. A/B 테스트 등록

실행: python scripts/analyze_and_create_ab.py
스케줄: 3일마다 (GA 수집 직후)
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional
import psycopg2
from openai import OpenAI

# ============================================
# 설정
# ============================================

DB_CONFIG = {
    "host": "34.64.111.186",
    "port": 5432,
    "user": "admin",
    "password": "galddae-password",
    "database": "factcheck_db"
}

# OpenAI 설정
OPENAI_MODEL = "gpt-4o"

# 분석 설정
UNDERPERFORMING_PERCENTILE = 20  # 하위 20%
MAX_AB_TESTS_PER_RUN = 3  # 한 번에 최대 3개 테스트 생성


def get_db_connection():
    """DB 연결"""
    return psycopg2.connect(**DB_CONFIG)


def get_openai_client():
    """OpenAI 클라이언트"""
    return OpenAI()


def get_underperforming_articles(cursor) -> list:
    """
    성과 하위 20% 글 추출

    기준: 최근 7일 평균 engagement_score
    """
    cursor.execute("""
        WITH article_stats AS (
            SELECT
                article_slug,
                AVG(engagement_score) as avg_engagement,
                AVG(avg_time_on_page) as avg_time,
                AVG(bounce_rate) as avg_bounce,
                SUM(pageviews) as total_views
            FROM article_metrics
            WHERE date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY article_slug
            HAVING SUM(pageviews) >= 10  -- 최소 10 PV 이상
        ),
        percentile AS (
            SELECT PERCENTILE_CONT(0.2) WITHIN GROUP (ORDER BY avg_engagement) as p20
            FROM article_stats
        )
        SELECT
            s.article_slug,
            s.avg_engagement,
            s.avg_time,
            s.avg_bounce,
            s.total_views,
            a.title,
            a.sections,
            a.category
        FROM article_stats s
        JOIN articles a ON s.article_slug = a.slug AND a.version = 'A'
        CROSS JOIN percentile p
        WHERE s.avg_engagement < p.p20
        ORDER BY s.avg_engagement ASC
        LIMIT %s
    """, (MAX_AB_TESTS_PER_RUN,))

    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_top_performing_articles(cursor) -> list:
    """성과 상위 20% 글 추출 (비교 참고용)"""
    cursor.execute("""
        WITH article_stats AS (
            SELECT
                article_slug,
                AVG(engagement_score) as avg_engagement,
                AVG(avg_time_on_page) as avg_time,
                AVG(bounce_rate) as avg_bounce
            FROM article_metrics
            WHERE date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY article_slug
            HAVING SUM(pageviews) >= 10
        ),
        percentile AS (
            SELECT PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY avg_engagement) as p80
            FROM article_stats
        )
        SELECT
            s.article_slug,
            s.avg_engagement,
            a.sections
        FROM article_stats s
        JOIN articles a ON s.article_slug = a.slug AND a.version = 'A'
        CROSS JOIN percentile p
        WHERE s.avg_engagement >= p.p80
        ORDER BY s.avg_engagement DESC
        LIMIT 3
    """)

    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def analyze_article(client: OpenAI, article: dict, top_articles: list) -> dict:
    """
    AI로 글 분석 및 개선 가설 생성

    Returns:
        {
            "problems": [...],
            "hypothesis": {...},
            "improved_sections": {...}
        }
    """
    sections = article.get("sections", [])
    if isinstance(sections, str):
        sections = json.loads(sections)

    top_sections_summary = ""
    for top in top_articles[:2]:
        top_sec = top.get("sections", [])
        if isinstance(top_sec, str):
            top_sec = json.loads(top_sec)
        if top_sec and len(top_sec) > 0:
            intro = next((s for s in top_sec if s.get("type") == "intro"), top_sec[0])
            top_sections_summary += f"\n- 인기글 ({top['article_slug']}): {intro.get('content', '')[:200]}..."

    prompt = f"""당신은 콘텐츠 성과 분석 전문가입니다.

## 분석 대상 글
- 제목: {article.get('title', 'N/A')}
- 카테고리: {article.get('category', 'N/A')}
- 평균 체류시간: {article.get('avg_time', 0):.1f}초
- 이탈률: {article.get('avg_bounce', 0):.1f}%
- 참여 점수: {article.get('avg_engagement', 0):.1f}/100 (하위 20%)

## 현재 본문 구조
{json.dumps(sections, ensure_ascii=False, indent=2)}

## 참고: 성과 좋은 글의 도입부
{top_sections_summary}

## 분석 요청

1. **문제점 진단**: 성과가 낮은 이유를 3가지 이내로 분석하세요.
   - intro 섹션이 너무 길거나 지루한가?
   - 핵심 결론이 늦게 나오는가?
   - 구조가 산만한가?

2. **개선 가설**: 가장 효과적일 것으로 예상되는 개선안 1개를 제안하세요.
   - 어떤 섹션을 어떻게 수정할지
   - 예상 개선 효과 (체류시간 증가율 %)

3. **B버전 섹션 생성**: 가설에 따라 수정된 섹션을 JSON으로 작성하세요.
   - 수정 대상 섹션만 포함
   - 원본과 동일한 JSON 구조 유지

## 출력 형식 (JSON)
{{
    "problems": [
        {{"section": "intro", "issue": "도입부가 너무 장황함", "severity": "high"}},
        ...
    ],
    "hypothesis": {{
        "target_section": "intro",
        "description": "도입부를 질문형으로 시작하고 핵심 결론을 첫 문장에 배치",
        "expected_lift": 15,
        "confidence": "medium"
    }},
    "improved_sections": [
        {{
            "type": "intro",
            "heading": null,
            "content": "새로운 도입부 내용..."
        }}
    ]
}}
"""

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "당신은 콘텐츠 최적화 전문가입니다. JSON 형식으로만 응답하세요."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.7
    )

    return json.loads(response.choices[0].message.content)


def create_b_version(cursor, article: dict, analysis: dict) -> Optional[str]:
    """
    B 버전 글 생성

    Returns:
        article_id: 생성된 B 버전 ID
    """
    original_sections = article.get("sections", [])
    if isinstance(original_sections, str):
        original_sections = json.loads(original_sections)

    improved_sections = analysis.get("improved_sections", [])

    # 원본 섹션에 개선된 섹션 병합
    new_sections = []
    improved_types = {s["type"] for s in improved_sections}

    for section in original_sections:
        if section["type"] in improved_types:
            # 개선된 버전으로 교체
            improved = next(s for s in improved_sections if s["type"] == section["type"])
            new_sections.append(improved)
        else:
            new_sections.append(section)

    # B 버전 INSERT
    article_id = str(uuid.uuid4())

    cursor.execute("""
        INSERT INTO articles (
            id, slug, version, is_active,
            title, description, author, category, tags,
            meta_title, meta_description,
            sections,
            sources, medical_reviewer, reviewed_at,
            image_url, image_alt,
            status, ai_model, prompt_version
        )
        SELECT
            %s, slug, 'B', true,
            title, description, author, category, tags,
            meta_title, meta_description,
            %s,
            sources, medical_reviewer, reviewed_at,
            image_url, image_alt,
            'published', %s, 'ab-test-v1'
        FROM articles
        WHERE slug = %s AND version = 'A'
    """, (
        article_id,
        json.dumps(new_sections, ensure_ascii=False),
        OPENAI_MODEL,
        article["article_slug"]
    ))

    return article_id


def create_ab_test(cursor, article: dict, analysis: dict, b_version_id: str) -> str:
    """A/B 테스트 등록"""
    test_id = str(uuid.uuid4())
    hypothesis = analysis.get("hypothesis", {})

    cursor.execute("""
        INSERT INTO ab_tests (
            id, article_slug,
            name, hypothesis, target_section,
            control_version, variant_version, traffic_split,
            primary_metric, expected_lift,
            status, started_at
        ) VALUES (
            %s, %s,
            %s, %s, %s,
            'A', 'B', 0.5,
            'avg_time_on_page', %s,
            'running', NOW()
        )
    """, (
        test_id,
        article["article_slug"],
        f"{article['article_slug']} 개선 테스트",
        hypothesis.get("description", ""),
        hypothesis.get("target_section", "intro"),
        hypothesis.get("expected_lift", 10)
    ))

    return test_id


def save_analysis(cursor, article: dict, analysis: dict):
    """분석 결과 저장"""
    cursor.execute("""
        INSERT INTO content_analysis (
            article_slug, article_version,
            trigger_type,
            metrics_snapshot,
            problems, hypotheses,
            recommended_action,
            ai_model, analysis_prompt_version
        ) VALUES (
            %s, 'A',
            'scheduled',
            %s,
            %s, %s,
            'run_ab_test',
            %s, 'v1'
        )
    """, (
        article["article_slug"],
        json.dumps({
            "avg_time": article.get("avg_time", 0),
            "avg_bounce": article.get("avg_bounce", 0),
            "avg_engagement": article.get("avg_engagement", 0)
        }),
        json.dumps(analysis.get("problems", []), ensure_ascii=False),
        json.dumps([analysis.get("hypothesis", {})], ensure_ascii=False),
        OPENAI_MODEL
    ))


def main():
    """메인 실행"""
    print("🚀 AI 성과 분석 및 A/B 테스트 생성 시작")
    print(f"📊 분석 대상: 하위 {UNDERPERFORMING_PERCENTILE}% 글")
    print(f"🔬 최대 테스트 수: {MAX_AB_TESTS_PER_RUN}개")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        openai_client = get_openai_client()
        print("✅ OpenAI 연결 성공")

        # 성과 하위 글 추출
        print("\n📉 성과 하위 글 추출 중...")
        underperforming = get_underperforming_articles(cursor)

        if not underperforming:
            print("⚠️  분석할 글이 없습니다. (데이터 부족 또는 모든 글이 양호)")
            return

        print(f"   {len(underperforming)}개 글 발견")

        # 참고용 상위 글
        top_articles = get_top_performing_articles(cursor)
        print(f"   참고: 상위 글 {len(top_articles)}개")

        # 이미 진행 중인 테스트 확인
        cursor.execute("""
            SELECT article_slug FROM ab_tests WHERE status = 'running'
        """)
        running_tests = {row[0] for row in cursor.fetchall()}

        created_tests = 0

        for article in underperforming:
            slug = article["article_slug"]

            # 이미 테스트 중이면 스킵
            if slug in running_tests:
                print(f"\n⏭️  {slug} (이미 테스트 진행 중)")
                continue

            print(f"\n🔍 분석 중: {slug}")
            print(f"   점수: {article.get('avg_engagement', 0):.1f} | 체류: {article.get('avg_time', 0):.1f}초")

            # AI 분석
            analysis = analyze_article(openai_client, article, top_articles)

            problems = analysis.get("problems", [])
            hypothesis = analysis.get("hypothesis", {})

            print(f"   문제점: {len(problems)}개")
            for p in problems[:2]:
                print(f"      - {p.get('section')}: {p.get('issue')}")

            print(f"   가설: {hypothesis.get('description', 'N/A')[:50]}...")
            print(f"   예상 개선: +{hypothesis.get('expected_lift', 0)}%")

            # B 버전 생성
            print("   📝 B 버전 생성 중...")
            b_version_id = create_b_version(cursor, article, analysis)

            # A/B 테스트 등록
            test_id = create_ab_test(cursor, article, analysis, b_version_id)

            # 분석 결과 저장
            save_analysis(cursor, article, analysis)

            conn.commit()

            print(f"   ✅ A/B 테스트 생성 완료 (ID: {test_id[:8]}...)")
            created_tests += 1

        print("\n" + "=" * 50)
        print(f"✅ 총 {created_tests}개 A/B 테스트 생성됨")

        # 현재 진행 중인 테스트 요약
        cursor.execute("""
            SELECT article_slug, hypothesis, started_at
            FROM ab_tests
            WHERE status = 'running'
            ORDER BY started_at DESC
        """)

        running = cursor.fetchall()
        if running:
            print(f"\n📊 현재 진행 중인 테스트: {len(running)}개")
            for r in running[:5]:
                print(f"   - {r[0]}: {r[1][:40]}...")

        print("\n🎉 분석 및 A/B 테스트 생성 완료!")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
