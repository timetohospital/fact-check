"""
SPEC-003: Content Analyzer Cloud Function

A/B 테스트 완료 후 Claude를 사용하여 분석하고 패턴을 추출합니다.
"""

import os
import json
import re
from typing import Dict, List, Optional, Any
from datetime import datetime

import functions_framework
import anthropic
import pg8000

from prompts import ANALYSIS_SYSTEM_PROMPT, format_analysis_prompt


# ============================================
# 설정
# ============================================

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
# 모델 선택: claude-sonnet-4-20250514 (비용 효율) 또는 claude-opus-4-5-20251101 (최고 품질)
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-20250514")

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "34.64.111.186"),
    "port": int(os.environ.get("DB_PORT", "5432")),
    "user": os.environ.get("DB_USER", "admin"),
    "password": os.environ.get("DB_PASSWORD", "galddae-password"),
    "database": os.environ.get("DB_NAME", "factcheck_db"),
}


# ============================================
# 데이터베이스 연결
# ============================================

def get_db_connection():
    """PostgreSQL 연결"""
    return pg8000.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        database=DB_CONFIG["database"],
    )


# ============================================
# 데이터 조회
# ============================================

def get_unanalyzed_completed_tests(conn) -> List[Dict]:
    """
    분석되지 않은 완료된 A/B 테스트 조회

    조건:
    - status = 'completed'
    - content_analysis에 해당 테스트의 분석 결과가 없음
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            t.id,
            t.article_slug,
            t.name,
            t.hypothesis,
            t.target_section,
            t.control_version,
            t.variant_version,
            t.winner_version,
            t.actual_lift,
            t.confidence_level
        FROM ab_tests t
        WHERE t.status = 'completed'
          AND t.winner_version IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM content_analysis ca
              WHERE ca.article_slug = t.article_slug
                AND ca.trigger_type = 'ab_test_complete'
                AND ca.analyzed_at > t.ended_at
          )
        ORDER BY t.ended_at DESC
        LIMIT 10
    """)

    tests = []
    for row in cursor.fetchall():
        tests.append({
            "id": str(row[0]),
            "article_slug": row[1],
            "name": row[2],
            "hypothesis": row[3],
            "target_section": row[4],
            "control_version": row[5],
            "variant_version": row[6],
            "winner_version": row[7],
            "actual_lift": float(row[8]) if row[8] else 0,
            "confidence_level": float(row[9]) if row[9] else 0,
        })

    return tests


def get_article_by_slug_version(conn, slug: str, version: str) -> Optional[Dict]:
    """글 조회 (slug + version)"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, slug, version, title, description, sections, tags
        FROM articles
        WHERE slug = %s AND version = %s AND is_active = true
        LIMIT 1
    """, (slug, version))

    row = cursor.fetchone()
    if row:
        return {
            "id": str(row[0]),
            "slug": row[1],
            "version": row[2],
            "title": row[3],
            "description": row[4],
            "sections": row[5] if row[5] else [],
            "tags": row[6] if row[6] else [],
        }
    return None


def get_version_metrics(conn, slug: str, version: str) -> Dict:
    """버전별 메트릭 조회 (최근 7일 평균)"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            AVG(avg_time_on_page) as avg_time,
            AVG(bounce_rate) as bounce_rate,
            AVG(scroll_75_pct::float / NULLIF(pageviews, 0)) as scroll_75_rate,
            AVG(engagement_score) as engagement_score,
            SUM(pageviews) as total_pageviews
        FROM article_metrics
        WHERE article_slug = %s
          AND article_version = %s
          AND date >= CURRENT_DATE - INTERVAL '7 days'
    """, (slug, version))

    row = cursor.fetchone()
    if row and row[0] is not None:
        return {
            "avg_time_on_page": float(row[0]) if row[0] else 0,
            "bounce_rate": float(row[1]) if row[1] else 0,
            "scroll_75_rate": float(row[2]) if row[2] else 0,
            "engagement_score": float(row[3]) if row[3] else 0,
            "total_pageviews": int(row[4]) if row[4] else 0,
        }

    return {
        "avg_time_on_page": 0,
        "bounce_rate": 0,
        "scroll_75_rate": 0,
        "engagement_score": 0,
        "total_pageviews": 0,
    }


# ============================================
# Claude 분석
# ============================================

