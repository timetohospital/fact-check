"""
GA4 데이터 수집 Cloud Function

3일마다 실행되어 GA4에서 글별 메트릭을 수집하고
A/B 테스트 결과를 평가합니다.

SPEC-002 구현
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import functions_framework

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest,
    DateRange,
    Dimension,
    Metric,
    FilterExpression,
    Filter,
)

import pg8000
from scipy import stats
import numpy as np


# ============================================
# 설정
# ============================================

GA4_PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "517111075")

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "34.64.111.186"),
    "port": int(os.environ.get("DB_PORT", "5432")),
    "user": os.environ.get("DB_USER", "admin"),
    "password": os.environ.get("DB_PASSWORD", "galddae-password"),
    "database": os.environ.get("DB_NAME", "factcheck_db"),
}

# A/B 테스트 통계 설정 (PLANNING_v2.md 기준)
P_VALUE_THRESHOLD = 0.15  # 탐색적 접근
MIN_SAMPLE_SIZE = 50  # 최소 pageviews


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
# GA4 데이터 수집
# ============================================

def fetch_ga4_metrics(days: int = 3) -> List[Dict]:
    """
    GA4 Data API에서 최근 N일간 메트릭 조회

    Returns:
        List[Dict]: 글별 메트릭 목록
    """
    client = BetaAnalyticsDataClient()

    # 날짜 범위 계산
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    # GA4 리포트 요청
    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        dimensions=[
            Dimension(name="pagePath"),
        ],
        metrics=[
            Metric(name="averageSessionDuration"),
            Metric(name="bounceRate"),
            Metric(name="screenPageViews"),
            Metric(name="sessions"),
        ],
        dimension_filter=FilterExpression(
            filter=Filter(
                field_name="pagePath",
                string_filter=Filter.StringFilter(
                    match_type=Filter.StringFilter.MatchType.BEGINS_WITH,
                    value="/articles/",
                ),
            )
        ),
    )

    response = client.run_report(request)

    # 결과 파싱
    results = []
    for row in response.rows:
        page_path = row.dimension_values[0].value
        slug = page_path.replace("/articles/", "").rstrip("/")

        if slug:
            results.append({
                "slug": slug,
                "avg_session_duration": float(row.metric_values[0].value or 0),
                "bounce_rate": float(row.metric_values[1].value or 0),
                "pageviews": int(row.metric_values[2].value or 0),
                "sessions": int(row.metric_values[3].value or 0),
            })

    return results


def fetch_scroll_depth_events(days: int = 3) -> Dict[str, Dict]:
    """
    scroll_depth 이벤트 조회

    Returns:
        Dict[slug, {scroll_25, scroll_50, scroll_75, scroll_100}]
    """
    client = BetaAnalyticsDataClient()

    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        dimensions=[
            Dimension(name="customEvent:article_slug"),
            Dimension(name="customEvent:depth"),
        ],
        metrics=[
            Metric(name="eventCount"),
        ],
        dimension_filter=FilterExpression(
            filter=Filter(
                field_name="eventName",
                string_filter=Filter.StringFilter(
                    match_type=Filter.StringFilter.MatchType.EXACT,
                    value="scroll_depth",
                ),
            )
        ),
    )

    try:
        response = client.run_report(request)
    except Exception as e:
        print(f"scroll_depth 이벤트 조회 실패: {e}")
        return {}

    # 결과 파싱
    scroll_data: Dict[str, Dict] = {}
    for row in response.rows:
        slug = row.dimension_values[0].value
        depth = row.dimension_values[1].value
        count = int(row.metric_values[0].value or 0)

        if slug not in scroll_data:
            scroll_data[slug] = {
                "scroll_25_count": 0,
                "scroll_50_count": 0,
                "scroll_75_count": 0,
                "scroll_100_count": 0,
            }

        depth_key = f"scroll_{depth}_count"
        if depth_key in scroll_data[slug]:
            scroll_data[slug][depth_key] = count

    return scroll_data


# ============================================
# 메트릭 저장
# ============================================

def save_metrics(conn, metrics: List[Dict], scroll_data: Dict, date_str: str):
    """
    article_metrics 테이블에 메트릭 저장

    DB 스키마 (001_initial_schema.sql):
    - article_slug, article_version, date (UNIQUE)
    - pageviews, unique_visitors
    - avg_time_on_page, bounce_rate, exit_rate
    - scroll_depth_avg, scroll_25_pct, scroll_50_pct, scroll_75_pct, scroll_100_pct
    - engagement_score
    """
    cursor = conn.cursor()

    for m in metrics:
        slug = m["slug"]
        scroll = scroll_data.get(slug, {})
        total_sessions = m["sessions"] if m["sessions"] > 0 else 1

        # 평균 스크롤 깊이 계산
        scroll_25 = scroll.get("scroll_25_count", 0)
        scroll_50 = scroll.get("scroll_50_count", 0)
        scroll_75 = scroll.get("scroll_75_count", 0)
        scroll_100 = scroll.get("scroll_100_count", 0)

        # 가중 평균 스크롤 깊이
        scroll_depth_avg = (
            (scroll_25 * 25 + scroll_50 * 50 + scroll_75 * 75 + scroll_100 * 100) /
            max(scroll_25 + scroll_50 + scroll_75 + scroll_100, 1)
        )

        # engagement_score 계산
        engagement_score = calculate_engagement_score(
            avg_session_duration=m["avg_session_duration"],
            bounce_rate=m["bounce_rate"],
            pageviews=m["pageviews"],
            scroll_75_count=scroll_75,
            total_sessions=total_sessions,
        )

        # UPSERT 쿼리 (스키마에 맞게 수정)
        cursor.execute("""
            INSERT INTO article_metrics (
                article_slug, article_version, date,
                pageviews, unique_visitors,
                avg_time_on_page, bounce_rate,
                scroll_depth_avg, scroll_25_pct, scroll_50_pct, scroll_75_pct, scroll_100_pct,
                engagement_score
            ) VALUES (
                %s, 'A', %s,
                %s, %s,
                %s, %s,
                %s, %s, %s, %s, %s,
                %s
            )
            ON CONFLICT (article_slug, article_version, date)
            DO UPDATE SET
                pageviews = EXCLUDED.pageviews,
                unique_visitors = EXCLUDED.unique_visitors,
                avg_time_on_page = EXCLUDED.avg_time_on_page,
                bounce_rate = EXCLUDED.bounce_rate,
                scroll_depth_avg = EXCLUDED.scroll_depth_avg,
                scroll_25_pct = EXCLUDED.scroll_25_pct,
                scroll_50_pct = EXCLUDED.scroll_50_pct,
                scroll_75_pct = EXCLUDED.scroll_75_pct,
                scroll_100_pct = EXCLUDED.scroll_100_pct,
                engagement_score = EXCLUDED.engagement_score
        """, (
            slug, date_str,
            m["pageviews"], m["sessions"],  # sessions를 unique_visitors로 사용
            m["avg_session_duration"], m["bounce_rate"],
            scroll_depth_avg, scroll_25, scroll_50, scroll_75, scroll_100,
            engagement_score,
        ))

    conn.commit()
    print(f"[GA4 Collector] {len(metrics)}개 글 메트릭 저장 완료 (date: {date_str})")


def calculate_engagement_score(
    avg_session_duration: float,
    bounce_rate: float,
    pageviews: int,
    scroll_75_count: int,
    total_sessions: int,
) -> float:
    """
    engagement_score 계산 (0-100 스케일)

    가중치 (SPEC-002 기준):
    - 체류시간: 25%
    - 스크롤 75%: 35%
    - 비이탈률: 25%
    - 페이지뷰: 15%
    """
    # 체류시간 정규화 (5분 = 300초 기준, 최대 100)
    duration_score = min(avg_session_duration / 300 * 100, 100)

    # 스크롤 75% 도달률 (세션 대비)
    scroll_75_rate = (scroll_75_count / total_sessions * 100) if total_sessions > 0 else 0
    scroll_score = min(scroll_75_rate, 100)

    # 비이탈률 (bounce_rate는 0-1 범위)
    non_bounce_score = (1 - bounce_rate) * 100

    # 페이지뷰 정규화 (100뷰 기준)
    pageview_score = min(pageviews / 100 * 100, 100)

    # 가중 평균
    score = (
        duration_score * 0.25 +
        scroll_score * 0.35 +
        non_bounce_score * 0.25 +
        pageview_score * 0.15
    )

    return round(score, 4)


# ============================================
# A/B 테스트 평가
# ============================================

def get_running_ab_tests(conn) -> List[Dict]:
    """진행 중인 A/B 테스트 조회"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, article_slug, name, control_version, variant_version
        FROM ab_tests
        WHERE status = 'running'
    """)

    tests = []
    for row in cursor.fetchall():
        tests.append({
            "id": row[0],
            "article_slug": row[1],
            "name": row[2],
            "control_version": row[3],
            "variant_version": row[4],
        })

    return tests


def get_version_metrics(conn, slug: str, version: str) -> Optional[Dict]:
    """버전별 메트릭 조회 (최근 7일)"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            AVG(engagement_score) as avg_score,
            SUM(pageviews) as total_pageviews,
            ARRAY_AGG(engagement_score) as scores
        FROM article_metrics
        WHERE article_slug = %s
          AND article_version = %s
          AND date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY article_slug, article_version
    """, (slug, version))

    row = cursor.fetchone()
    if row:
        return {
            "avg_score": float(row[0]) if row[0] else 0,
            "total_pageviews": int(row[1]) if row[1] else 0,
            "scores": row[2] if row[2] else [],
        }
    return None


def evaluate_ab_test(a_metrics: Dict, b_metrics: Dict) -> Dict:
    """
    A/B 테스트 통계적 유의성 평가

    Returns:
        Dict: {winner, p_value, conclusion, lift}
    """
    # 샘플 크기 확인
    if a_metrics["total_pageviews"] < MIN_SAMPLE_SIZE or b_metrics["total_pageviews"] < MIN_SAMPLE_SIZE:
        return {
            "winner": None,
            "p_value": None,
            "conclusion": "insufficient_data",
            "lift": 0,
        }

    # 스코어 배열 준비
    a_scores = np.array(a_metrics["scores"]) if a_metrics["scores"] else np.array([a_metrics["avg_score"]])
    b_scores = np.array(b_metrics["scores"]) if b_metrics["scores"] else np.array([b_metrics["avg_score"]])

    # Welch's t-test (분산이 다를 수 있으므로)
    try:
        t_stat, p_value = stats.ttest_ind(a_scores, b_scores, equal_var=False)
    except Exception as e:
        print(f"t-test 실패: {e}")
        return {
            "winner": None,
            "p_value": None,
            "conclusion": "error",
            "lift": 0,
        }

    # Lift 계산
    if a_metrics["avg_score"] > 0:
        lift = ((b_metrics["avg_score"] - a_metrics["avg_score"]) / a_metrics["avg_score"]) * 100
    else:
        lift = 0

    # 승자 결정
    if p_value < P_VALUE_THRESHOLD:
        winner = "B" if b_metrics["avg_score"] > a_metrics["avg_score"] else "A"
        conclusion = "significant"
    else:
        winner = None
        conclusion = "inconclusive"

    return {
        "winner": winner,
        "p_value": round(p_value, 4),
        "conclusion": conclusion,
        "lift": round(lift, 2),
        "a_score": round(a_metrics["avg_score"], 4),
        "b_score": round(b_metrics["avg_score"], 4),
    }


def update_ab_test_result(conn, test_id: str, result: Dict):
    """
    A/B 테스트 결과 업데이트

    DB 스키마 (ab_tests):
    - status, started_at, ended_at
    - winner_version, actual_lift, confidence_level
    """
    cursor = conn.cursor()

    if result["conclusion"] == "significant":
        # 유의한 결과 - 테스트 완료
        confidence_level = (1 - result["p_value"]) * 100 if result["p_value"] else None
        cursor.execute("""
            UPDATE ab_tests
            SET
                status = 'completed',
                winner_version = %s,
                actual_lift = %s,
                confidence_level = %s,
                ended_at = NOW(),
                updated_at = NOW()
            WHERE id = %s
        """, (result["winner"], result["lift"], confidence_level, test_id))
    else:
        # 유의하지 않거나 데이터 부족 - 상태 유지, 임시 결과 저장
        cursor.execute("""
            UPDATE ab_tests
            SET
                actual_lift = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (result.get("lift", 0), test_id))

    conn.commit()


def evaluate_all_ab_tests(conn) -> int:
    """
    모든 진행 중인 A/B 테스트 평가

    Returns:
        int: 완료된 테스트 수 (content_analyzer 호출 필요 여부 판단용)
    """
    tests = get_running_ab_tests(conn)
    print(f"[GA4 Collector] {len(tests)}개 A/B 테스트 평가 중...")

    completed_count = 0

    for test in tests:
        a_metrics = get_version_metrics(conn, test["article_slug"], test["control_version"])
        b_metrics = get_version_metrics(conn, test["article_slug"], test["variant_version"])

        if not a_metrics or not b_metrics:
            print(f"  - {test['name']}: 메트릭 없음, 스킵")
            continue

        result = evaluate_ab_test(a_metrics, b_metrics)
        update_ab_test_result(conn, test["id"], result)

        if result["conclusion"] == "significant":
            completed_count += 1

        print(f"  - {test['name']}: {result['conclusion']} (p={result['p_value']}, winner={result['winner']})")

    return completed_count


def trigger_content_analyzer():
    """
    SPEC-003: content_analyzer Cloud Function 호출

    완료된 A/B 테스트가 있으면 분석 트리거
    """
    import requests

    url = os.environ.get(
        "CONTENT_ANALYZER_URL",
        "https://asia-northeast3-galddae-health.cloudfunctions.net/content-analyzer"
    )

    try:
        print(f"[GA4 Collector] Content Analyzer 호출: {url}")
        response = requests.post(url, timeout=60)
        print(f"[GA4 Collector] Content Analyzer 응답: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"[GA4 Collector] Content Analyzer 호출 실패: {e}")
        return False


# ============================================
# Cloud Function 엔트리포인트
# ============================================

@functions_framework.http
def collect_ga4_metrics(request):
    """
    HTTP 트리거 Cloud Function

    Cloud Scheduler에서 3일마다 호출됩니다.
    """
    try:
        print("[GA4 Collector] 시작...")

        # 1. GA4에서 메트릭 수집
        print("[GA4 Collector] GA4 메트릭 수집 중...")
        metrics = fetch_ga4_metrics(days=3)
        scroll_data = fetch_scroll_depth_events(days=3)
        print(f"[GA4 Collector] {len(metrics)}개 글, {len(scroll_data)}개 스크롤 데이터 수집")

        if len(metrics) == 0:
            print("[GA4 Collector] 수집된 메트릭 없음")
            return json.dumps({"status": "success", "metrics_collected": 0, "message": "No data"}), 200

        # 2. DB 연결
        conn = get_db_connection()

        # 3. 메트릭 저장 (오늘 날짜로)
        today = datetime.now().strftime("%Y-%m-%d")
        save_metrics(conn, metrics, scroll_data, today)

        # 4. A/B 테스트 평가
        completed_tests = evaluate_all_ab_tests(conn)

        conn.close()

        # 5. 완료된 테스트가 있으면 Content Analyzer 호출 (SPEC-003)
        analyzer_triggered = False
        if completed_tests > 0:
            print(f"[GA4 Collector] {completed_tests}개 테스트 완료, Content Analyzer 호출")
            analyzer_triggered = trigger_content_analyzer()

        result = {
            "status": "success",
            "metrics_collected": len(metrics),
            "scroll_data_collected": len(scroll_data),
            "date": today,
            "completed_tests": completed_tests,
            "analyzer_triggered": analyzer_triggered,
        }
        print(f"[GA4 Collector] 완료: {json.dumps(result)}")
        return json.dumps(result), 200

    except Exception as e:
        import traceback
        error_msg = f"[GA4 Collector] 오류: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        return json.dumps({"status": "error", "message": str(e)}), 500


# ============================================
# 로컬 테스트
# ============================================

if __name__ == "__main__":
    # 로컬 테스트용
    from flask import Flask, request as flask_request

    app = Flask(__name__)

    @app.route("/", methods=["GET", "POST"])
    def index():
        return collect_ga4_metrics(flask_request)

    print("로컬 서버 시작: http://localhost:8080")
    app.run(port=8080, debug=True)