def analyze_with_claude(
    test: Dict,
    article_a: Dict,
    article_b: Dict,
    metrics_a: Dict,
    metrics_b: Dict
) -> Dict:
    """
    Claude를 사용하여 A/B 테스트 분석

    Returns:
        Dict: 분석 결과 (patterns, recommendations 포함)
    """
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # 프롬프트 구성
    user_prompt = format_analysis_prompt(
        test_name=test["name"],
        hypothesis=test["hypothesis"],
        target_section=test.get("target_section"),
        article_a=article_a,
        article_b=article_b,
        metrics_a=metrics_a,
        metrics_b=metrics_b,
        winner=test["winner_version"],
        p_value=0.1,  # 실제 p-value 저장 필요
        lift=test["actual_lift"],
    )

    print(f"[Analyzer] Claude 분석 요청: {test['name']}")

    # Claude API 호출
    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2000,
        system=ANALYSIS_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": user_prompt}
        ]
    )

    response_text = response.content[0].text
    print(f"[Analyzer] Claude 응답 길이: {len(response_text)}")

    # JSON 파싱
    try:
        # JSON 블록 추출
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text)
        if json_match:
            analysis = json.loads(json_match.group(1))
        else:
            # 직접 JSON 파싱 시도
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                analysis = json.loads(json_match.group())
            else:
                raise ValueError("JSON 형식을 찾을 수 없습니다")
    except json.JSONDecodeError as e:
        print(f"[Analyzer] JSON 파싱 오류: {e}")
        print(f"[Analyzer] 원본 응답: {response_text[:500]}")
        raise ValueError(f"Claude 응답에서 JSON 추출 실패: {e}")

    return analysis


# ============================================
# 패턴 업데이트
# ============================================

def update_patterns(conn, analysis: Dict, test_id: str) -> int:
    """
    분석 결과에서 추출된 패턴을 DB에 저장/업데이트

    Returns:
        int: 업데이트된 패턴 수
    """
    cursor = conn.cursor()
    updated_count = 0

    for pattern in analysis.get("patterns", []):
        name = pattern.get("name", "").strip()
        category = pattern.get("category", "other").lower()

        if not name:
            continue

        # 카테고리 유효성 검사
        valid_categories = ["intro", "title", "structure", "faq", "visual", "meta", "other"]
        if category not in valid_categories:
            category = "other"

        # 기존 패턴 확인
        cursor.execute("""
            SELECT id, test_count, win_count, avg_lift
            FROM patterns
            WHERE name = %s AND category = %s
        """, (name, category))

        existing = cursor.fetchone()

        if existing:
            # 기존 패턴 업데이트
            pattern_id = str(existing[0])
            test_count = int(existing[1]) + 1
            win_count = int(existing[2]) + 1
            old_avg_lift = float(existing[3]) if existing[3] else 0
            new_avg_lift = (old_avg_lift * (test_count - 1) + analysis.get("lift", 0)) / test_count

            win_rate = (win_count / test_count) * 100
            confidence = determine_confidence_level(test_count, win_rate)

            cursor.execute("""
                UPDATE patterns
                SET
                    test_count = %s,
                    win_count = %s,
                    win_rate = %s,
                    avg_lift = %s,
                    confidence_level = %s,
                    source_tests = array_append(source_tests, %s::UUID),
                    updated_at = NOW()
                WHERE id = %s
            """, (test_count, win_count, win_rate, new_avg_lift, confidence, test_id, pattern_id))

            print(f"[Analyzer] 패턴 업데이트: {name} (test_count={test_count}, confidence={confidence})")
        else:
            # 새 패턴 생성
            cursor.execute("""
                INSERT INTO patterns (
                    name, category, description, prompt_instruction,
                    confidence_level, test_count, win_count, win_rate, avg_lift,
                    source_tests
                ) VALUES (
                    %s, %s, %s, %s,
                    'EXPERIMENTAL', 1, 1, 100.0, %s,
                    ARRAY[%s]::UUID[]
                )
            """, (
                name,
                category,
                pattern.get("description", ""),
                pattern.get("prompt_instruction", ""),
                analysis.get("lift", 0),
                test_id
            ))

            print(f"[Analyzer] 새 패턴 생성: {name} ({category})")

        updated_count += 1

    conn.commit()
    return updated_count


def determine_confidence_level(test_count: int, win_rate: float) -> str:
    """
    패턴 신뢰도 레벨 결정 (PLANNING_v2.md 기준)

    - EXPERIMENTAL: 1-2회 테스트
    - LOW: 3-5회, 승률 55%+
    - MEDIUM: 6-10회, 승률 60%+
    - HIGH: 11회+, 승률 65%+
    """
    if test_count >= 11 and win_rate >= 65:
        return "HIGH"
    elif test_count >= 6 and win_rate >= 60:
        return "MEDIUM"
    elif test_count >= 3 and win_rate >= 55:
        return "LOW"
    else:
        return "EXPERIMENTAL"


# ============================================
# 분석 결과 저장
# ============================================

def save_analysis_result(
    conn,
    article_slug: str,
    article_version: str,
    test_id: str,
    metrics_snapshot: Dict,
    analysis: Dict
):
    """분석 결과를 content_analysis 테이블에 저장"""
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO content_analysis (
            article_slug, article_version, trigger_type,
            metrics_snapshot, problems, hypotheses,
            recommended_action, ai_model, analysis_prompt_version
        ) VALUES (
            %s, %s, 'ab_test_complete',
            %s, %s, %s,
            'pattern_update', %s, 'v1.0'
        )
    """, (
        article_slug,
        article_version,
        json.dumps(metrics_snapshot),
        json.dumps(analysis.get("patterns", [])),
        json.dumps(analysis.get("next_hypotheses", [])),
        CLAUDE_MODEL,
    ))

    conn.commit()
    print(f"[Analyzer] 분석 결과 저장: {article_slug} ({article_version})")


# ============================================
# Cloud Function 엔트리포인트
# ============================================

@functions_framework.http
def analyze_completed_tests(request):
    """
    완료된 A/B 테스트를 분석하는 Cloud Function

    SPEC-002 완료 후 호출되거나, 수동으로 호출 가능
    """
    try:
        print("[Analyzer] 시작...")

        conn = get_db_connection()

        # 1. 미분석 완료 테스트 조회
        completed_tests = get_unanalyzed_completed_tests(conn)
        print(f"[Analyzer] {len(completed_tests)}개 테스트 분석 대기")

        if len(completed_tests) == 0:
            conn.close()
            return json.dumps({
                "status": "success",
                "message": "분석할 테스트 없음",
                "analyzed": []
            }), 200

        results = []

        for test in completed_tests:
            try:
                # 2. 글 내용 조회
                article_a = get_article_by_slug_version(conn, test["article_slug"], test["control_version"])
                article_b = get_article_by_slug_version(conn, test["article_slug"], test["variant_version"])

                if not article_a or not article_b:
                    print(f"[Analyzer] 글 없음: {test['article_slug']} (A={bool(article_a)}, B={bool(article_b)})")
                    continue

                # 3. 메트릭 조회
                metrics_a = get_version_metrics(conn, test["article_slug"], test["control_version"])
                metrics_b = get_version_metrics(conn, test["article_slug"], test["variant_version"])

                # 4. Claude 분석
                analysis = analyze_with_claude(test, article_a, article_b, metrics_a, metrics_b)

                # 5. 패턴 업데이트
                pattern_count = update_patterns(conn, analysis, test["id"])

                # 6. 분석 결과 저장
                save_analysis_result(
                    conn, test["article_slug"], test["winner_version"],
                    test["id"], metrics_a, analysis
                )

                results.append({
                    "test_id": test["id"],
                    "test_name": test["name"],
                    "winner": test["winner_version"],
                    "patterns_found": pattern_count,
                    "summary": analysis.get("summary", ""),
                })

            except Exception as e:
                print(f"[Analyzer] 테스트 분석 실패 ({test['name']}): {e}")
                results.append({
                    "test_id": test["id"],
                    "test_name": test["name"],
                    "error": str(e),
                })

        conn.close()

        return json.dumps({
            "status": "success",
            "analyzed_count": len([r for r in results if "error" not in r]),
            "error_count": len([r for r in results if "error" in r]),
            "results": results
        }), 200

    except Exception as e:
        import traceback
        error_msg = f"[Analyzer] 오류: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        return json.dumps({"status": "error", "message": str(e)}), 500


# ============================================
# 로컬 테스트
# ============================================

if __name__ == "__main__":
    from flask import Flask, request as flask_request

    app = Flask(__name__)

    @app.route("/", methods=["GET", "POST"])
    def index():
        return analyze_completed_tests(flask_request)

    print("로컬 서버 시작: http://localhost:8081")
    app.run(port=8081, debug=True)
